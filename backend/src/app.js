import express from "express";
import * as dotenv from "dotenv"; // necessário para leitura do arquivo de variáveis
import cors from "cors";
import session from "express-session";

import routes from "./routes/index.js";

import { SESSION_MAX_AGE, LOG_ROUTES, SESSION_SECRET, initOptions } from "./config/options.js";
import { SessionManager } from "./middleware/sessionManager.js";

dotenv.config();

initOptions();

const app = express();

// Para servir os arquivos publicos
//app.use(express.static("public")); -- Não isso está nas rotas

// Habilita o CORS para todas as origens
app.use(cors({
	exposedHeaders: [
		// Utilizado pela rota /picture, para informar offset de mudanças do último save da imagem
		"X-Changes-Offset"
	]
}));

// habilitando o uso de json pelo express
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Depois tem que fazer a sessão salvar no redis
app.use(session({
	secret: SESSION_SECRET,
	resave: true,
	saveUninitialized: true,
	cookie: {
		sameSite: "strict",
		maxAge: SESSION_MAX_AGE
	}
}));

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