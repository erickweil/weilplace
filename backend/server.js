import server from "./src/app.js";
import { PORT } from "./src/config/options.js";

server.listen(PORT, ()=> {
	console.log("Servidor está rodando na porta %d",PORT);
});
