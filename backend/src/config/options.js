import { readFileSync } from "fs";

export let PATH_PICTURE = "";
export let PATH_PALLETE = "";
export let DELAY_CRON_SAVE = 0;
export let SESSION_SECRET = "";
export let PLACE_DELAY = 0;
export let API_URL = "";
export let API_SHARED_SECRET = "";
export let LOG_ROUTES = false;
export let SESSION_MAX_AGE = 0;
export let PORT = 0;
export let REDIS_ENABLED = false;
export let REDIS_URL = "";
export let REDIS_PREFIX = "";

export let IMAGE_WIDTH = 0;
export let IMAGE_HEIGHT = 0;
export let PALLETE = [];
export let NOMES = {};

export const initOptions = () => {
	PATH_PICTURE = process.env.PATH_PICTURE;
	PATH_PALLETE = process.env.PATH_PALLETE;
	DELAY_CRON_SAVE = parseInt(process.env.DELAY_CRON_SAVE);
	SESSION_SECRET = process.env.SESSION_SECRET;
	PLACE_DELAY = parseInt(process.env.PLACE_DELAY);
	IMAGE_WIDTH = parseInt(process.env.IMAGE_WIDTH);
	IMAGE_HEIGHT = parseInt(process.env.IMAGE_HEIGHT);
	SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE);
	PORT = parseInt(process.env.PORT);
	API_URL = process.env.API_URL;
	API_SHARED_SECRET = process.env.API_SHARED_SECRET;
	LOG_ROUTES = process.env.LOG_ROUTES === "true";
	REDIS_ENABLED = process.env.REDIS_ENABLED === "true";
	REDIS_URL = process.env.REDIS_URL;
	REDIS_PREFIX = process.env.REDIS_PREFIX;

	const palleteJson = JSON.parse(readFileSync(PATH_PALLETE));

	for(let c of palleteJson.pallete) {
		PALLETE.push(parseInt(c,16));
	}

	const PATH_NOMES = process.env.PATH_NOMES;
	NOMES = JSON.parse(readFileSync(PATH_NOMES));
};
