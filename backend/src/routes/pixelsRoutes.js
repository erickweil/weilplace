import express from "express";
import path from "path";
import pallete from "../config/pallete.js";
import PixelChanges from "../pixels/pixelChanges.js";
import PixelSaver from "../pixels/pixelSaver.js";

const router = express.Router();

function parseIntBounded(str,min,max) {
	let parsed = parseInt(str);
	return Math.max(min,Math.min(parsed,max));
}

router.get("/set", (req,res) => {
	if(!req.query.x || !req.query.y || !req.query.c) 
		return res.status(400).json({ message: "É necessário o parâmetro get x e y para posição e c para cor" });

	const size = PixelSaver.getSize();

	const coord_x = parseIntBounded(req.query.x,0,size.width-1);
	const coord_y = parseIntBounded(req.query.y,0,size.height-1);

	const color = parseIntBounded(req.query.c,0,pallete.length-1);

	PixelChanges.setPixel(coord_x,coord_y,color);

	res.status(200).json({ message: "OK", contents: {delay: 0} });
});

/*router.get("/picture", async (req,res) => {
	res.status(200).sendFile("./pixels/pixels.png",{root: path.resolve() });
	// https://stackoverflow.com/questions/30212813/express-return-binary-data-from-webservice

    //const buffer = await PixelSaver.getPicture();
    //res.writeHead(200, {
        //'Content-Type': "image/png",        
        //'Accept-Range': "none",
        //'Cache-Control': 'no-cache, no-store, must-revalidate',
        //'Content-Length': buffer.length
    //});
    //res.end(buffer);
});*/

router.get("/changes", (req,res) => {
	const index = req.query.i ? parseInt(req.query.i) : -1;

	const resp = PixelChanges.getChanges(index);
    
	res.status(200).json({ message: "OK", contents: resp });
});

/*router.get("/pallete", (req,res) => {
	res.status(200).sendFile("./config/pallete.json",{root: path.resolve() });
});*/


export default router;