import express from "express";
import routes from "./routes/index.js";
import * as dotenv from 'dotenv'; // necessário para leitura do arquivo de variáveis
import cors from 'cors';

dotenv.config();

const app = express();

// Habilita o CORS para todas as origens
app.use(cors());

// habilitando o uso de json pelo express
app.use(express.json());

// Passando para o arquivo de rotas o app, que envia junto uma instância do express
routes(app);

export default app;