// a cada 10 segundos salva a imagem em disco, caso tenha ocorrido modificações na imagem
import cron from "node-cron";

import { convertBytesToBase64, convertTwoInt40bits, convertInt8bits, readTwoInt40bits, convertBase64ToBuffer } from "./bitPacker.js";
import sharp from "sharp";
import pallete from "../config/pallete.js";
import PixelChanges from "./pixelChanges.js";

let imgFilename = false;

let imgPixelsBuff = false;
let width = 0;
let height = 0;

let delay = 0;
let last_i = -1;

class PixelSaver {
	static async init(_delay,_filename) {
		delay = _delay;

		imgFilename = _filename;
		let imgSharpObj = await sharp(imgFilename);
		let imgMetadata = await imgSharpObj.metadata();

		imgPixelsBuff = await imgSharpObj.raw().toBuffer();

		width = imgMetadata.width;
		height = imgMetadata.height;

		console.log("Image [%d,%d] Pallete size:%d",width,height,pallete.length);
		// delay negativo ou igual a 0  desativa o auto-save
		if(delay > 0)
		{
			// https://www.npmjs.com/package/node-cron#cron-syntax
			cron.schedule("*/"+delay+" * * * * *", () => {
				PixelSaver.automaticSave();
			});
		}
	}

	static setSinglePixel(x,y,rgb) {
		const index = y * height + x;
		imgPixelsBuff[index * 3 + 0] = (rgb >> 16) & 0xFF;
		imgPixelsBuff[index * 3 + 1] = (rgb >> 8) & 0xFF;
		imgPixelsBuff[index * 3 + 2] = (rgb) & 0xFF;
	}

	static getSize() {
		return {width: width, height: height};
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
					width: width,
					height: height,
					channels: 3
				}
			}
		).png().toFile(imgFilename);
	}

	static applyChangesOnImage(changes) {

		if(!changes) return false;

		const buffer = convertBase64ToBuffer(changes);
		if(buffer.byteLength % 6 == 0)
		{
			for(let i = 0;i< buffer.byteLength/6;i++)
			{
				let xy = readTwoInt40bits([
					buffer.readUInt8(i*6 + 0),
					buffer.readUInt8(i*6 + 1),
					buffer.readUInt8(i*6 + 2),
					buffer.readUInt8(i*6 + 3),
					buffer.readUInt8(i*6 + 4)]);

				let color = buffer.readUInt8(i*6 + 5);

				PixelSaver.setSinglePixel(xy[0],xy[1],pallete[color]);
			}

			return true;
		} else {
			console.log("Erro ao aplicar mudanças na imagem, buffer de tamanho inválido:"+buffer.byteLength);
			return false;
		}
	}

	static async automaticSave () {
		if(!imgPixelsBuff) return;

		const resp = PixelChanges.getChanges(last_i);
		if(resp.i != last_i) {
			last_i = resp.i;

			if(PixelSaver.applyChangesOnImage(resp.changes)) {
				console.log("Teve mudanças, Irá salvar...");
				await PixelSaver.savePicture();
				PixelChanges.setSavedIndex(resp.i);
			}
		}
	}

}

export default PixelSaver;