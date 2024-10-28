// Esta rota será usada apenas para que o administrador possa gerenciar
// o servidor, resetando manualmente as mudanças.

// Ou então caso queira fazer um pixelSaver remoto que não tem acesso ao Redis é possível

import express from "express";
import PixelChanges from "../controller/pixelChanges.js";
import { API_SHARED_SECRET, IMAGE_HEIGHT, IMAGE_WIDTH } from "../config/options.js";
import { genericRouteHandler } from "../middleware/routeHandler.js";
import sharp from "sharp";

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


// [teste] rota para configurar
router.post("/createpicture", secretMiddleware, async (req,res) => {
    // Gera a imagem
    let imgSharpObj = await sharp({
        create: {
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
            channels: 3,
            background: {r: 255, g: 255, b: 255}
        }
    });

    let imgPixelsBuff = await imgSharpObj.png().toBuffer();

    let imgPixelsBase64 = imgPixelsBuff.toString("base64");

    // Salva a imagem
});

export default router;