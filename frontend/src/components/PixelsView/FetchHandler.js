import { getSocketInstance, registerWebSocketListener, removeWebSocketListener, requestWebSocket } from "@/config/websocket";
import { getApiURL } from "@/config/api";
import { handlePixelChanges } from "@/config/changesProtocol";
import { mesclarEstado } from "../Canvas/CanvasControler";
import CanvasPicture from "./CanvasPicture";

const imagemCarregou = (estado, myImg, url, imagemOffset, identifier, centralizar) => {
    let imgW = myImg.naturalWidth;
    let imgH = myImg.naturalHeight;

    const W = estado.width;
    const H = estado.height;

    //if (imgW > W)
    //if (imgH > H)
    let scaleX = W / imgW;
    let scaleY = H / imgH;

    let scale = scaleY;
    if (scaleX < scaleY)
        scale = scaleX;

    if (!scale)
        scale = 1;

    const canvasPicture = new CanvasPicture({x:0,y:0},myImg,imgW,imgH);

    mesclarEstado(estado, {
        canvasPicture: canvasPicture,
        canvasPictureOffset: imagemOffset,
        changesOffset: imagemOffset,
        changesIdentifier: identifier,
    });

    if(centralizar) 
    mesclarEstado(estado, {
        scale: scale,
        span: {
            x: -((W / 2 - (imgW / 2 * scale)) / scale),
            y: 0,
        }
    });

    if(estado.changesTerminouFetch && !estado.historyMode)
    doFetchChanges(estado,true);
};

const carregarImagem = (estado,url,imagemOffset,identifier,centralizar) => {
    const myImg = new Image();
    myImg.onload = () => {
        imagemCarregou(estado, myImg, url,imagemOffset,identifier,centralizar);
    };
    myImg.src = url;
};
// Pegando a imagem com fetch para ler o Header com o offset das mudanças
// Assim é garantido que não faltará nenhum pixel a ser colocado.
export const doFetchPicture = (estado,centralizar) => { 
    estado.changesTerminouFetch = false;

    fetch(getApiURL("/picture"),{method:"GET",credentials: 'include'})
    .then((res) => Promise.all([res,res.blob()]))
    .then(([res,blob]) => {
        try {
            if(!blob) {
                console.log("Não foi possível carregar a imagem.")
                return
            }

            const offset = parseInt(res.headers.get("x-changes-offset"));
            const identifier = res.headers.get("x-changes-identifier");
            const imgObjectURL = URL.createObjectURL(blob);

            console.log("Carregou a imagem, offset %d",offset);
            carregarImagem(estado,imgObjectURL,offset,identifier,centralizar);
        } finally {
            estado.changesTerminouFetch = true;
            estado.changesUltimoFetch = Date.now();
        }
    })
    .catch((error) => {
        estado.changesTerminouFetch = true;
        estado.changesUltimoFetch = Date.now();
        console.log(error);
    });
}

export const doFetchHistoryPicture = (estado,centralizar) => { 
    estado.changesTerminouFetch = false;

    fetch(getApiURL("/history/"+estado.historyPictureUrl),{method:"GET",credentials: 'include'})
    .then((res) => Promise.all([res,res.blob()]))
    .then(([res,blob]) => {
        try {
            if(!blob) {
                console.log("Não foi possível carregar a imagem.")
                return
            }

            const offset = 0;
            const identifier = "?";
            const imgObjectURL = URL.createObjectURL(blob);

            console.log("Carregou a imagem:",estado.historyPictureUrl);
            carregarImagem(estado,imgObjectURL,offset,identifier,centralizar);
        } finally {
            estado.changesTerminouFetch = true;
            estado.changesUltimoFetch = Date.now();
        }
    })
    .catch((error) => {
        estado.changesTerminouFetch = true;
        estado.changesUltimoFetch = Date.now();
        console.log(error);
    });
}

