// a cada 10 segundos salva a imagem em disco, caso tenha ocorrido modificações na imagem
import cron from "node-cron";

import sharp from "sharp";
import { API_SHARED_SECRET, API_URL, DELAY_CRON_SAVE, IMAGE_HEIGHT, IMAGE_WIDTH, PALLETE, PATH_PICTURE } from "../config/options.js";

import makeFetchCookie from "fetch-cookie";
import { handlePixelChanges } from "../config/changesProtocol.js";

const cookieFetch = makeFetchCookie(fetch);

let imgPixelsBuff = false;
let last_i = -1;

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
			return cron.schedule("*/"+DELAY_CRON_SAVE+" * * * * *", () => {
				PixelSaver.automaticSave();
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

	static async doChangesGet() {
		//const resp = PixelChanges.getChanges(last_i);
		
		const url = new URL(API_URL+"/changes");
		url.search =  new URLSearchParams({i:last_i});
		const res = await cookieFetch(url,{method:"GET"});
		return await res.json();
	}

	static async doSetSavedIndexPost(saved_i) {				
		//PixelChanges.setSavedIndex(resp.i);
		const res = await cookieFetch(new URL(API_URL+"/setsavedindex"),{
			method: "POST",
			body: JSON.stringify({ i:saved_i, secret: API_SHARED_SECRET }),
			headers: { "Content-Type": "application/json" }
		});
		return await res.json();
	}

	// Depois isso vai consumir a api via rotas normal, http e tal
	static async automaticSave () {
		if(!imgPixelsBuff) return;

		try {
			const resp = await PixelSaver.doChangesGet();
			//console.log(resp);
			const i = parseInt(resp.contents.i);
			const changes = resp.contents.changes;
			if(i != last_i) {
				last_i = i;

				if(PixelSaver.applyChangesOnImage(changes)) {
					console.log("Teve %d pixels modificados, Irá salvar...",changes.length/8);

					if(changes.length % 8 != 0) {
						console.log("Mudanças com tamanho estranho: %d\n%s",changes.length,changes);
					}

					await PixelSaver.savePicture();

					await PixelSaver.doSetSavedIndexPost(i);
				}
			}
		} catch(e) {
			console.log("Erro ao carregar mudanças da imagem:",e);
		}
	}

}

export default PixelSaver;