import { convertChangeToBase64 } from "../config/changesProtocol.js";
import RedisMock from "./redisMock.js";
import { defineScript, createClient, commandOptions } from "redis";
import { DISABLE_FILESYSTEM, IMAGE_HEIGHT, IMAGE_WIDTH, PALLETE } from "../config/options.js";
import { handleApplyChanges } from "../routes/privateRoutes.js";

let KEY_IDENTIFIER = "changesid";
let KEY_SAVEDINDEX = "savedindex";
let KEY_CHANGES = "changes";
let KEY_USERTIMES = "usertimes"; // armazena o timestamp da última vez que colocou o pixel
let KEY_PICTURE = "picture"; // a imagem salva (se não usar filesystem)

let options = {
	redis_prefix: "REDIS_PREFIX" in process.env ? process.env.REDIS_PREFIX : "",
	place_delay: "PLACE_DELAY" in process.env ? parseInt(process.env.PLACE_DELAY) : 0,
	/*  O MAX_CHANGES_RESPONSE indica o tamanho de resposta máximo
		que será dado ao cliente ao solicitar as modificações, mesmo que haja mais.
		Este valor deve ser medido de acordo com cuidado,
		8192 modificações equivale a uma string base64 de ~ 64kb
		Nada impede o cliente de solicitar a string inteira desde
		o índice 0, para evitar DoS seria bom não deixar esse valor
		muito alto*/
	max_changes_response: "MAX_CHANGES_RESPONSE" in process.env ? parseInt(process.env.MAX_CHANGES_RESPONSE) : 8192,
	pixel_saver_call: "PIXEL_SAVER_CALL" in process.env ? process.env.PIXEL_SAVER_CALL === "true" : false
};

/** @type {ReturnType<createClient>} */
let redisClient = false;
/*
-- O que este comando faz é então de forma atômica:
-- 1. pega as mudanças desde o trimindex
-- 2. seta as mudanças com o intervalo obtido
-- 3. registra o novo identificador
-- 4. registra o novo índice do último save
*/
const resetChangesScript = "\n"+
"local key_changes = KEYS[1];\n"+
"local key_identifier = KEYS[2];\n"+
"local key_savedindex = KEYS[3];\n"+
"\n"+
"local trimindex = ARGV[1];\n"+
"local newidentifier = ARGV[2];\n"+
"local newsavedindex = ARGV[3];\n"+
"\n"+
"local changes = redis.call('GETRANGE',key_changes,trimindex,-1);\n"+
"redis.call('SET',key_changes,changes);\n"+
"redis.call('SET',key_identifier,newidentifier);\n"+
"redis.call('SET',key_savedindex,newsavedindex);\n"+
"\n"+
"return 'OK' ";
/** Gerencia as modificações nos pixels
 *  Utiliza uma string de mudanças que cresce conforme novas modificações são feitas
 *  A string inteira é codificada em base64, mas a cada append são colocados exatamente
 *  8 caracteres, que é a quantidade necessária para armazenar 6 bytes 
 *  
 *  Nesses 6 bytes está codificado a posição x e y com 20 bits cada um e a cor com 8 bits (total 48 bits)
 *  Não é necessário re-codificar a inteira string a cada append, no caso é seguro concatenar os 8 caracteres
 *  cada vez. Inclusive é certo que será uma string base64 válida a cada 8 caracteres, sendo possível extrair partes
 * 
 *  A forma como o cliente irá utilizar é que ele começa com o pedido do índice, seja por extrair do header ao baixar a imagem
 *  ou por chamar o getChanges(-1).
 *  Em seguida chama o getChanges(indice) onde indice é o valor recebido anteriormente. A cada resposta o índice é atualizado para
 *  o tamanho atual. Cada getCanges pode ser uma resposta indicando que não houve mudanças, ou uma resposta com uma string base64
 *  que pode ser desde 8 caracteres até Megabytes de tamanho, dependendo do intervalo extraído (Futuramente irá analizar como resetar as mudanças periodicamente).
 *  O texto das mudanças é salvo no redis como uma única string, e acessado com o GETRANGE(indice,-1) para extrair o novo intervalo. 
 * 
 *  Obs: Se não especificar uma conexão do redis, irá guardar as mudanças na memória, com o RedisMock.
 */
class PixelChanges {

