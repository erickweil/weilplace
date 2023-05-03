//https://stackoverflow.com/questions/68263036/using-websockets-with-next-js

// Singleton vai funcionar será?
const isBrowser = typeof window !== "undefined";
let socket = null;


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

export const getSocketInstance = () => {
	if(!isBrowser) return null;

	if(socket !== null) return socket;

	try {
		console.log("Criando nova conexão websocket...");
		socket = new WebSocket(
			"ws://localhost:3001"
		);
	} catch (e) {
		console.log("Erro ao criar o websocket:",e);
		return;
	}

	socket.addEventListener("open", () => {
		console.log("Aberta conexão websocket");
	});

	socket.addEventListener("ping", () => {
		console.log("recebeu ping"); // NUNCA EXECUTA
	});

	socket.addEventListener("close", () => {		
		//clearTimeout(pingTimeout);

		console.log("Fechou a conexão websocket...");
		socket = null;
	});

	socket.addEventListener("message", (event) => {
		console.log("Mensagem do servidor '%s'",event.data);
	});

	socket.addEventListener("error", (event) => {
		console.log("Erro:",event);
	});

	const sendMessage = (msg) => {
		socket.send(msg);
	};

	return socket;
};
