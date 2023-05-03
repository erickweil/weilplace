import express from "express";
import PixelChanges from "../controller/pixelChanges.js";
import { API_SHARED_SECRET } from "../config/options.js";

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
			json: {message: "Não especificou o índice"}
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
			json: {message: "Não especificou o índice"}
		};

	const index = parseInt(body.i);
	const resp = await PixelChanges.resetChanges(index);
    
	return {
		status: 200,
		json: resp
	};
};

router.post("/setsavedindex",secretMiddleware, async (req,res) => {
	const resp = await handleSetSavedIndex(req.body);
	return res.status(resp.status).json(resp.json);
});

router.post("/resetchanges",secretMiddleware, async (req,res) => {
	const resp = await handleResetChanges(req.body);
	return res.status(resp.status).json(resp.json);
});

export default router;