	/** Especifique a conexão do redis ou então falso para guardar as mudanças na memória
	*/
	static calledInit = false;
	static async init(_redisClient, _options) {
		if(PixelChanges.calledInit) {
			throw new Error("PixelChanges já foi inicializado, deve chamá-lo apenas uma vez.");
		}
		PixelChanges.calledInit = true;

		if(_options) {
			options = {...options, ..._options};
		}

		if(!_redisClient) {
			redisClient = new RedisMock();
			console.log("**********************************************************");
			console.log("* Irá guardar mudanças na memória                        *");
			console.log("* NESTE MODO DE OPERAÇÃO APENAS 1 INSTÂNCIA É SUPORTADA! *");
			console.log("**********************************************************");
		} else {
			redisClient = _redisClient;
		}

		if(options.redis_prefix && !KEY_IDENTIFIER.startsWith(options.redis_prefix)) {
			KEY_IDENTIFIER = options.redis_prefix+KEY_IDENTIFIER;
			KEY_SAVEDINDEX = options.redis_prefix+KEY_SAVEDINDEX;
			KEY_CHANGES = options.redis_prefix+KEY_CHANGES;
			KEY_USERTIMES = options.redis_prefix+KEY_USERTIMES;
			KEY_PICTURE = options.redis_prefix+KEY_PICTURE;
		}

		const [identifier, savedIndex] =  await redisClient.MGET([KEY_IDENTIFIER,KEY_SAVEDINDEX]);
		if(!identifier || savedIndex === null) {
			console.log("Não tinha nada no redis, iniciando com default",identifier,savedIndex);
			await redisClient.MSET([
				KEY_SAVEDINDEX,""+0, // index do último save (já está dividido por 8)
				KEY_IDENTIFIER,""+Date.now(), // identifier para fazer o cliente detectar que resetou as mudanças
				KEY_CHANGES,""
			]);
		} else {
			console.log("Carregou valores do redis: {identifier:%s, savedIndex:%s}",identifier,savedIndex);
		}
	}

	static getLuaScriptsConfig() {
		return {
			// https://www.npmjs.com/package/redis?activeTab=readme#Programmability
			// https://github.com/redis/node-redis/blob/master/examples/lua-multi-incr.js
			resetchanges: defineScript({
				NUMBER_OF_KEYS: 3,
				//SCRIPT: readFileSync("./lua/resetChanges.lua","utf8"),
				SCRIPT: resetChangesScript,
				transformArguments(key1,key2,key3,arg1,arg2,arg3) {
					return [key1,key2,key3,""+arg1,""+arg2,""+arg3];
				},
				transformReply(reply) {
					return reply;
				}
			})
		};
	}

	static async setPixel(username,x,y,c) {
		// Impedir colocar pixels fora do canvas
		if( x < 0 || x >= IMAGE_WIDTH ||
			y < 0 || y >= IMAGE_HEIGHT ||
			c < 0 || c >= PALLETE.length
		) return {
			error: "Parâmetros fora do intervalo aceito."
		};

		// Impedir que coloque pixels sem esperar um tempo
		// Possível problema: Como primeiro pega o tempo e depois seta o pixel,
		// se mandar requisições simultâneas pode acontecer de setar mais de um pixel devido
		// à condição de corrida de verificarem ao mesmo tempo?
		if(options.place_delay > 0)
		{
			let timeLastPlaced = await redisClient.HGET(KEY_USERTIMES,username);
			if(timeLastPlaced === null) timeLastPlaced = "-1";

			timeLastPlaced = parseInt(timeLastPlaced);

			//let timeLastPlaced = session.lastPlaced || -1;

			if(timeLastPlaced > 0)
			{
				let timeElapsed = (Date.now() -  timeLastPlaced);

				// Caso não esperou o suficiente responde com quanto tempo falta em segundos
				if(timeElapsed < options.place_delay) {
					return {
						message: "DELAY",
						delay: Math.ceil((options.place_delay - timeElapsed)/1000)
					};
				}
			}

			// registra o tempo atual como última vez que colocou pixels
			//session.lastPlaced = Date.now();
			await redisClient.HSET(KEY_USERTIMES,username,""+Date.now());
		}

		const changes = convertChangeToBase64(x,y,c);
		if(!changes) return {
			error: "Erro ao converter os valores para base64"
		};

		await redisClient.APPEND(KEY_CHANGES, changes);

		// 1 a cada 100 vezes chama o pixel saver
		if(options.pixel_saver_call && Math.random() > 0.99) {
			setTimeout(async () => {
				console.log(await handleApplyChanges());
			},0);
		}

		return {
			message: "OK",
			delay: options.place_delay
		};
	}

	/** Método que pega o último index salvo. Para que saiba a partir da onde aplicar as mudanças
	 */
	static async getSavedIndex() {
		// Não ser atômico aqui pode ser um problema, considere receber um identifier novo porém o savedindex antigo
		/*const [identifier, savedIndex] = await Promise.all([
			redisClient.GET(KEY_IDENTIFIER),
			redisClient.GET(KEY_SAVEDINDEX),
		]);*/

		const ret = await redisClient.MGET([KEY_IDENTIFIER,KEY_SAVEDINDEX]);
		// Retorna o id de quando a imagem foi salva a última vez
		return {
			message: "OK",
			identifier: ret[0],
			i: ret[1]
		};
	}

