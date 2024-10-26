// Para ser possível chamar algumas rotas via WebSocket
export const webSocketHandlers = {"GET":{},"POST":{},"PUT":{},"DELETE":{},"PATCH":{}};

export const genericRouteHandler = (method,route,allowWebSocket,handler) => { 
	if(allowWebSocket === true) {
		webSocketHandlers[method][route] = handler;
	}

	return async (req,res) => {
		try {
			const body = method == "GET" ? req.query : req.body;
			const resp = await handler(body,req.session);

			if(resp === undefined || resp.status === undefined) {
				console.log("Erro no handler da requisição '"+req.originalUrl+"', retornou resposta inválida:",resp);
				return res.sendStatus(500);
			}

			if(resp.json === undefined)
				return res.sendStatus(resp.status);

			return res.status(resp.status).json(resp.json);
		} catch(e) {
			console.error("Erro ao processar requisição",e);
			return res.status(500).json({message: "Erro ao processar requisição:"+e});
		}
	};
};