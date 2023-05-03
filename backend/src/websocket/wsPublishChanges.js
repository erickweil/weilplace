// https://redis.io/docs/manual/keyspace-notifications/
// https://redis.io/docs/manual/pubsub/
// https://blog.logrocket.com/using-redis-pub-sub-node-js/

import { handleGetChanges } from "../routes/pixelsRoutes.js";
import { doBroadcastEveryone } from "./websocket.js";

const doChangesGet = async (last_i) => {
	const res = await handleGetChanges({i:""+last_i});
	if(res.status == 200) return res.json;
	else throw new Error("Não foi possível completar a requisição:"+res);
};

let last_i = 0;
let last_identifier = false;

// A ideia é ficar verificando se houve modificações, e caso seja detectado modificações faz um broadcasting
// a todos os usuários que essa modificação aconteceu
export const setupPublishChanges = (wss) => {
	const interval = setInterval(async () => {
		//console.log("interval last_i:",last_i);
		const resp = await doChangesGet(last_i);

		if(!resp 
			|| resp.i === undefined 
			|| resp.identifier === undefined 
		) {
			console.log("Publish Changes: Erro ao realizar changesGet, resposta sem valores necessários:",resp);
			return false;
		}

		const i = parseInt(resp.i);
		const identifier = resp.identifier;

		// Tem que ver isso depois
		if(last_identifier !== false && identifier != last_identifier) {
			console.log("Publish Changes: Atualizou identifier. resetando index");
			last_i = 0;
			last_identifier = identifier;
			return false;
		}

		if(last_i != i || last_identifier != identifier) { 
			last_i = i;
			last_identifier = identifier;

			doBroadcastEveryone(wss,JSON.stringify({
				post: "/publishchanges",
				...resp
			}));
		}
	}, 50);

	wss.on("close",() => {
		console.log("Parando Changes Interval.");
		clearInterval(interval);
	});

};