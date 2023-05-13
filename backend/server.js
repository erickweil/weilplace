import { PORT } from "./src/config/options.js";
import server from "./src/app.js";

server.listen(PORT, ()=> {
	console.log("Servidor está rodando na porta %d",PORT);
});
