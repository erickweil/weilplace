import dotenv from "dotenv";
import { readFileSync } from "fs";
import path from "path";
import { palleteJson } from "./pallete.js";

dotenv.config();

const envOrDefault = (k,defvalue) => {
	return k in process.env ? process.env[k] : defvalue; 
};

export const PATH_PICTURE = envOrDefault("PATH_PICTURE","./public/pixels/picture.png");
export const IMAGE_WIDTH = parseInt(envOrDefault("IMAGE_WIDTH","1024"));
export const IMAGE_HEIGHT =  parseInt(envOrDefault("IMAGE_HEIGHT","1024"));

export const REDIS_URL = envOrDefault("REDIS_URL","redis://127.0.0.1:6379");
export const PUBLIC_API_URL = envOrDefault("PUBLIC_API_URL","http://127.0.0.1:3001");
export const API_SHARED_SECRET = envOrDefault("API_SHARED_SECRET","thisismysecretdonttellanyone!");
export const SESSION_SECRET = envOrDefault("SESSION_SECRET","thisisanothersecretdonttellanyone!");	
export const SESSION_MAX_AGE = parseInt(envOrDefault("SESSION_MAX_AGE","86400"));
export const PORT = parseInt(envOrDefault("PORT","3001"));

export const LOG_ROUTES = envOrDefault("LOG_ROUTES","true") === "true";
export const REDIS_ENABLED = envOrDefault("REDIS_ENABLED","false") === "true";
export const WEBSOCKET_ENABLED = envOrDefault("WEBSOCKET_ENABLED","true") === "true";
	
export const PATH_PALLETE = envOrDefault("PATH_PALLETE","./public/pallete.json");
export const PALLETE = [];

const initOptions = () => {	
	//const palleteJson = JSON.parse(readFileSync(path.join(process.cwd(), PATH_PALLETE),"utf8"));

	for(let c of palleteJson.pallete) {
		PALLETE.push(parseInt(c,16));
	}
};
initOptions();