import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

import getSwaggerOptions from "../docs/head.js";
import priv from "./privateRoutes.js";
import teste from "./testeRoutes.js";
import pixels from "./pixelsRoutes.js";
import history from "./pixelHistoryRoutes.js";
import { webSocketHandlers } from "../middleware/routeHandler.js";
import { LOG_ROUTES } from "../config/options.js";

export const logRoutes = (req,res,next) => {
	const timestamp = new Date().toISOString();

	const username = req.session.username;

	let ip = req.headers["x-forwarded-for"] ||
	req.socket.remoteAddress ||
	null;

	console.log(timestamp+" "+ip+" "+username+" "+req.protocol + "://" + req.get("host") + req.originalUrl);
	next();
};

const routes = (app) => {

	if(LOG_ROUTES) {
		app.use(logRoutes);
	}

	app.get("/",(req, res) => {
		res.status(200).redirect("/docs"); // redirecionando para documentação
	});

	app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerJsDoc(getSwaggerOptions())));

	app.use(
		teste,
		pixels,
		priv,
		history
	);

	console.log("WebSocket Handlers:\n",webSocketHandlers);
};

export default routes;
