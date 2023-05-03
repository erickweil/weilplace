/* eslint-disable */

const elemForm = document.getElementById("msg-form");
const elemMsg = document.getElementById("msg-content");
const elemResp = document.getElementById("msg-resp");

// https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections
function heartbeat() {
	clearTimeout(this.pingTimeout);

	// Use `WebSocket#terminate()`, which immediately destroys the connection,
	// instead of `WebSocket#close()`, which waits for the close timer.
	// Delay should be equal to the interval at which your server
	// sends out pings plus a conservative assumption of the latency.
	const pingInterval = 30000;
	const maxLatency = 2500;
	this.pingTimeout = setTimeout(() => {
		this.terminate();
	}, pingInterval + maxLatency);
}

const iniciar = () => {
	let socket;

	try {
		socket = new WebSocket(
			"ws://localhost:3001"
		);
	} catch (e) {
		console.log("Erro ao criar o websocket:",e);
		return;
	}

	socket.addEventListener("open", heartbeat);

	socket.addEventListener("ping", heartbeat);

	socket.addEventListener("close", function clear() {		
		clearTimeout(this.pingTimeout);
	});

	socket.addEventListener("message", (event) => {
		console.log("Mensagem do servidor '%s'",event.data);
		//elemResp.value = event.data+"\n"+elemResp.value;
		elemResp.value = event.data;
	});

	socket.addEventListener("error", (event) => {
		console.log("Erro:",event);
	});



	const sendMessage = (msg) => {
		socket.send(msg);
	};

	elemForm.addEventListener("submit", (evt) => {
		evt.preventDefault();

		sendMessage(elemMsg.value);
	}, true);

};

iniciar();