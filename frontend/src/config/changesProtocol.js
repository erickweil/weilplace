// Manter sincronizado com o backend
import { convertBase64ToBuffer, readTwoInt40bits } from "@/config/bitPacker";

// Retorna verdadeiro caso tenha mudado algum pixel
export const handlePixelChanges = (changes,pallete,drawPixelCallback) => {
	if(!changes) return false;

	const buffer = convertBase64ToBuffer(changes);
	if(buffer.byteLength % 6 == 0) {
		for(let i = 0;i< buffer.byteLength/6;i++) {
			let xy = readTwoInt40bits([
				buffer.readUInt8(i*6 + 0),
				buffer.readUInt8(i*6 + 1),
				buffer.readUInt8(i*6 + 2),
				buffer.readUInt8(i*6 + 3),
				buffer.readUInt8(i*6 + 4)]);

			let color = buffer.readUInt8(i*6 + 5);

			drawPixelCallback(pallete[color],xy[0],xy[1]);
		}
		return true;
	} else {
		console.log("Erro ao aplicar mudanças na imagem, buffer de tamanho inválido:"+buffer.byteLength);
		return false;
	}
}

export const convertChangeToBase64 = (x,y,c) => {
	// 2.5 byte x
	// 2.5 byte y
	// 1 byte color
	// total: 6 bytes. -> 8 chars in base64
	let bytearr = [];
	bytearr.push(...convertTwoInt40bits(x,y));
	bytearr.push(...convertInt8bits(c));

	const base64chang = convertBytesToBase64(bytearr);

	return base64chang;
};