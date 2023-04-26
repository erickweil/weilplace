import teste from "./testeRoutes.js";
import pixels from "./pixelsRoutes.js";

const routes = (app) => {

    app.use(
      teste,
      pixels
    )
}

export default routes