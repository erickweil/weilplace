// a cada 10 segundos salva a imagem em disco, caso tenha ocorrido modificações na imagem
import cron from "node-cron";

import sharp from "sharp";
import { API_SHARED_SECRET, API_URL, DELAY_CRON_SAVE, IMAGE_HEIGHT, IMAGE_WIDTH, MAX_CHANGES_RESPONSE, MAX_CHANGES_SIZE, PALLETE, PATH_PICTURE, REDIS_ENABLED } from "../config/options.js";

import makeFetchCookie from "fetch-cookie";
import { handlePixelChanges } from "../config/changesProtocol.js";
import { handleGetChanges } from "../routes/pixelsRoutes.js";
import { handleResetChanges, handleSetSavedIndex } from "../routes/privateRoutes.js";

// desativado usar fetch, mas mantido aqui apenas por questão de 'vai que'
const USE_FETCH = false;

const cookieFetch = USE_FETCH ? makeFetchCookie(fetch) : false;

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
		if(!USE_FETCH) {
			const res = await handleGetChanges({i:""+last_i});
			if(res.status == 200) return res.json;
			else throw new Error("Não foi possível completar a requisição:"+res);
		} else {
			const url = new URL(API_URL+"/changes");
			url.search =  new URLSearchParams({i:last_i});
			const res = await cookieFetch(url,{method:"GET"});
			return await res.json();
		}
	}

	static async doSetSavedIndexPost(saved_i) {
		if(!USE_FETCH) {
			const res = await handleSetSavedIndex({i:""+saved_i});
			if(res.status == 200) return res.json;
			else throw new Error("Não foi possível completar a requisição:"+res);
		} else {
			const res = await cookieFetch(new URL(API_URL+"/setsavedindex"),{
				method: "POST",
				body: JSON.stringify({ i:saved_i, secret: API_SHARED_SECRET }),
				headers: { "Content-Type": "application/json" }
			});
			return await res.json();
		}
	}

	static async doResetChangesPost(trim_i) {
		if(!USE_FETCH) {
			const res = await handleResetChanges({i:""+trim_i});
			if(res.status == 200) return res.json;
			else throw new Error("Não foi possível completar a requisição:"+res);
		} else {
			const res = await cookieFetch(new URL(API_URL+"/resetchanges"),{
				method: "POST",
				body: JSON.stringify({ i:trim_i, secret: API_SHARED_SECRET }),
				headers: { "Content-Type": "application/json" }
			});
			return await res.json();
		}
	}

	// retorna verdadeiro se precisa repetir logo em seguida
	static async queryChanges () {
		try {
			const resp = await PixelSaver.doChangesGet();

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
			// Tem que ver isso depois
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

				last_i = 0;
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