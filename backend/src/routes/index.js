import teste, { handleGetTeste } from "./testeRoutes.js";
import pixels, { handleGetChanges, handlePostPixel } from "./pixelsRoutes.js";
import priv from "./privateRoutes.js";
import { webSocketHandlers } from "../middleware/routeHandler.js";

const routes = (app) => {
	app.use(
		teste,
		pixels,
		priv
	);

	console.log("WebSocket Handlers:\n",webSocketHandlers);
};

export default routes;