import * as dotenv from "dotenv"; // necessário para leitura do arquivo de variáveis
import makeFetchCookie from "fetch-cookie";
import { API_URL, IMAGE_HEIGHT, IMAGE_WIDTH, PALLETE, initOptions } from "../config/options.js";
import { handlePostPixel } from "../routes/pixelsRoutes.js";
import { haiku } from "../middleware/sessionManager.js";
import { connectToRedis } from "../config/redisConnection.js";
import PixelChanges from "../controller/pixelChanges.js";

dotenv.config();

initOptions();

class BotPlacer {

	constructor(_api_url,_width,_height,_pallete,useNetwork) {
		this.useNetwork = useNetwork;
		if(useNetwork)
			this.cookieFetch = makeFetchCookie(fetch);
		else
			this.username = haiku();

		this.api_url = _api_url;
		this.width = _width;
		this.height = _height;
		this.pallete = _pallete;
		this.color = Math.floor(Math.random()*(this.pallete.length-1));
		this.posx = -1000;
		this.posy = -1000;
	}

	async doPixelPost(x,y,c) {			
		if(this.useNetwork) {	
			const res = await this.cookieFetch(new URL(this.api_url+"/pixel"),{
				method: "POST",
				body: JSON.stringify({x:x, y:y, c:c}),
				headers: { "Content-Type": "application/json" }
			});
			return await res.json();
		} else {
			return await handlePostPixel({
				x:x, y:y, c:c
			},{
				username: this.username
			}).json;
		}
	}

	async randomPlace() {
		//this.posx = this.posx + (Math.floor(Math.random()*3) - 1);
		//this.posy = this.posy + (Math.floor(Math.random()*3) - 1);
		this.posy = this.posy - 1;

		if( this.posy >= this.height || this.posy < 0 ||
			this.posx >= this.width || this.posx < 0) {
			this.posx = Math.floor(Math.random()*(this.width));
			this.posy = Math.floor(Math.random()*(this.height));
		}

		const x = this.posx;
		const y = this.posy;
		const c = this.color;

		return await this.doPixelPost(x,y,c);
	}

}

const spawnBotPlacers = async (quantity,placeInterval,useNetwork) => {

	let redisClient = !useNetwork ?  await connectToRedis(PixelChanges.getLuaScriptsConfig()) : false;

	await PixelChanges.init(redisClient);

	for(let i = 0; i< quantity; i++) {
		const placer = new BotPlacer(API_URL,IMAGE_WIDTH,IMAGE_HEIGHT,PALLETE,useNetwork);
		const randomInterval = Math.floor(Math.random()*placeInterval) + 50;
		setInterval(() => {
			placer.randomPlace();
		},randomInterval);
	}
};


let quantity = 32;
let placeInterval = 10000;
let network = 0;

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
		case "network": 
			network = parseInt(keyvaluepair[1]);
			break;
		}
	});

spawnBotPlacers(quantity,placeInterval,network == 1);