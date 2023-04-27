import * as dotenv from "dotenv"; // necessário para leitura do arquivo de variáveis
import PixelSaver from "./src/service/pixelSaver.js";
import { DELAY_CRON_SAVE, initOptions } from "./src/config/options.js";

dotenv.config();

initOptions();

const cronTask = await PixelSaver.init();

if(cronTask) {
	console.log("Salvando imagem a cada "+DELAY_CRON_SAVE+" segundos");
} else {
	console.log("Não iniciou a cron task");
}