import express from "express";
import cors from "cors";
import session from "express-session";
import RedisStore from "connect-redis";
import http from "http";

import { SESSION_MAX_AGE, SESSION_SECRET, REDIS_ENABLED, WEBSOCKET_ENABLED } from "./config/options.js";

import routes from "./routes/index.js";
import { SessionManager } from "./middleware/sessionManager.js";
import PixelChanges from "./controller/pixelChanges.js";
import { connectToRedis } from "./config/redisConnection.js";
import PixelSaver from "./service/pixelSaver.js";
import initWebSocketServer from "./websocket/websocket.js";

let redisClient = REDIS_ENABLED ?  await connectToRedis(PixelChanges.getLuaScriptsConfig()) : false;

await PixelChanges.init(redisClient);


if(!REDIS_ENABLED) {
	console.log("Iniciando saver na mesma instância já que o redis está desativado...");
	const cronTask = await PixelSaver.init();
}

const app = express();

//initialize a simple http server (Para utilizar websockets precisa fazer assim)
const server = http.createServer(app);

if(process.env.NODE_ENV != "production") // Apenas durante desenvolvimento para testar
{
	app.use(express.static("public"));

    // Só quando é localhost, deve 'fingir' que é https para poder enviar o cookie
    app.use((req,res,next) => {
        //  Secure Flag cannot be set for unproxied localhost #837 
        // https://github.com/expressjs/session/issues/837
        // A ideia é que para o cookie ser enviado, o secure tem que ser true, pois express.session tá com bug
        // que mesmo quando é localhost ele não envia o cookie se secure for false
        if(!req.secure) {
            let objValue = Object.create(null);
            objValue.value = true;
            Object.defineProperty(req, "secure", objValue);
        }
        next();
    });
}

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

// TESTE: para não ficar fazendo log e criando sessão
app.get("/favicon.ico", (req,res) => {
    return res.sendStatus(204);
});


// Depois tem que fazer a sessão salvar no redis
let sessionOptions = {
	secret: SESSION_SECRET,
	resave: true,
	saveUninitialized: true,
	cookie: {
		sameSite: "strict",
		httpOnly: true,
        secure: true,
		maxAge: SESSION_MAX_AGE*1000 // em milissegundos
	}
};
if(REDIS_ENABLED) {
	// Initialize store.
	const redisStore = new RedisStore({
		client: redisClient,
		prefix: "sess:",
		ttl: SESSION_MAX_AGE // ttl is in seconds. https://www.npmjs.com/package/connect-redis#ttl
	});

	sessionOptions.store = redisStore;
}
const sessionParser = session(sessionOptions);
app.use(sessionParser);

app.use(SessionManager.initSession);

// Websockets
if(WEBSOCKET_ENABLED) {
	const wss = initWebSocketServer(server, sessionParser);
}

// Passando para o arquivo de rotas o app, que envia junto uma instância do express
routes(app);

export default server;
