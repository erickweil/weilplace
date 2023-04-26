import express from "express";
import routes from "./routes/index.js";
import * as dotenv from 'dotenv'; // necessário para leitura do arquivo de variáveis
import cors from 'cors';
import PixelSaver from "./pixels/pixelSaver.js";
import PixelChanges from "./pixels/pixelChanges.js";

dotenv.config();

const pixelChanges = new PixelChanges();
const pixelSaver = new PixelSaver(pixelChanges,process.env.DELAY_CRON_SAVE || 10);
await pixelSaver.loadImage(process.env.PATH_PIXELS_IMG || "./pixels/pixels.png");

const app = express();

app.locals.pixelChanges = pixelChanges;
app.locals.size = pixelSaver.getSize();


// Habilita o CORS para todas as origens
app.use(cors());

// habilitando o uso de json pelo express
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Passando para o arquivo de rotas o app, que envia junto uma instância do express
routes(app);

export default app;