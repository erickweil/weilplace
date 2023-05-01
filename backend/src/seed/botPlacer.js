import * as dotenv from "dotenv"; // necessário para leitura do arquivo de variáveis
import makeFetchCookie from "fetch-cookie";
import { API_URL, IMAGE_HEIGHT, IMAGE_WIDTH, PALLETE, initOptions } from "../config/options.js";

dotenv.config();

initOptions();

class BotPlacer {

	constructor(_api_url,_width,_height,_pallete) {
		this.cookieFetch = makeFetchCookie(fetch);
		this.api_url = _api_url;
		this.width = _width;
		this.height = _height;
		this.pallete = _pallete;
	}

	async doPixelPost(x,y,c) {				
		const res = await this.cookieFetch(new URL(this.api_url+"/pixel"),{
			method: "POST",
			body: JSON.stringify({x:x, y:y, c:c}),
			headers: { "Content-Type": "application/json" }
		});
		return await res.json();
	}

	async randomPlace() {
		const x = Math.floor(Math.random()*(this.width));
		const y = Math.floor(Math.random()*(this.height));
		const c = 0;//Math.floor(Math.random()*(this.pallete.length-1));

		return await this.doPixelPost(x,y,c);
	}

}

const spawnBotPlacers = (quantity,placeInterval) => {
	for(let i = 0; i< quantity; i++) {
		const placer = new BotPlacer(API_URL,IMAGE_WIDTH,IMAGE_HEIGHT,PALLETE);
		const randomInterval = Math.floor(Math.random()*placeInterval) + 100;
		setInterval(() => {
			placer.randomPlace();
		},randomInterval);
	}
};


let quantity = 32;
let placeInterval = 10000;

process.argv.slice(2)
	.map(arg => arg.split("="))
	.forEach((keyvaluepair) => {
		if(keyvaluepair.length != 2) return;
		
		switch(keyvaluepair[0]) {
		case "quantity": 
			quantity = parseInt(keyvaluepair[1]);
			break;
		case "placeInterval": 
			placeInterval = parseInt(keyvaluepair[1]);
			break;
		}
	});

spawnBotPlacers(quantity,placeInterval);