// Esta rota será usada apenas para que o administrador possa gerenciar
// o servidor, resetando manualmente as mudanças.

// Ou então caso queira fazer um pixelSaver remoto que não tem acesso ao Redis é possível

import express from "express";
import PixelChanges from "../controller/pixelChanges.js";
import { API_SHARED_SECRET, REDIS_ENABLED } from "../config/options.js";
import { genericRouteHandler } from "../middleware/routeHandler.js";
import { connectToRedis } from "../config/redisConnection.js";
import PixelSaver from "../service/pixelSaver.js";

const router = express.Router();

function isIntStr(value) {
	return /^-?\d+$/.test(value);
}

const secretMiddleware = (req,res,next) => {
	if(!req.body.secret) 
		return res.sendStatus(401);

	const secret = req.body.secret;

	if(secret !== API_SHARED_SECRET)
		return res.sendStatus(401);

	next();
};

export const handleSetSavedIndex = async (body) => {
	if(!isIntStr(body.i))
		return {
			status: 400,
			json: {error: "Não especificou o índice"}
		};

	const index = parseInt(body.i);
	await PixelChanges.setSavedIndex(index);

	return {
		status: 200,
		json: {message: "OK"}
	};
};

export const handleResetChanges = async(body) => {
	if(!isIntStr(body.i))
		return {
			status: 400,
			json: {error: "Não especificou o índice"}
		};

	const index = parseInt(body.i);
	const resp = await PixelChanges.resetChanges(index);
    
	return {
		status: 200,
		json: resp
	};
};

export const handleSavePicture = async (body) => {
	if(!body.picture)
		return {
			status: 400,
			json: {error: "Não especificou a imagem"}
		};

	let picture = body.picture;

	if(!(picture instanceof Buffer)) {
		try {
			picture = Buffer.from(picture,"base64");
		} catch(e) {
			return {
				status: 400,
				json: {error: "Imagem inválida"}
			};
		}
	}

	const resp = await PixelChanges.savePicture(picture);
	
	return {
		status: 200,
		json: resp
	};
};

// Utilizado apenas quando não tem o serviço pixel saver
// para aplicar as mudanças na imagem e salvar
export const handleApplyChanges = async () => {
	if(!REDIS_ENABLED) {
		throw new Error("Quando não utiliza redis o serviço do pixel saver é iniciado na mesma instância da api.");
	}

	// Iniciar conexão com o redis e ligar o controller
	if(!PixelChanges.calledInit) {
		let redisClient = await connectToRedis(PixelChanges.getLuaScriptsConfig());
		await PixelChanges.init(redisClient);
	}

	if(!PixelSaver.calledInit) {
		await PixelSaver.init({ delay_cron_save: 0 });
	}

	// Força execução de todas as mudanças
	await PixelSaver.cronTask();

	return {
		status: 200,
		json: {message: "OK"}
	};
};

/*router.post("/setsavedindex",secretMiddleware, async (req,res) => {
	const resp = await handleSetSavedIndex(req.body);
	return res.status(resp.status).json(resp.json);
});

router.post("/resetchanges",secretMiddleware, async (req,res) => {
	const resp = await handleResetChanges(req.body);
	return res.status(resp.status).json(resp.json);
});*/

router.post("/setsavedindex", secretMiddleware, genericRouteHandler("POST","/setsavedindex",false,handleSetSavedIndex));
router.post("/resetchanges", secretMiddleware, genericRouteHandler("POST","/resetchanges",false,handleResetChanges));
router.post("/savepicture", secretMiddleware, genericRouteHandler("POST","/savepicture",false,handleSavePicture));
router.post("/applychanges", secretMiddleware, genericRouteHandler("POST","/applychanges",false,handleApplyChanges));

export default router;