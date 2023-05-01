import express from "express";
import * as dotenv from "dotenv"; // necessário para leitura do arquivo de variáveis
import cors from "cors";
import session from "express-session";
import RedisStore from "connect-redis";

import routes from "./routes/index.js";
import { SESSION_MAX_AGE, LOG_ROUTES, SESSION_SECRET, initOptions, REDIS_ENABLED, REDIS_PREFIX } from "./config/options.js";
import { SessionManager } from "./middleware/sessionManager.js";
import PixelChanges from "./controller/pixelChanges.js";
import { connectToRedis } from "./config/redisConnection.js";
import RedisMock from "./controller/redisMock.js";

dotenv.config();

initOptions();

let redisClient = false;
if(REDIS_ENABLED) {
	redisClient = await connectToRedis();
} else {
	redisClient = new RedisMock();
	console.log("**********************************************************");
	console.log("* Irá guardar mudanças na memória                        *");
	console.log("* NESTE MODO DE OPERAÇÃO APENAS 1 INSTÂNCIA É SUPORTADA! *");
	console.log("**********************************************************");
}

await PixelChanges.init(redisClient);

const app = express();

// Para servir os arquivos publicos
//app.use(express.static("public")); -- Não isso está nas rotas

// Habilita o CORS para todas as origens
app.use(cors({
	// https://stackoverflow.com/questions/19743396/cors-cannot-use-wildcard-in-access-control-allow-origin-when-credentials-flag-i
	origin: (origin,callback) => {
		return callback(null,true);
	},
	exposedHeaders: [
		// Utilizado pela rota /picture, para informar offset de mudanças do último save da imagem
		"X-Changes-Offset"
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

if(LOG_ROUTES) {
	app.use((req,res,next) => {
		const timestamp = new Date().toISOString();

		const username = req.session.username;

		let ip = req.headers["x-forwarded-for"] ||
		req.socket.remoteAddress ||
		null;
   
		console.log(timestamp+" "+ip+" "+username+" "+req.protocol + "://" + req.get("host") + req.originalUrl);
		next();
	});
}

// Passando para o arquivo de rotas o app, que envia junto uma instância do express
routes(app);

export default app;