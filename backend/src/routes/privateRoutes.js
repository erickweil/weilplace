import express from "express";
import PixelChanges from "../controller/pixelChanges.js";
import { API_SHARED_SECRET } from "../config/options.js";

const router = express.Router();

const secretMiddleware = (req,res,next) => {
	if(!req.body.secret) 
		return res.sendStatus(404);

	const secret = req.body.secret;

	if(secret !== API_SHARED_SECRET) 
		return res.sendStatus(404);

	next();
};

router.post("/setsavedindex",secretMiddleware, (req,res) => {
	if(!req.body.i )
		return res.sendStatus(404);

	const index = parseInt(req.body.i);
	PixelChanges.setSavedIndex(index);
    
	return res.status(200).json({ message: "OK" });
});

export default router;