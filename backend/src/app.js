import express from "express";
import routes from "./routes/index.js";
import * as dotenv from "dotenv"; // necessário para leitura do arquivo de variáveis
import cors from "cors";
import PixelSaver from "./pixels/pixelSaver.js";

dotenv.config();

PixelSaver.init(
    process.env.DELAY_CRON_SAVE || 10,
    process.env.PATH_PIXELS_IMG || "./public/pixels.png"
);

const app = express();

// Para servir os arquivos publicos
app.use(express.static('public'));

// Habilita o CORS para todas as origens
app.use(cors());

// habilitando o uso de json pelo express
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Passando para o arquivo de rotas o app, que envia junto uma instância do express
routes(app);

export default app;