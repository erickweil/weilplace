// https://redis.io/docs/manual/keyspace-notifications/
// https://redis.io/docs/manual/pubsub/
// https://blog.logrocket.com/using-redis-pub-sub-node-js/

import { handleGetChanges, handleGetSavedIndex } from "../routes/pixelsRoutes.js";
import { doBroadcastEveryone } from "./websocket.js";

const doChangesGet = async (i) => {
	const res = await handleGetChanges({i:""+i});
	if(res.status == 200) return res.json;
	else throw new Error("Não foi possível completar a requisição:"+res);
};

const doSavedIndexGet = async () => {
	const res = await handleGetSavedIndex();
	if(res.status == 200) return res.json;
	else throw new Error("Não foi possível completar a requisição:"+res);
};

// TEM QUE COMEÇAR COM -1 PARA PEGAR O ÍNDICE DO ÚLTIMO SAVE E NÃO ATRAVESSAR O HISTÓRICO INTEIRO
let last_i = -1;
let last_identifier = false;
let broadcastCounter = 0;
// A ideia é ficar verificando se houve modificações, e caso seja detectado modificações faz um broadcasting
// a todos os usuários que essa modificação aconteceu
export const setupPublishChanges = (wss) => {
	const interval = setInterval(async () => {
		try {
			if(wss.clients.size <= 0) {
				// se ninguém vai ouvir para que ficar verificando?
				return;
			}

			const resp = last_i >= 0 ? await doChangesGet(last_i) : await doSavedIndexGet();

			if(!resp 
				|| resp.i === undefined 
				|| resp.identifier === undefined 
			) {
				console.log("Publish Changes: changesGet deu resposta sem valores necessários:",resp);
				return;
			}

			const i = parseInt(resp.i);
			const identifier = resp.identifier;

			// Tem que ver isso depois
			if(last_identifier !== false && identifier != last_identifier) {
				console.log("Publish Changes: Atualizou identifier. resetando index");
				last_i = -1; // para pegar o index do último save
				last_identifier = identifier;
				return;
			}

			if(last_i != i || last_identifier != identifier) { 
				last_i = i;
				last_identifier = identifier;

				if(resp.changes) { // tem mudanças? então faz broadcast
					broadcastCounter++;
					if(broadcastCounter % 1000 == 0) { // faz o log a cada 1000 broadcasts para ter uma ideia da carga
						const timestamp = new Date().toISOString();
						console.log(timestamp+" total de broadcasts:"+broadcastCounter+", websockets conectados:"+wss.clients.size);
					}

					doBroadcastEveryone(wss,JSON.stringify({
						post: "/publishchanges",
						...resp
					}));
				}
			}
		} catch(error) {
			console.error("Publish Changes: Erro! ",error);
			// Resetando...
			last_i = -1;
			last_identifier = false;
		}
	}, 50);

	wss.on("close",() => {
		console.log("Parando Changes Interval.");
		clearInterval(interval);
	});

};