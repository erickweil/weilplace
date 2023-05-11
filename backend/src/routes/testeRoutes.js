import express from "express";
import { genericRouteHandler } from "../middleware/routeHandler.js";
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TesteResposta:
 *       type: object 
 *       required:
 *         - message
 *         - body
 *       properties:
 *         message:
 *           type: string
 *           description: Mensagem de status da rota
 *         body:
 *           type: object
 *           description: Resposta
 *       example:
 *         message: OK
 *         body:
 *           teste: Teste
 */

/**
 * @swagger
 * tags:
 *   name: Teste
 *   description: Rota que apenas testa o funcionamento das respostas
 */

/**
 * @swagger
 * /teste:
 *   get:
 *     summary: Apenas para testar
 *     tags: [Teste]
 *     responses:
 *       200:
 *         description: Retorna a query que foi enviada no GET request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TesteResposta'
 */

export const handleGetTeste = (query) => {
	return {
		status: 200,
		json: { 
			message: "Recebido",
			body: query 
		}
	};
};

/*router.get("/teste", (req,res) => {
	const resp = handleGetTeste(req.query);
	res.status(resp.status).json(resp.json);
});*/

router.get("/teste", genericRouteHandler("GET","/teste",true,handleGetTeste));

export default router;