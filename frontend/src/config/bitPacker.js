// Manter sincronizado com o backend
import { Buffer } from "buffer";

// A ideia é manipular bit a bit de forma fácil

export const convertInt8bits = (value) => {
	return [
		value & 0xFF
	];
};

export const convertInt16bits = (value) => {
	return [
		value & 0xFF,
		(value >> 8) & 0xFF
	];
};

export const convertInt32bits = (value) => {
	return [
		value & 0xFF,
		(value >> 8) & 0xFF,
		(value >> 16) & 0xFF,
		(value >> 24) & 0xFF,
	];
};

export const convertTwoInt40bits = (a,b) => {
	return [
		a & 0xFF,
		(a >> 8) & 0xFF,

		b & 0xFF,
		(b >> 8) & 0xFF,

		// a and b '0x0F0000' bits are packed in the same byte
		(((a >> 16) & 0x0F) << 4) | ((b >> 16) & 0x0F),
	];
};

export const readTwoInt40bits = (bytes) => {
	const a = bytes[0] | (bytes[1] << 8) | (((bytes[4]&0xF0) >> 4) << 16);
	const b = bytes[2] | (bytes[3] << 8) | (( bytes[4]&0x0F)  << 16);
	return [a,b];
};

export const convertBytesToBase64 = (byteArr) => {
	return Buffer.from(byteArr).toString("base64");
};

export const convertBase64ToBuffer = (base64) => {
	return Buffer.from(base64,"base64");
};