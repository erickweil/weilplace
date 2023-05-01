import teste from "./testeRoutes.js";
import pixels from "./pixelsRoutes.js";
import priv from "./privateRoutes.js";

const routes = (app) => {

	app.use(
		teste,
		pixels,
		priv
	);
};

export default routes;