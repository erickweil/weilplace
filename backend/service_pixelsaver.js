import { REDIS_ENABLED } from "./src/config/options.js";

import PixelSaver from "./src/service/pixelSaver.js";
import { connectToRedis } from "./src/config/redisConnection.js";
import PixelChanges from "./src/controller/pixelChanges.js";

if(!REDIS_ENABLED) {
	throw new Error("Quando não utiliza redis o serviço do pixel saver é iniciado na mesma instância da api.");
}

// Iniciar conexão com o redis e ligar o controller
let redisClient = await connectToRedis(PixelChanges.getLuaScriptsConfig());
await PixelChanges.init(redisClient);

const cronTask = await PixelSaver.init();

if(!cronTask) {
	console.error("Erro ao inicial o Pixel Saver: Não iniciou a cron task");
}