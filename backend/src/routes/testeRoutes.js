import express from "express";
import { genericRouteHandler } from "../middleware/routeHandler.js";
const router = express.Router();

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