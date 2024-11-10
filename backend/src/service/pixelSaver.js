// a cada 10 segundos salva a imagem em disco, caso tenha ocorrido modificações na imagem
import cron from "node-cron";

import sharp from "sharp";

import { DISABLE_FILESYSTEM, IMAGE_HEIGHT, IMAGE_WIDTH, PALLETE, PATH_PICTURE } from "../config/options.js";
import { handlePixelChanges } from "../config/changesProtocol.js";
import { handleGetChanges, handleGetPicureFromRedis, handleGetSavedIndex } from "../routes/pixelsRoutes.js";
import { handleResetChanges, handleSavePicture, handleSetSavedIndex } from "../routes/privateRoutes.js";
import PixelHistory from "../controller/pixelHistory.js";
// redis_prefix: "REDIS_PREFIX" in process.env ? process.env.REDIS_PREFIX : "",

// Pega do env ou então utiliza os valores padrão.
const defaultOptions = {
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

export class PixelSaver {
	static async _loadImage(pngBuff) {
		let imgSharpObj = await sharp(pngBuff);
		let imgMetadata = await imgSharpObj.metadata();
		let loadedBuffer = await imgSharpObj.raw().toBuffer();

		console.log("Metadata:", imgMetadata);
		if(imgMetadata.width != IMAGE_WIDTH || imgMetadata.height != IMAGE_HEIGHT) {
			throw new Error(`Imagem deveria ser ${IMAGE_WIDTH}x${IMAGE_HEIGHT} porém é ${imgMetadata.width}x${imgMetadata.height} abortando...`);
		}

		return loadedBuffer;
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

	static async doSavePicturePost(picture) {
		const res = await handleSavePicture({picture: picture});
		if(res.status == 200) return res.json;
		else throw new Error("Não foi possível completar a requisição:"+res);
	}

	//options;
	//** @type {Buffer} */
	//imgPixelsBuff;
	//** @type {number} */
	//last_i;
	//** @type {string|null} */
	//last_identifier;
	static async init(pngBuffer = null, last_i = -1, last_identifier = null, _options = defaultOptions) {
		let imgPixelsBuff;
		try {
			if(DISABLE_FILESYSTEM || pngBuffer) {
				if(!pngBuffer) {
					let responseGet = await handleGetPicureFromRedis();
					if(responseGet.status != 200) {
						throw new Error("Erro ao pegar a imagem do redis:"+JSON.stringify(responseGet, null, 2));
					}
					pngBuffer = responseGet.body;
				}

				imgPixelsBuff = await PixelSaver._loadImage(pngBuffer);
			} else {
				imgPixelsBuff = await PixelSaver._loadImage(PATH_PICTURE);
			}
		} catch(e) {
			console.error("Erro ao carregar a imagem: ",e);
		}

		let newImage = false;
		if(!imgPixelsBuff) {
			console.log("Criando nova imagem, pois não havia nenhuma");

			let imgSharpObj = await sharp({
				create: {
					width: IMAGE_WIDTH,
					height: IMAGE_HEIGHT,
					channels: 3,
					background: {r: 255, g: 255, b: 255}
				}
			});

			imgPixelsBuff = await imgSharpObj.raw().toBuffer();
			newImage = true;
		}
		
		const saver = new PixelSaver(imgPixelsBuff, last_i, last_identifier, _options);
		
		if(newImage) {
			await saver.savePicture();
		}
		
		return saver;
	}

	constructor(imgPixelsBuff, last_i = -1, last_identifier = null, _options = defaultOptions) {
		this.options = {...defaultOptions, ..._options};

		this.imgPixelsBuff = imgPixelsBuff;
		this.last_i = last_i;
		this.last_identifier = last_identifier;

		console.log("Image(%s) [%d,%d] Pallete size:%d, Save Delay:%d",PATH_PICTURE,IMAGE_WIDTH,IMAGE_HEIGHT,PALLETE.length,this.options.delay_cron_save);
	}

	scheduleCron() {
		// delay negativo ou igual a 0  desativa o auto-save
		if(this.options.delay_cron_save > 0)
		{
			// https://www.npmjs.com/package/node-cron#cron-syntax
			return cron.schedule("*/"+this.options.delay_cron_save+" * * * * *", () => {
				this.cronTask();
			});
		}
	}

	async cronTask(changesResp = null) {
		if(!this.imgPixelsBuff) return null;

		let repeat = true;
		let before_i = this.last_i;
		while(repeat === true) {
			repeat = await this.queryChanges(changesResp);
		}

		// Só salva a imagem se houver mudanças
		if(before_i != -1 && before_i != this.last_i) {
			return await this.automaticSave();
		} else {
			return null;
		}
	}

	setSinglePixel(x,y,rgb) {
		const index = y * IMAGE_HEIGHT + x;
		this.imgPixelsBuff[index * 3 + 0] = (rgb >> 16) & 0xFF;
		this.imgPixelsBuff[index * 3 + 1] = (rgb >> 8) & 0xFF;
		this.imgPixelsBuff[index * 3 + 2] = (rgb) & 0xFF;
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

	async savePicture() {
		let imgSharpObj = sharp(
			this.imgPixelsBuff, {
				raw: {
					width: IMAGE_WIDTH,
					height: IMAGE_HEIGHT,
					channels: 3
				}
			}
		)
		.png();
		/*.withMetadata({
			exif: {
				IFD0: {
					Copyright: JSON.stringify({
						identifier: identifier,
						offset: i
					})
				}
			}
		})*/
		if(DISABLE_FILESYSTEM) {
			// Obtêm o Buffer da imagem
			let imgPngBuffer = await imgSharpObj.toBuffer();
			// envia o Buffer para o redis
			await PixelSaver.doSavePicturePost(imgPngBuffer);

			return imgPngBuffer;
		} else {
			let fileInfo = await imgSharpObj.toFile(PATH_PICTURE);

			if(this.options.save_history)
			{
				await PixelHistory.saveHistoryPicture();
			}

			return fileInfo;
		}
	}

	applyChangesOnImage(changes) {
		return handlePixelChanges(
			changes,
			PALLETE,
			(rgb,x,y) => {
				this.setSinglePixel(x,y,rgb);
			}
		);
	}

	// retorna verdadeiro se precisa repetir logo em seguida
	async queryChanges(changesResp = null) {
		try {
			const resp = changesResp || (this.last_i >= 0 ? await PixelSaver.doChangesGet(this.last_i) : await PixelSaver.doSavedIndexGet());

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
			if(this.last_identifier && identifier != this.last_identifier) {
				console.log("Atualizou identifier. resetando index");
				this.last_i = 0;
				this.last_identifier = identifier;
				return false;
			}

			if(i != this.last_i) {
				this.last_i = i;
				this.last_identifier = identifier;

				if(this.applyChangesOnImage(changes)) {
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

	async automaticSave() {
		try {
			console.log("Salvando imagem...");
			let imgPngBuff = await this.savePicture();

			// Reseta as modificações se ficou muito grande
			if(this.last_i >= this.options.max_changes_size) {
				console.log("Chegou no limite de modificações(i = %d), resetando modificações...",this.last_i);
				const resetresp = await PixelSaver.doResetChangesPost(this.last_i);

				this.last_i = 0; // Já que resetou é seguro por 0 né?
				this.last_identifier = resetresp.identifier;
			} else {
				await PixelSaver.doSetSavedIndexPost(this.last_i);
			}

			return imgPngBuff;
		} catch(e) {
			console.log("Erro ao aplicar as mudanças da imagem:",e);
		}
	}
}