export const doFetchChanges = (estado,force) => {		
    estado.changesTerminouFetch = false;

    const webSocket = getSocketInstance(estado.token);
    if(webSocket !== null) {
        //console.log("Tem websocket!!!");

        registerWebSocketListeners(webSocket,estado);
        if(force) {
            /*// POSSÍVEL PROBLEMA: Tem que fazer um jeito de pegar o erro de timeout dessa chamada
            webSocket.send(JSON.stringify({
                get: "/changes",
                i: estado.changesOffset
            }));*/

            
            requestWebSocket(webSocket,"GET","/changes",{i: estado.changesOffset})
            .then((json) => {
                onFetchChangesResponse(estado,json);
            })
            .catch((error) => {
                onFetchChangesError(estado,error);
            });
        } else {

            // Não precisa fazer requisição, só garantir que está registrado o listener
            estado.changesTerminouFetch = true;
            estado.changesUltimoFetch = Date.now();
        }
    } else {
        const url = getApiURL("/changes");
        url.search =  new URLSearchParams({i:estado.changesOffset});
        fetch(url,{method:"GET",credentials: 'include'})
        .then((res) => res.json())
        .then((json) => {
            onFetchChangesResponse(estado,json);
        })
        .catch((error) => {
            onFetchChangesError(estado,error);
        });
    }
}

export const onPublishChanges = (estado,json) => {
    try {
        if(!estado.canvasPicture) return; // não processa mudanças se não tem imagem ainda

        const i = parseInt(json.i);
        const changes = json.changes;
        const identifier = json.identifier;
        // Deveria ter um id,hash,seilá para saber que resetou o server
        // pode acontecer de aplicar mudanças na imagem errada
        if(i <= -1) {
            // Algo muito errado aconteceu. Vamos logar isso.
            console.log("Retornou %d no changesOffset, erro no servidor?",i);
        } else if(estado.changesIdentifier !== false && identifier != estado.changesIdentifier) {
            // Precisa re-carregar a imagem, resetou as mudanças?
            estado.changesOffset = i;
            estado.changesIdentifier = identifier;

            console.log("Resetou a imagem? i:%d, identifier:%s",i,identifier);

            // Carregando a imagem depois do changesOffset,
            // só há chances de re-aplicar mudanças, não tem como faltar nada
            // (o que não pode ocorrer é carregar primeiro a imagem e depois o changesOffset)
            //carregarImagem(estado,imagemUrl,estado.changesOffset,false);
            doFetchPicture(estado,false);
        } else if(i == estado.changesOffset) {
            // faz nada. já ta tudo igual.
            estado.changesOffset = i;
            estado.changesIdentifier = identifier;
        } else if(i > estado.changesOffset) {
            const changePixelLength = changes ? changes.length / 8 : -1;
            if(i - changePixelLength != estado.changesOffset) {
                // Não pode processar uma mudança desalinhada.
                console.log("Não pode processar uma mudança desalinhada. Fazendo outro fetch changes para sincronizar");
                doFetchChanges(estado,true);
                return;
            }

            estado.changesOffset = i;
            estado.changesIdentifier = identifier;

            // registra que precisa re-desenhar se houver mudanças.
            estado.changesNeedsRedraw = handlePixelChanges(changes,estado.pallete,
            (hexColor,x,y) => {
                estado.canvasPicture.drawPixel(hexColor,x,y);
            });
        }
    } catch(e) {
        console.log("Erro ao carregar mudanças da imagem:",e);
    }
}

export const onFetchChangesResponse = (estado,json) => {
    let delayNextFetch = estado.changesDelayFetch;
    try {
        onPublishChanges(estado,json);
    } finally {
        if(estado.changesNeedsRedraw) {
            delayNextFetch = estado.changesDelayFastFetch;
        }

        estado.changesTerminouFetch = true;
        estado.changesUltimoFetch = Date.now() - (estado.changesDelayFetch-delayNextFetch);
    }
}

export const onFetchChangesError = (estado,error) => {
    estado.changesTerminouFetch = true;
    estado.changesUltimoFetch = Date.now();

    console.log(error);
}

export const registerWebSocketListeners = (webSocket,estado) => {
    // seria bom registrar o listener sempre que mudar o estado
    // e fazer o primeiro fetch ao iniciar o estado
    if(!estado.publishChangesListener)
    estado.publishChangesListener = (json) => {
        onPublishChanges(estado,json);
    };

    if(!estado.fetchChangesListener)
    estado.fetchChangesListener = (json) => {
        onFetchChangesResponse(estado,json);
    };

    registerWebSocketListener("POST","/publishchanges",estado.publishChangesListener);
    registerWebSocketListener("GET","/changes",estado.fetchChangesListener);
}

export const removeWebSocketListeners = (estado) => {
    const webSocket = getSocketInstance(estado.token);
    if(webSocket !== null) {
        removeWebSocketListener("POST","/publishchanges",estado.publishChangesListener);
        removeWebSocketListener("GET","/changes",estado.fetchChangesListener);
    }
}
