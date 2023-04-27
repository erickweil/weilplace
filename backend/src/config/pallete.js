//import config_pallete from "../../config/pallete.json" assert { type: 'json'};
import { readFileSync } from "fs";
const fileUrl = new URL("../../public/pallete.json", import.meta.url);
const palleteJson = JSON.parse(readFileSync(fileUrl));

const pallete = [];
for(let c of palleteJson.pallete) {
	pallete.push(parseInt(c,16));
}

export default pallete;