// a cada 10 segundos salva a imagem em disco, caso tenha ocorrido modificações na imagem
import cron from "node-cron";

import sharp from "sharp";
import { copyFile } from "fs";

import { IMAGE_HEIGHT, IMAGE_WIDTH, PALLETE, PATH_PICTURE } from "../config/options.js";
import { handlePixelChanges } from "../config/changesProtocol.js";
import { handleGetChanges, handleGetSavedIndex } from "../routes/pixelsRoutes.js";
import { handleResetChanges, handleSetSavedIndex } from "../routes/privateRoutes.js";
// redis_prefix: "REDIS_PREFIX" in process.env ? process.env.REDIS_PREFIX : "",

// Pega do env ou então utiliza os valores padrão.
let options = {
	delay_cron_save: "DELAY_CRON_SAVE" in process.env ? parseInt(process.env.DELAY_CRON_SAVE) : 10,
	/*  O MAX_CHANGES_SIZE controla quando resetar a string de modificações
		causando todos os clientes a re-baixar a imagem. O PixelSaver que faz
		essa verificação, então mesmo que seja 0 vai resetar a cada DELAY_CRON_SAVE
		Já se for um valor muito alto, pode causar uma utilização de memória muito alta
		33554432 modificações (8 bytes cada) equivalem a 256Mb. 
		(Redis limita strings em 512MB por padrão)*/
	max_changes_size: "MAX_CHANGES_SIZE" in process.env ? parseInt(process.env.MAX_CHANGES_SIZE) : 33554432,
	save_history: "SAVE_HISTORY" in process.env ? process.env.SAVE_HISTORY === "true" : true,
};

let imgPixelsBuff = false;
let last_i = -1;
let last_identifier = false;

class PixelSaver {
	static async init(_options) {

		if(_options) {
			options = {...options, ..._options};
		}

		let imgSharpObj = false;
		
		try {
			imgSharpObj = await sharp(PATH_PICTURE);
			let imgMetadata = await imgSharpObj.metadata();

			imgPixelsBuff = await imgSharpObj.raw().toBuffer();

			if(imgMetadata.width != IMAGE_WIDTH || imgMetadata.height != IMAGE_HEIGHT) {
				throw new Error(`Imagem deveria ser ${IMAGE_WIDTH}x${IMAGE_HEIGHT} porém é ${imgMetadata.width}x${imgMetadata.height} abortando...`);
			}
		} catch (e) {
			console.log(e);
			console.log("Criando nova imagem, pois não havia nenhuma");

			imgSharpObj = await sharp({
				create: {
					width: IMAGE_WIDTH,
					height: IMAGE_HEIGHT,
					channels: 3,
					background: {r: 255, g: 255, b: 255}
				}
			});

			imgPixelsBuff = await imgSharpObj.raw().toBuffer();

			await PixelSaver.savePicture();
		}

		console.log("Image(%s) [%d,%d] Pallete size:%d, Save Delay:%d",PATH_PICTURE,IMAGE_WIDTH,IMAGE_HEIGHT,PALLETE.length,options.delay_cron_save);

		// delay negativo ou igual a 0  desativa o auto-save
		if(options.delay_cron_save > 0)
		{
			// https://www.npmjs.com/package/node-cron#cron-syntax
			return cron.schedule("*/"+options.delay_cron_save+" * * * * *", async () => {
				if(!imgPixelsBuff) return;

				let repeat = true;
				let before_i = last_i;
				while(repeat === true) {
					repeat = await PixelSaver.queryChanges();
				}

				// Só salva a imagem se houver mudanças
				if(before_i != -1 && before_i != last_i) {
					await PixelSaver.automaticSave();
				}
			});
		} else return false;
	}

	static setSinglePixel(x,y,rgb) {
		const index = y * IMAGE_HEIGHT + x;
		imgPixelsBuff[index * 3 + 0] = (rgb >> 16) & 0xFF;
		imgPixelsBuff[index * 3 + 1] = (rgb >> 8) & 0xFF;
		imgPixelsBuff[index * 3 + 2] = (rgb) & 0xFF;
	}

	/*async getPicture() {
        const buffer = await sharp(
            this.imgPixelsBuff, {
                raw: {
                    width: this.width,
                    height: this.height,
                    channels: 3
                }
            }
        ).png().toBuffer();

        return buffer;
    }*/

