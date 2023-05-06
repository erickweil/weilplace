import teste, { handleGetTeste } from "./testeRoutes.js";
import pixels, { handleGetChanges, handlePostPixel } from "./pixelsRoutes.js";
import priv from "./privateRoutes.js";
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

	app.use(
		teste,
		pixels,
		priv
	);

	console.log("WebSocket Handlers:\n",webSocketHandlers);
};

export default routes;