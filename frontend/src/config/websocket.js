//https://stackoverflow.com/questions/68263036/using-websockets-with-next-js

// Singleton vai funcionar será?
const isBrowser = typeof window !== "undefined";
let useWebSocket = isBrowser && process.env.NEXT_PUBLIC_WEBSOCKET_ENABLED === "true";
let socket = null;
let socketConnected = false;

// Desativado o heartbeat pq o evento de ping não está funcionando no nextJS
// https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections
/*

let pingTimeout = null;
const heartbeat = () => {
	console.log("heartbeat");
	clearTimeout(pingTimeout);

	// Use `WebSocket#terminate()`, which immediately destroys the connection,
	// instead of `WebSocket#close()`, which waits for the close timer.
	// Delay should be equal to the interval at which your server
	// sends out pings plus a conservative assumption of the latency.
	const pingInterval = 30000;
	const maxLatency = 2500;
	pingTimeout = setTimeout(() => {
		//socket.terminate(); Unhandled Runtime Error TypeError: socket.terminate is not a function
		console.log("Fechando conexão depois do timeout.");
		socket.close();
	}, pingInterval + maxLatency);
}*/

let webSocketListeners =  {"GET":{},"POST":{},"PUT":{},"DELETE":{},"PATCH":{}};
export const registerWebSocketListener = (metodo,rota,listener) => {
	if(webSocketListeners[metodo][rota] !== listener) {
		//console.log("Adicionado Listener %s %s",metodo,rota);
		webSocketListeners[metodo][rota] = listener;
	}// else console.log("Ñ Adicionado Listener %s %s",metodo,rota);
}

export const removeWebSocketListener = (metodo,rota,listener) => {
	if(webSocketListeners[metodo][rota] === listener) {
		//console.log("Removido Listener %s %s",metodo,rota);
		// http://perfectionkills.com/understanding-delete/
		delete webSocketListeners[metodo][rota];
	}// else console.log("Ñ Removido Listener %s %s",metodo,rota);
}

export const hasSocketListener = (metodo,rota) => {
	if(webSocketListeners[metodo][rota]) {
		return true
	} return false;
}

export const requestWebSocket = async (webSocket,metodo,rota,reqJson) => {
	
	const promise = new Promise(function (resolve, reject) {
		if(webSocket === null) {
			reject("Não tem conexão websocket ativa");
			return;
		}

		//if(hasSocketListener(metodo,rota)) {
		//	console.log(webSocketListeners);
		//	reject("Já está fazendo esta requisição");
		//	return;
		//}

		// Id para saber para qual listener enviar a resposta quando ela chegar
		const _id = Date.now();

		const timeout = setTimeout(() => {
			removeWebSocketListener(metodo.toUpperCase(),_id,listener);
			reject("Timeout na requisição websocket:"+metodo+" "+rota);
		},10000);

		const listener = (respJson) => {
			clearTimeout(timeout);
			removeWebSocketListener(metodo.toUpperCase(),_id,listener);
			resolve(respJson);
		};

		registerWebSocketListener(metodo.toUpperCase(),_id,listener);

		const keymethod = metodo.toLowerCase();
		webSocket.send(JSON.stringify({
			[keymethod]: rota,
			_id: _id,
			...reqJson
		}));
    });

	return await promise;
}

//export const sendWebSocketMessage = (msg) => {
	//socket.send(msg);
//};

let connectionErrorCount = 0;
export const getSocketInstance = () => {
	if(!useWebSocket) return null;

	if(socket !== null) {
		if(!socketConnected) return null;
		else return socket;
	}

    const websocket_url = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

	try {
		console.log("Criando nova conexão websocket...");
		socketConnected = false;
		socket = new WebSocket(
			websocket_url
		);
	} catch (e) {
		console.log("Erro ao criar o websocket:",e);
		connectionErrorCount++;

		if(connectionErrorCount >= 5) {
			
			console.error("Desistiu de tentar conectar por websocket");
			useWebSocket = false; // Para de tentar conectar deu erro 5 vezes!
		}

		return null;
	}

	socket.addEventListener("open", () => {
		console.log("Aberta conexão websocket");
		connectionErrorCount = 0;
		socketConnected = true;
	});

	socket.addEventListener("ping", () => {
		console.log("recebeu ping"); // NUNCA EXECUTA
	});

	socket.addEventListener("close", () => {		
		//clearTimeout(pingTimeout);

		// DEPOIS OLHA ISSO https://stackoverflow.com/questions/29881957/websocket-connection-timeout
		console.log("Fechou a conexão websocket...");
		connectionErrorCount++;

		if(connectionErrorCount >= 5) {
			console.error("Desistiu de tentar conectar por websocket");
			useWebSocket = false; // Para de tentar conectar deu erro 5 vezes!
		}
		socketConnected = false;
		socket = null;
	});

	socket.addEventListener("message", async (event) => {
		//console.log("Mensagem do servidor '%s'",event.data);

		const message = event.data;

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

		let handler = webSocketListeners[method][json._id]; // procura pelo id primeiro
		if(!handler) {
			handler = webSocketListeners[method][route];
			if(!handler) {
				console.log("Websocket: não havia listener para requisição:",json);
				return;
			}
		}

		//const sucessHandler = handler.sucessListener;

		await handler(json);
	});

	socket.addEventListener("error", (event) => {
		console.log("Erro:",event);
	});

	return null;
};
