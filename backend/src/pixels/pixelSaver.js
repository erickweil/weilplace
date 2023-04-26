// a cada 10 segundos salva a imagem em disco, caso tenha ocorrido modificações na imagem
import cron from "node-cron";

import { convertBytesToBase64, convertTwoInt40bits, convertInt8bits, readTwoInt40bits } from "./bitPacker.js";
import sharp from "sharp";
import pallete from "../config/pallete.js";

class PixelSaver {
    constructor(pixelsChanges,delay) {
        this.imgFilename = false;

        this.imgPixelsBuff = false;
        this.width = 0;
        this.height = 0;

        this.delay = delay;
        this.last_i = -1;

        this.pixelsChanges = pixelsChanges;

        // delay negativo ou igual a 0  desativa o auto-save
        if(this.delay > 0)
        {
            // https://www.npmjs.com/package/node-cron#cron-syntax
            const that = this;
            cron.schedule("*/"+this.delay+" * * * * *", () => {
                that.automaticSave();
            });
        }
    }

    async loadImage(filename) {
        this.imgFilename = filename;
        let imgSharpObj = await sharp(this.imgFilename);
        let imgMetadata = await imgSharpObj.metadata();

        this.imgPixelsBuff = await imgSharpObj.raw().toBuffer();

        this.width = imgMetadata.width;
        this.height = imgMetadata.height;

        console.log("Image [%d,%d] Pallete size:%d",this.width,this.height,pallete.length);
    }

    setSinglePixel(x,y,rgb) {
        const index = y * this.height + x;
        this.imgPixelsBuff[index * 3 + 0] = (rgb >> 16) & 0xFF;
        this.imgPixelsBuff[index * 3 + 1] = (rgb >> 8) & 0xFF;
        this.imgPixelsBuff[index * 3 + 2] = (rgb) & 0xFF;
    }

    getSize() {
        return {width: this.width, height: this.height};
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
        await sharp(
            this.imgPixelsBuff, {
                raw: {
                    width: this.width,
                    height: this.height,
                    channels: 3
                }
            }
        ).png().toFile(this.imgFilename);
    }

    async automaticSave () {
        if(!this.imgPixelsBuff) return;

        const resp = this.pixelsChanges.getChanges(this.last_i);
        if(resp.i != this.last_i) {
            this.last_i = resp.i;

            if(resp.changes)
            {
                console.log("Teve mudanças, Irá salvar...");
                const buffer = Buffer.from(resp.changes,'base64');
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

                        this.setSinglePixel(xy[0],xy[1],pallete[color]);
                    }
                    
                    this.savePicture();
                    this.pixelsChanges.savedIndex = this.last_i;
                } else {
                    console.log("Buffer de tamanho inválido:"+buffer.byteLength);
                }

            }
        }
    }

}

export default PixelSaver;