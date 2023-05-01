// Enquanto não tem banco, este arquivo cria um MOCK do que seria uma imagem

import { convertChangeToBase64 } from "../config/changesProtocol.js";

import { REDIS_ENABLED, REDIS_PREFIX } from "../config/options.js";
import { connectToRedis } from "../config/redisConnection.js";
import RedisMock from "./redisMock.js";

let KEY_IDENTIFIER = "changesid";
let KEY_SAVEDINDEX = "savedindex";
let KEY_CHANGES = "changes";

// vai ser um stream do redis https://redis.io/docs/data-types/streams/
//const lastChanges = [];
//let savedIndex = 0; // índice do último save no disco
//let identifier = ""+Date.now(); // Para impedir que mudanças sejam aplicadas na imagem errada

let redisClient = false;

class PixelChanges {

	static async init(_redisClient) {
		redisClient = _redisClient;

		if(REDIS_PREFIX && !KEY_IDENTIFIER.startsWith(REDIS_PREFIX)) {
			KEY_IDENTIFIER = REDIS_PREFIX+KEY_IDENTIFIER;
			KEY_SAVEDINDEX = REDIS_PREFIX+KEY_IDENTIFIER;
			KEY_CHANGES = REDIS_PREFIX+KEY_CHANGES;
		}

		const [identifier, savedIndex] = await Promise.all([
			redisClient.GET(KEY_IDENTIFIER),
			redisClient.GET(KEY_SAVEDINDEX),
		]);
		if(!identifier || !savedIndex) {
			console.log("Não tinha nada no redis, iniciando com default",identifier,savedIndex);
			await redisClient.SET(KEY_SAVEDINDEX,""+0);
			await redisClient.SET(KEY_IDENTIFIER,""+Date.now());
			await redisClient.SET(KEY_CHANGES,"");
		} else {
			console.log("Carregou valores do redis: {identifier:%s, savedIndex:%s}",identifier,savedIndex);
		}
	}

	static async setPixel(x,y,c) {
		//lastChanges.push(convertChangeToBase64(x,y,c));
		const changes = convertChangeToBase64(x,y,c);
		if(!changes) return false;

		return await redisClient.APPEND(KEY_CHANGES, changes);
	}

	/** Método que pega as mudanças
	 *  (Obs: 'pixelIndex' deve ser inteiro ao chamar este método)
	 * 
	 *  A chamada ao redis é feita sempre em uma única pipeline,
	 *  gerando assim uma única requisição de rede ao redis, diminuindo o
	 *  tempo perdido esperando a conexão ir e voltar atoa
	 */
	static async getChanges(pixelIndex) {
		//const changesLength = lastChanges.length;

		// Retorna o índice do último save quando solicitado com -1
		if(pixelIndex <= -1 /*|| index > changesLength*/) {

			// lembrar que quase tudo no redis são strings
			const [identifier, savedIndex] = await Promise.all([
				redisClient.GET(KEY_IDENTIFIER),
				redisClient.GET(KEY_SAVEDINDEX),
			]);
			// Retorna o id de quando a imagem foi salva a última vez
			return {
				i: savedIndex,
				identifier: identifier
			};
		}

		//const changesLength = await redisClient.STRLEN(KEY_CHANGES);
		const changesIndex = pixelIndex * 8;
		
		// Executar vários comandos usnado pipelining. NÃO É ATÔMICO (https://github.com/redis/node-redis#auto-pipelining)
		const [identifier, changes] = await Promise.all([
			redisClient.GET(KEY_IDENTIFIER),

			// Pega as mudanças usando -1 para indicar fim da string
			// Fazendo assim é uma operação atômica, não tem como dar modificações incompletas
			// (Obs: Apenas a operação sozinha é atômica, o get ali de cima não
			//  necessariamente foi executados antes)
			redisClient.GETRANGE(KEY_CHANGES,changesIndex,-1)
		]);

		if(!changes) {
			// DEBUG
			if(changes === false || changes === undefined || changes === null) {
				console.log("Erro ao pegar as changes, retornou falso: %s",changes);
			}

			// Problema: se o pixelIndex for maior que as mudanças, só irá retornar que está tudo ok
			// Mas deveria? que situações podem acontecer que causam o pixelIndex ser maior que as mudanças? o identifier resolve todas elas?
			return {
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
			//const changes = lastChanges.slice(index,changesLength).join("");
			//const changes = await redisClient.GETRANGE(KEY_CHANGES,index,changesLength);
			// A soma de quaiquer dois números divisíveis por 8 será também divisível por 8
			// se executou até aqui é porque já temos certeza que 'changesIndex' e 'changes.length' é divisível por 8
			const totalLength = changesIndex + changes.length; 
			const returnPixelIndex = Math.floor(totalLength/8); // O índice retornado é medido em pixels e não em caracteres
			return {
				changes: changes,
				i: returnPixelIndex,
				identifier: identifier
			};
		}
	}

	// Usado para registrar que o index de modificações estava com esse valor quando a imagem foi salva a última vez
	// Só deve pode chamar este método o pixelSaver, não é algo para o público em geral
	static async setSavedIndex(pixelIndex) {
		//savedIndex = index;
		return await redisClient.SET(KEY_SAVEDINDEX,""+pixelIndex);
	}

}

export default PixelChanges;