import express from "express";
import dotenv from "dotenv"; // necessário para leitura do arquivo de variáveis
import cors from "cors";
import session from "express-session";
import RedisStore from "connect-redis";
import http from "http";

import routes from "./routes/index.js";
import { SESSION_MAX_AGE, LOG_ROUTES, SESSION_SECRET, initOptions, REDIS_ENABLED, REDIS_PREFIX, WEBSOCKET_ENABLED } from "./config/options.js";
import { SessionManager } from "./middleware/sessionManager.js";
import PixelChanges from "./controller/pixelChanges.js";
import { connectToRedis } from "./config/redisConnection.js";
import PixelSaver from "./service/pixelSaver.js";
import initWebSocketServer from "./websocket/websocket.js";

dotenv.config();

initOptions();

let redisClient = REDIS_ENABLED ?  await connectToRedis(PixelChanges.getLuaScriptsConfig()) : false;

await PixelChanges.init(redisClient);


if(!REDIS_ENABLED) {
	console.log("Iniciando saver na mesma instância já que o redis está desativado...");
	const cronTask = await PixelSaver.init();
}

const app = express();

//initialize a simple http server (Para utilizar websockets precisa fazer assim)
const server = http.createServer(app);

//if(process.env.NODE_ENV != "production") // Apenas durante desenvolvimento para testar
app.use(express.static("public"));

// Habilita o CORS para todas as origens
app.use(cors({
	// https://stackoverflow.com/questions/19743396/cors-cannot-use-wildcard-in-access-control-allow-origin-when-credentials-flag-i
	origin: (origin,callback) => {
		return callback(null,true);
	},
	exposedHeaders: [
		// Utilizado pela rota /picture, para informar offset de mudanças do último save da imagem
		"X-Changes-Offset",
		"X-Changes-Identifier"
	],
	credentials: true
}));

// habilitando o uso de json pelo express
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Depois tem que fazer a sessão salvar no redis

let sessionOptions = {
	secret: SESSION_SECRET,
	resave: true,
	saveUninitialized: true,
	cookie: {
		sameSite: "strict",
		httpOnly: false,
		maxAge: SESSION_MAX_AGE*1000 // em milissegundos
	}
};
if(REDIS_ENABLED) {
	// Initialize store.
	const redisStore = new RedisStore({
		client: redisClient,
		prefix: (REDIS_PREFIX ? REDIS_PREFIX : "")+"sess:",
		ttl: SESSION_MAX_AGE // ttl is in seconds. https://www.npmjs.com/package/connect-redis#ttl
	});

	sessionOptions.store = redisStore;
}
app.use(session(sessionOptions));

app.use(SessionManager.initSession);

// Websockets
if(WEBSOCKET_ENABLED) {
	const wss = initWebSocketServer(server);
}

// Websockets
if(WEBSOCKET_ENABLED) {
	const wss = initWebSocketServer(server);
}

// Passando para o arquivo de rotas o app, que envia junto uma instância do express
routes(app);

export default server;