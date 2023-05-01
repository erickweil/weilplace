import app from "./src/app.js";
import { PORT } from "./src/config/options.js";

app.listen(PORT, ()=> {
	console.log("Servidor está rodando na porta %d",PORT);
});
