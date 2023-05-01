import express from "express";
import path from "path";
import PixelChanges from "../controller/pixelChanges.js";
import { IMAGE_HEIGHT, IMAGE_WIDTH, PALLETE, PATH_PALLETE, PATH_PICTURE, PLACE_DELAY } from "../config/options.js";

const router = express.Router();

function isIntStr(value) {
	return /^-?\d+$/.test(value);
}

function parseIntBounded(str,min,max) {
	let parsed = parseInt(str);
	return Math.max(min,Math.min(parsed,max));
}

router.post("/pixel", async (req,res) => {
	if(!isIntStr(req.body.x) || !isIntStr(req.body.y) || !isIntStr(req.body.c)) 
		return res.status(400).json({ message: "É necessário x e y para posição e c para cor" });

	const coord_x = parseIntBounded(req.body.x,0,IMAGE_WIDTH-1);
	const coord_y = parseIntBounded(req.body.y,0,IMAGE_HEIGHT-1);

	const color = parseIntBounded(req.body.c,0,PALLETE.length-1);

	// Impedir que coloque pixels sem esperar um tempo
	if(PLACE_DELAY > 0)
	{
		let timeLastPlaced = req.session.lastPlaced || -1;

		if(timeLastPlaced > 0 )
		{
			let timeElapsed = (Date.now() -  timeLastPlaced);

			// Caso não esperou o suficiente responde com quanto tempo falta em segundos
			if(timeElapsed < PLACE_DELAY) {
				return res.status(200).json({ message: "DELAY", contents: {delay: Math.ceil((PLACE_DELAY - timeElapsed)/1000)} });
			}
		}

		// registra o tempo atual como última vez que colocou pixels
		req.session.lastPlaced = Date.now();
	}

	await PixelChanges.setPixel(coord_x,coord_y,color);

	return res.status(200).json({ message: "OK", contents: {delay: Math.ceil(PLACE_DELAY/1000)} });
});

router.get("/changes", async (req,res) => {
	const index = isIntStr(req.query.i) ? parseInt(req.query.i) : -1;

	const resp = await PixelChanges.getChanges(index);

	if(resp.error) {
		return res.status(500).json(resp);
	}
    
	return res.status(200).json({ message: "OK", contents: resp });
});

router.get("/picture", async (req,res) => {
	
	const resp = await PixelChanges.getChanges(-1);
	return res.status(200)
		.sendFile(PATH_PICTURE,{
			root: path.resolve(),
			headers: {
				"X-Changes-Offset": resp.i
			}
			// colocar body?
		});

	// https://stackoverflow.com/questions/30212813/express-return-binary-data-from-webservice
	//const buffer = await PixelSaver.getPicture();
	//res.writeHead(200, {
	//'Content-Type': "image/png",        
	//'Accept-Range': "none",
	//'Cache-Control': 'no-cache, no-store, must-revalidate',
	//'Content-Length': buffer.length
	//});
	//res.end(buffer);
});

router.get("/pallete", (req,res) => {
	return res.status(200).sendFile(PATH_PALLETE,{root: path.resolve() });
});


export default router;