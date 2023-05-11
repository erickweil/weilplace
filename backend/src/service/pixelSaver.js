// a cada 10 segundos salva a imagem em disco, caso tenha ocorrido modificações na imagem
import cron from "node-cron";

import sharp from "sharp";
import { copyFile } from "fs";
import makeFetchCookie from "fetch-cookie";

import { API_SHARED_SECRET, API_URL, DELAY_CRON_SAVE, IMAGE_HEIGHT, IMAGE_WIDTH, MAX_CHANGES_RESPONSE, MAX_CHANGES_SIZE, PALLETE, PATH_PICTURE, REDIS_ENABLED, SAVE_HISTORY } from "../config/options.js";
import { handlePixelChanges } from "../config/changesProtocol.js";
import { handleGetChanges, handleGetSavedIndex } from "../routes/pixelsRoutes.js";
import { handleResetChanges, handleSetSavedIndex } from "../routes/privateRoutes.js";

let imgPixelsBuff = false;
let last_i = -1;
let last_identifier = false;

class PixelSaver {
	static async init() {

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

		console.log("Image [%d,%d] Pallete size:%d",IMAGE_WIDTH,IMAGE_HEIGHT,PALLETE.length);

		// delay negativo ou igual a 0  desativa o auto-save
		if(DELAY_CRON_SAVE > 0)
		{
			// https://www.npmjs.com/package/node-cron#cron-syntax
			return cron.schedule("*/"+DELAY_CRON_SAVE+" * * * * *", async () => {
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

		if(SAVE_HISTORY)
		{
			// https://stackoverflow.com/questions/4402934/javascript-time-and-date-getting-the-current-minute-hour-day-week-month-y
			const now = new Date();

			const second = now.getSeconds();
			const minute = now.getMinutes();
			const hour = now.getHours();

			const year = now.getFullYear();
			const month = now.getMonth()+1; // beware: January = 0; February = 1, etc.
			const day = now.getDate();

			const pathWithoutExtension = PATH_PICTURE.substring(0, PATH_PICTURE.lastIndexOf(".")) || PATH_PICTURE;
			const extension =  PATH_PICTURE.substring(PATH_PICTURE.lastIndexOf(".")+1);
			const path2 = pathWithoutExtension+"_"+year+"-"+month+"-"+day+" "+hour+"."+minute+"."+second+"."+extension;

			copyFile(PATH_PICTURE,path2,(err) => {
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
					if(pixelsModificados >= MAX_CHANGES_RESPONSE) return true;			
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
			if(last_i >= MAX_CHANGES_SIZE) {
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