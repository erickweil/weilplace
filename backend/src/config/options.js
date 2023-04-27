import { readFileSync } from "fs";

export let PATH_PICTURE = "";
export let PATH_PALLETE = "";
export let DELAY_CRON_SAVE = 0;
export let SESSION_SECRET = "";
export let PLACE_DELAY = 0;
export let API_URL = "";
export let API_SHARED_SECRET = "";
export let LOG_ROUTES = false;

export let IMAGE_WIDTH = 0;
export let IMAGE_HEIGHT = 0;
export let PALLETE = [];
export let NOMES = {};

export const initOptions = () => {
	PATH_PICTURE = process.env.PATH_PICTURE || "./public/pixels/picture.png";
	PATH_PALLETE = process.env.PATH_PALLETE || "./public/pallete.json";
	DELAY_CRON_SAVE = parseInt(process.env.DELAY_CRON_SAVE) || 10;
	SESSION_SECRET = process.env.SESSION_SECRET || "thisismysecretdonttellanyone!";
	PLACE_DELAY = parseInt(process.env.PLACE_DELAY) || 0;
	IMAGE_WIDTH = parseInt(process.env.IMAGE_WIDTH) || 128;
	IMAGE_HEIGHT = parseInt(process.env.IMAGE_HEIGHT) || 128;
	API_URL = process.env.API_URL || "http://localhost:3001";
	API_SHARED_SECRET = process.env.API_SHARED_SECRET || "thisisanothersecretdonttellanyone!";
	LOG_ROUTES = process.env.LOG_ROUTES == "true";

	const palleteJson = JSON.parse(readFileSync(PATH_PALLETE));

	for(let c of palleteJson.pallete) {
		PALLETE.push(parseInt(c,16));
	}

	const PATH_NOMES = process.env.PATH_NOMES || "./public/nomes.json";
	NOMES = JSON.parse(readFileSync(PATH_NOMES));
};
