import { WebSocket, WebSocketServer } from "ws"; //https://www.npmjs.com/package/ws
import { AuthManager, haiku } from "../middleware/authManager.js";
import { webSocketHandlers } from "../middleware/routeHandler.js";
import { setupPublishChanges } from "./wsPublishChanges.js";
import { LOG_ROUTES } from "../config/options.js";

export const doBroadcastEveryoneButMe = (wss,ws_client,msg) => {
	wss.clients.forEach((client) => {
		if(client !== ws_client && client.readyState === WebSocket.OPEN) {
			client.send(msg);
		}
	});
};

export const doBroadcastEveryone = (wss,msg) => {
	wss.clients.forEach((client) => {
		if(client.readyState === WebSocket.OPEN) {
			client.send(msg);
		}
	});
};

const onConnection = (wss,ws) => {

	const onMessage = async (message) => {
		let json;
		try {
			json = JSON.parse(message);
		} catch (e) {
			console.log("Websocket: erro ao decoficar json:",e,message);
			return;
		}

		const method = json.post ? "POST" : json.get ? "GET" : false;
		if(method !== "GET" && method !== "POST") {
			console.log("Websocket: requisição webSocket method Inválido:",json);
			return;
		}

		const route = json.post || json.get;

		const handler = webSocketHandlers[method][route];
		if(!handler) {
			console.log("Websocket: não havia handler para requisição:",json);
			return;
		}

		// será que precisa pensar em pesquisar esses valores ou algo assim?
		const tokenPayload = ws.tokenPayload;

		if(LOG_ROUTES) {
			const timestamp = new Date().toISOString();
			console.log(timestamp+" "+ws.username+" websocket: "+method+" "+route+" ",json);
		}

		const resp = await handler(json,tokenPayload);
		if(resp.status == 200) {
			ws.send(JSON.stringify({
				[json.post ? "post" : "get"]: route,
				_id: json._id ? json._id : -1, // responde de volta o id da requisição
				...resp.json
			}));
		} else {
			console.log("Websocket: Resposta de requisição status não 200:",resp);
		}
	};

	ws.on("message", onMessage);
};

const initWebSocketServer = (server, tokenMiddleware) => {
	const wss = new WebSocketServer({server});

	wss.on("connection", (ws, req) => {
		try {
			ws.isAlive = true;

			ws.on("error",(error) => {
				console.log("Erro em:"+ws.username,error);
			});
			ws.on("pong", () => {
				//console.log("Recebeu pong de "+ws.session.username);
				ws.isAlive = true;
			});
			ws.on("close", () => {
				console.log(ws.username+" desconectou.");
			});

			const mockRes = {
				status: (code) => {
					mockRes.code = code;
					return mockRes;
				},
				json: (obj) => {
					throw new Error(JSON.stringify(obj));
				}
			};

			tokenMiddleware(req, mockRes, function() {			
				ws.tokenPayload = req.tokenPayload;
				ws.username = req.tokenPayload?.name || haiku();
				console.log(ws.username+" conectado.");

				onConnection(wss,ws);
			}).catch((error) => {
				console.error("Erro ao autenticar websocket:",error);
				try {
					ws.close();
				} catch(ee) {
					console.error("Erro ao fechar websocket:",ee);
				}
			});
		} catch(e) {
			console.error("Erro ao conectar websockets:",e);

			try {
				ws.close();
			} catch(ee) {
				console.error("Erro ao fechar websocket:",ee);
			}
		}
	});

	// Ping https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections
	const interval = setInterval(() => {
		wss.clients.forEach((ws) => {
			if (ws.isAlive === false) {
				console.log("Fechando conexão quebrada de "+ws.username);
				return ws.terminate(); // ws.readyState !== WebSocket.OPEN
			}

			//console.log("Enviou ping para "+ws.session.username);
			ws.isAlive = false;
			ws.ping();
		});
	}, 30000);

	wss.on("close",() => {
		console.log("Fechando WebSocketServer.");
		clearInterval(interval);
	});

	setupPublishChanges(wss);

	return wss;
};

export default initWebSocketServer;
