import express from "express";
import path from "path";
import PixelChanges from "../controller/pixelChanges.js";
import { IMAGE_HEIGHT, IMAGE_WIDTH, PALLETE, PATH_PALLETE, PATH_PICTURE, PLACE_DELAY } from "../config/options.js";
import { genericRouteHandler } from "../middleware/routeHandler.js";

const router = express.Router();

function isIntStr(value) {
	return /^-?\d+$/.test(value);
}

function parseIntBounded(str,min,max) {
	let parsed = parseInt(str);
	return Math.max(min,Math.min(parsed,max));
}

export const handlePostPixel = async (body,session) => {
	if(!isIntStr(body.x) || !isIntStr(body.y) || !isIntStr(body.c)) 
		return {
			status: 400,
			json: {message: "É necessário x e y para posição e c para cor"}
		};

	const coord_x = parseIntBounded(body.x,0,IMAGE_WIDTH-1);
	const coord_y = parseIntBounded(body.y,0,IMAGE_HEIGHT-1);

	const color = parseIntBounded(body.c,0,PALLETE.length-1);
	
	const username = session.username;

	const resp = await PixelChanges.setPixel(username,coord_x,coord_y,color);
	
	if(resp.error) {
		console.log(resp.error);
		return {
			status: 500,
			json: resp
		};
	}

	return {
		status: 200,
		json: resp
	};
};

export const handleGetChanges = async (query) => {
	const index = isIntStr(query.i) ? parseInt(query.i) : -1;

	const resp = await PixelChanges.getChanges(index);

	if(resp.error) {
		console.log(resp.error);
		return {
			status: 500,
			json: resp
		};
	}
    
	return {
		status: 200,
		json: resp
	};
};

/*router.post("/pixel", async (req,res) => {
	const resp = await handlePostPixel(req.body,req.session);
	return res.status(resp.status).json(resp.json);
});

router.get("/changes", async (req,res) => {
	const resp = await handleGetChanges(req.query,req.session);
	return res.status(resp.status).json(resp.json);
});*/

router.post("/pixel", genericRouteHandler("POST","/pixel",true,handlePostPixel));
router.get("/changes", genericRouteHandler("GET","/changes",true,handleGetChanges));

router.get("/picture", async (req,res) => {
	
	// Envia a imagem e o offset do último save dela,
	// assim o próximo /changes irá continuar a partir
	// do ponto correto, mesmo que entre receber essa imagem
	// e iniciar o /changes houver modificações, ele irá recebê-las.
	const resp = await PixelChanges.getChanges(-1);

	// 1. Se entre o getChanges acima e a leitura da imagem, for salva uma nova imagem
	// não causa problemas, pois o cliente irá re-aplicar as mudanças, um re-trabalho
	// inútil porém é garantido que nenhum pixel será perdido
	// 2. Se entre o /picture e o próximo /changes do cliente as modificações forem resetadas,
	// não causa problemas pois o cliente irá realizar um novo /picture devido ao novo identifier (por isso o X-Changes-Identifier)
	return res.status(200)
		.sendFile(PATH_PICTURE,{
			root: path.resolve(),
			headers: {
				"X-Changes-Offset": resp.i, // Offset do último save da imagem
				"X-Changes-Identifier": resp.identifier, // ID da string de modificações (Para evitar erros ao resetar as mudanças)
				"Cache-Control": "no-store, must-revalidate",
				"Pragma": "no-cache",
				"Expires": "0"
			}
			// colocar body?
		});
});

router.get("/pallete", (req,res) => {
	return res.status(200).sendFile(PATH_PALLETE,{root: path.resolve() });
});


export default router;