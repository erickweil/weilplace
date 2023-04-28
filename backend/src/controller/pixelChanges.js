// Enquanto não tem banco, este arquivo cria um MOCK do que seria uma imagem

import { convertBytesToBase64, convertTwoInt40bits, convertInt8bits } from "../util/bitPacker.js";

// vai ser um stream do redis https://redis.io/docs/data-types/streams/
const lastChanges = [];
let savedIndex = 0; // índice do último save no disco

class PixelChanges {

	/*
    setPixel(0,0,0);
    setPixel(255,255,255);
    setPixel(65535,65535,255);
    setPixel(1048575,65535,255);
    setPixel(1048575,1048575,255);
    */
	static setPixel(x,y,c) {
		// 2.5 byte x
		// 2.5 byte y
		// 1 byte color
		// total: 6 bytes. -> 8 chars in base64
		let bytearr = [];
		bytearr.push(...convertTwoInt40bits(x,y));
		bytearr.push(...convertInt8bits(c));

		const base64chang = convertBytesToBase64(bytearr);
		lastChanges.push(base64chang);
	}

	static getChanges(index) {
		const changesLength = lastChanges.length;
		if(index <= -1 || index >= changesLength) {
			return {
				i: savedIndex
			};
		} else {
			return {
				changes: lastChanges.slice(index,changesLength).join(""),
				i: changesLength
			};
		}
	}

	// Usado para registrar que o index de modificações estava com esse valor quando a imagem foi salva a última vez
	static setSavedIndex(index) {
		savedIndex = index;
	}

}

export default PixelChanges;