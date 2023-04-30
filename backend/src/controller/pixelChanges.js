// Enquanto não tem banco, este arquivo cria um MOCK do que seria uma imagem

import { convertChangeToBase64 } from "../config/changesProtocol.js";


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
		lastChanges.push(convertChangeToBase64(x,y,c));
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