	static async savePicture() {
		await sharp(
			imgPixelsBuff, {
				raw: {
					width: IMAGE_WIDTH,
					height: IMAGE_HEIGHT,
					channels: 3
				}
			}
		).png().toFile(PATH_PICTURE);

		if(options.save_history)
		{
			// https://stackoverflow.com/questions/4402934/javascript-time-and-date-getting-the-current-minute-hour-day-week-month-y
			const now = new Date();

			const second = now.getSeconds();
			const minute = now.getMinutes();
			const hour = now.getHours();

			const year = now.getFullYear();
			const month = now.getMonth()+1; // beware: January = 0; February = 1, etc.
			const day = now.getDate();

			const path = PATH_PICTURE;
			const pathWithoutExtension = path.substring(0, path.lastIndexOf(".")) || path;
			const extension =  path.substring(path.lastIndexOf(".")+1);
			const path2 = pathWithoutExtension+"_"+year+"-"+month+"-"+day+" "+hour+"."+minute+"."+second+"."+extension;

			copyFile(path,path2,(err) => {
				if(err) throw err;
			});
		}
	}

	static applyChangesOnImage(changes) {
		return handlePixelChanges(
			changes,
			PALLETE,
			(rgb,x,y) => {
				PixelSaver.setSinglePixel(x,y,rgb);
			}
		);
	}

	static async doChangesGet(i) {		
		const res = await handleGetChanges({i:""+i});
		if(res.status == 200) return res.json;
		else throw new Error("Não foi possível completar a requisição:"+res);
	}

	static async doSavedIndexGet() {		
		const res = await handleGetSavedIndex();
		if(res.status == 200) return res.json;
		else throw new Error("Não foi possível completar a requisição:"+res);
	}

	static async doSetSavedIndexPost(saved_i) {
		const res = await handleSetSavedIndex({i:""+saved_i});
		if(res.status == 200) return res.json;
		else throw new Error("Não foi possível completar a requisição:"+res);
	}

	static async doResetChangesPost(trim_i) {
		const res = await handleResetChanges({i:""+trim_i});
		if(res.status == 200) return res.json;
		else throw new Error("Não foi possível completar a requisição:"+res);
	}

	// retorna verdadeiro se precisa repetir logo em seguida
	static async queryChanges () {
		try {
			const resp = last_i >= 0 ? await PixelSaver.doChangesGet(last_i) : await PixelSaver.doSavedIndexGet();

			if(!resp 
				|| resp.i === undefined 
				|| resp.identifier === undefined 
			) {
				console.log("Erro ao realizar changesGet, resposta sem valores necessários:",resp);
				return false;
			}
			//console.log(resp);
			const i = parseInt(resp.i);
			const changes = resp.changes;
			const identifier = resp.identifier;
			const more = resp.more;

			// resetou o stream de mudanças
			// Tem que ver isso depois, ta certo colocar 0???
			if(last_identifier !== false && identifier != last_identifier) {
				console.log("Atualizou identifier. resetando index");
				last_i = 0;
				last_identifier = identifier;
				return false;
			}

			if(i != last_i) {
				last_i = i;
				last_identifier = identifier;

				if(PixelSaver.applyChangesOnImage(changes)) {
					const pixelsModificados = Math.floor(changes.length/8);
					console.log("Teve %d pixels modificados",pixelsModificados);

					if(changes.length % 8 != 0) {
						console.log("Mudanças com tamanho estranho: %d\n%s",changes.length,changes);
					}

					// vai repetir para pegar mais modificações que faltaram
					if(more) return true;			
				}
			}

			return false;
		} catch(e) {
			console.log("Erro ao carregar mudanças da imagem:",e);
			return false;
		}
	}

	static async automaticSave() {
		try {
			console.log("Salvando imagem...");
			await PixelSaver.savePicture();

			// Reseta as modificações se ficou muito grande
			if(last_i >= options.max_changes_size) {
				console.log("Chegou no limite de modificações(i = %d), resetando modificações...",last_i);
				const resetresp = await PixelSaver.doResetChangesPost(last_i);

				last_i = 0; // Já que resetou é seguro por 0 né?
				last_identifier = resetresp.identifier;
			} else {
				await PixelSaver.doSetSavedIndexPost(last_i);
			}
		} catch(e) {
			console.log("Erro ao aplicar as mudanças da imagem:",e);
		}
	}

}

export default PixelSaver;