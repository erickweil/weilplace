import { REDIS_ENABLED } from "./src/config/options.js";

import { PixelSaver } from "./src/service/pixelSaver.js";
import { connectToRedis } from "./src/config/redisConnection.js";
import PixelChanges from "./src/controller/pixelChanges.js";

if(!REDIS_ENABLED) {
	throw new Error("Quando não utiliza redis o serviço do pixel saver é iniciado na mesma instância da api.");
}

// Iniciar conexão com o redis e ligar o controller
let redisClient = await connectToRedis(PixelChanges.getLuaScriptsConfig());
await PixelChanges.init(redisClient);

const saver = await PixelSaver.init();
const cronJob = saver.scheduleCron();

if(!cronJob) {
	throw new Error("Erro ao iniciar o cronJob");
}