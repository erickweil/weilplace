import * as dotenv from "dotenv"; // necessário para leitura do arquivo de variáveis
import PixelSaver from "./src/service/pixelSaver.js";
import { connectToRedis } from "./src/config/redisConnection.js";
import { DELAY_CRON_SAVE, REDIS_ENABLED, initOptions } from "./src/config/options.js";
import PixelChanges from "./src/controller/pixelChanges.js";

dotenv.config();

initOptions();

if(!REDIS_ENABLED) {
	throw new Error("Quando não utiliza redis o serviço do pixel saver é iniciado na mesma instância da api.");
}

// Iniciar conexão com o redis e ligar o controller
let redisClient = await connectToRedis(PixelChanges.getLuaScriptsConfig());
await PixelChanges.init(redisClient);

const cronTask = await PixelSaver.init();

if(cronTask) {
	console.log("Salvando imagem a cada "+DELAY_CRON_SAVE+" segundos");
} else {
	console.log("Não iniciou a cron task");
}