	/** Método que pega as mudanças
	 *  (Obs: 'pixelIndex' deve ser inteiro e maior ou igual a 0 ao chamar este método)
	 * 
	 *  A chamada ao redis é feita sempre em uma única pipeline,
	 *  gerando assim uma única requisição de rede ao redis, diminuindo o
	 *  tempo perdido esperando a conexão ir e voltar atoa
	 */
	static async getChanges(pixelIndex) {
		const changesIndex = pixelIndex * 8;
		
		// Executar vários comandos usnado pipelining. NÃO É ATÔMICO (https://github.com/redis/node-redis#auto-pipelining)
		// O fato de não ser atômico aqui não é problema... 
		// se receber o identifier antigo e changes novas no máximo vai levar 1 requisição a mais para atualizar
		// e se receber o identifier novo vai ignorar as changes e atualizar
		const [identifier, changes] = await Promise.all([
			redisClient.GET(KEY_IDENTIFIER),

			// Pega as mudanças usando -1 para indicar fim da string
			// Fazendo assim é uma operação atômica, não tem como dar modificações incompletas
			// (Obs: Apenas a operação sozinha é atômica, o get ali de cima não
			//  necessariamente foi executados antes)
			// Pode ser que o tamanho desse changes seja na ordem de Megabytes, e por isso,
			// em vez de pegar assim, com -1 indicando que irá obter até o fim da string:
			// redisClient.GETRANGE(KEY_CHANGES,changesIndex,-1)
			// vai pegar as modificações assim:
			redisClient.GETRANGE(KEY_CHANGES,changesIndex,changesIndex+(options.max_changes_response*8 -1)) // -1 pq é inclusivo o índice
			// https://redis.io/commands/getrange/
			// 	'The function handles out of range requests by limiting the resulting range to the actual length of the string.'
			// O jeito que o GETRANGE funciona é que o index do fim é limitado ao tamanho da string, então
			// é como se tivesse dizendo 'quero até esse tanto aqui, ou até o fim se passar'
		]);

		if(!changes) {
			// DEBUG
			if(changes === false || changes === undefined || changes === null) {
				console.log("Erro ao pegar as changes, retornou falso: %s",changes);
			}

			// Problema: se o pixelIndex for maior que as mudanças, só irá retornar que está tudo ok
			// Mas deveria? que situações podem acontecer que causam o pixelIndex ser maior que as mudanças? o identifier resolve todas elas?
			return {
				message: "OK",
				i: pixelIndex, // continua no mesmo index pq n tem mudanças
				identifier: identifier
			};
		} else {
			// NÃO PODE EM HIPÓTESE NENHUMA RETORNAR MUDANÇAS INVÁLIDAS, 
			// CAUSA ERRO NO CLIENTE SE ISSO ACONTECER. GARANTIR QUE ESTE ERRO NUNCA ACONTEÇA
			if(changes.length % 8 != 0) {
				return {
					error: "Erro interno ao obter as mudanças, tamanho não é múltiplo de 8:"+changes.length
				};	
			}
			// A soma de quaiquer dois números divisíveis por 8 será também divisível por 8
			// se executou até aqui é porque já temos certeza que 'changesIndex' e 'changes.length' é divisível por 8
			const totalLength = changesIndex + changes.length; 
			const returnPixelIndex = Math.floor(totalLength/8); // O índice retornado é medido em pixels e não em caracteres
			return {
				message: "OK",
				changes: changes,
				more: (changes.length >= options.max_changes_response*8), // para indicar que tem mais para ler ainda
				i: returnPixelIndex,
				identifier: identifier
			};
		}
	}

	// Usado para registrar que o index de modificações estava com esse valor quando a imagem foi salva a última vez
	// Só deve pode chamar este método o pixelSaver, não é algo para o público em geral
	static async setSavedIndex(pixelIndex) {
		return await redisClient.SET(KEY_SAVEDINDEX,""+pixelIndex);
	}

	// Para reiniciar as modificações
	// A ideia é chamar o resetChanges logo após salvar a imagem
	// porém desde ter salvo a imagem até agora pode ter acontecido mudanças
	//
	// O que este comando faz é então de forma atômica em uma transação:
	// 1. pega as mudanças desde o último save informado
	// 2. setá-las como o novo valor
	// 3. registra o identificador
	// 4. registra o índice do último save como 0
	// Só deve pode chamar este método o pixelSaver, não é algo para o público em geral
	static async resetChanges(trimPixelIndex) {
		// https://github.com/redis/node-redis/blob/master/docs/isolated-execution.md
		// https://dev.to/itsvinayak/lua-script-in-redis-using-noderedis-147f
		// https://redis.io/docs/manual/programmability/eval-intro/
		// https://redis.io/docs/manual/programmability/lua-api/
		// Vai usar lua scripts
		
		const trimIndex = trimPixelIndex * 8;
		const newIdentifier = ""+Date.now();

		const status = await redisClient.resetchanges(
			KEY_CHANGES,
			KEY_IDENTIFIER,
			KEY_SAVEDINDEX,
			trimIndex,
			newIdentifier,
			0
		);

		return {
			message: status,
			identifier: newIdentifier
		};
	}

	// -----------------------------------
	// usado quando desativa o filesystem
	// -----------------------------------

	// Obtêm a imagem salva no redis
	static async getPicture() {
		return await redisClient.GET(commandOptions({ returnBuffers: true }), KEY_PICTURE);
	}

	// Salva a imagem no redis
	static async savePicture(picture) {
		return await redisClient.SET(KEY_PICTURE,picture);
	}
}

export default PixelChanges;