import express from "express";
import path from "path";
import PixelChanges from "../controller/pixelChanges.js";
import { PATH_PALLETE, PATH_PICTURE } from "../config/options.js";
import { genericRouteHandler } from "../middleware/routeHandler.js";
import { SessionManager } from "../middleware/sessionManager.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Pixels
 *   description: Rotas que manipulam os Pixels
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RespostaErro:
 *       type: object 
 *       required:
 *         - error
 *       properties:
 *         error:
 *           type: string
 *           description: Mensagem de erro
 *       example:
 *         error: "Mensagem do erro"
 */

function isIntStr(value) {
	return /^-?\d+$/.test(value);
}

function parseIntBounded(str,min,max) {
	let parsed = parseInt(str);
	return Math.max(min,Math.min(parsed,max));
}

/**
 * @swagger
 * /pixel:
 *   post:
 *     summary: Modifica a cor de um pixel em uma posição do canvas
 *     tags: [Pixels]
 *     requestBody:
 *       description: x e y definem a posição do canvas, e c define uma das cores da paleta de cores
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               x:
 *                 type: number
 *                 example: 0
 *               y:
 *                 type: number
 *                 example: 0
 *               c:
 *                 type: number
 *                 example: 0
 *     responses:
 *       200:
 *         description: A modificação foi salva com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OK"
 *                 delay:
 *                   type: number
 *                   example: 0
 *       400:
 *         description: Não informou os valores necessários.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespostaErro'
 *       500:
 *         description: Erro interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespostaErro'
 * 
 */
export const handlePostPixel = async (body,session) => {
	if(!isIntStr(body.x) || !isIntStr(body.y) || !isIntStr(body.c)) 
		return {
			status: 400,
			json: {error: "É necessário x e y para posição e c para cor"}
		};

    const userinfo = SessionManager.requireLoggedInUserInfo(session);
    if(!userinfo) {
        return { 
            status: 401, 
            json: {error: "Não logado"} 
        };
    }

	const coord_x = parseInt(body.x);
	const coord_y = parseInt(body.y);

	const color = parseInt(body.c);
	
	const username = userinfo.username;

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

/**
 * @swagger
 * /changes:
 *   get:
 *     summary: Recebe as mudanças que aconteceram desde a posição i informada
 *     tags: [Pixels]
 *     parameters:
 *     - in: query
 *       name: i
 *       required: true
 *       schema:
 *         type: integer
 *       description: Indica o offset a partir do qual deseja obter as mudanças.
 *     responses:
 *       200:
 *         description: Recebeu as mudanças com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
  *               - type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "OK"
 *                   identifier:
 *                     type: string
 *                     example: "1683580314370"
 *                   i:
 *                     type: number
 *                     example: 1
 *                   changes:
 *                     type: string
 *                     example: "0QHSAQAf"
 *               - type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "OK"
 *                   identifier:
 *                     type: string
 *                     example: "1683580314370"
 *                   i:
 *                     type: number
 *                     example: 0
 *       400:
 *         description: Não informou os valores necessários.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespostaErro'
 *       500:
 *         description: Erro interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespostaErro'
 */
export const handleGetChanges = async (query) => {
	if(!isIntStr(query.i)) 
		return {
			status: 400,
			json: {error: "É necessário especificar o parâmetro query i para dizer a partir de onde quer as mudanças"}
		};

	const index = parseInt(query.i);

	if(index < 0) return {
		status: 400,
		json: {error: "O índice deve ser maior ou igual a 0. Para obter o valor do índice do último save utilize /savedindex"}
	};

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

/**
 * @swagger
 * /savedindex:
 *   get:
 *     summary: Recebe o valor que o índice das mudanças estava quando foi feito o último save da imagem
 *     tags: [Pixels]
 *     responses:
 *       200:
 *         description: O índice do último save
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OK"
 *                 identifier:
 *                   type: string
 *                   example: "1683580314370"
 *                 i:
 *                   type: number
 *                   example: 5547
 */
export const handleGetSavedIndex = async () => {
	const resp = await PixelChanges.getSavedIndex();
    
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
router.get("/savedindex", genericRouteHandler("GET","/savedindex",true,handleGetSavedIndex));

/**
 * @swagger
 * /picture:
 *   get:
 *     summary: Imagem do canvas
 *     tags: [Pixels]
 *     responses:
 *       200:
 *         description: Respondeu com a imagem          
 *         headers:
 *           X-Changes-Offset:
 *             schema:
 *               type: integer
 *             description: Valor do offset 'i' das mudanças no momento que esta imagem foi salva
 *           X-Changes-Identifier:
 *             schema:
 *               type: string
 *             description: Identificador da string de mudanças no momento que esta imagem foi salva
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/picture", async (req,res) => {
	try {
	// Envia a imagem e o offset do último save dela,
	// assim o próximo /changes irá continuar a partir
	// do ponto correto, mesmo que entre receber essa imagem
	// e iniciar o /changes houver modificações, ele irá recebê-las.
	const resp = await PixelChanges.getSavedIndex();

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
	} catch(e) {
		console.error(e);
		return res.status(500).json({message: "Erro ao acessar imagem:"+e});
	}
});

/**
 * @swagger
 * /pallete:
 *   get:
 *     summary: Paleta das cores que podem ser inseridas no canvas
 *     tags: [Pixels]
 *     responses:
 *       200:
 *         description: Recebeu a paleta com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pallete:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: "ffffff"
 */
router.get("/pallete", (req,res) => {
	try {
		return res.status(200).sendFile(PATH_PALLETE,{root: path.resolve() });
	} catch(e) {
		console.error(e);
		return res.status(500).json({message: "Erro ao acessar paleta de cores:"+e});
	}
});


export default router;