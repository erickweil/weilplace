// Enquanto não tem banco, este arquivo cria um MOCK do que seria uma imagem

import { convertBytesToBase64, convertTwoInt40bits, convertInt8bits } from "./bitPacker.js";

class PixelChanges {

    constructor() {
        // vai ser um stream do redis https://redis.io/docs/data-types/streams/
        this.lastChanges = [];
        this.savedIndex = 0; // índice do último save no disco
    }

    /*
    setPixel(0,0,0);
    setPixel(255,255,255);
    setPixel(65535,65535,255);
    setPixel(1048575,65535,255);
    setPixel(1048575,1048575,255);
    */
    setPixel(x,y,c) {
        //setSinglePixel(x,y,pallete[c]);
        // 2.5 byte x
        // 2.5 byte y
        // 1 byte color
        // total: 6 bytes. -> 8 chars in base64
        let bytearr = [];
        bytearr.push(...convertTwoInt40bits(x,y));
        bytearr.push(...convertInt8bits(c));

        const base64chang = convertBytesToBase64(bytearr);
        this.lastChanges.push(base64chang);
    }

    getChanges(index) {
        const changesLength = this.lastChanges.length;
        if(index <= -1 || index >= changesLength) {
            return {
                i: this.savedIndex
            }
        } else {
            return {
                changes: this.lastChanges.slice(index,changesLength).join(""),
                i: changesLength
            };
        }
    }

}

export default PixelChanges;