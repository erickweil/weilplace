import ZoomableCanvas, { doZoomWithCenter, pageToZoomCanvas } from "../Canvas/ZoomableCanvas"
import NextImage from 'next/image'
import { mesclarEstado } from '@/components/Canvas/CanvasControler'
import CanvasPicture from "./CanvasPicture";
import React, {memo, useEffect} from 'react'
import { doFetchChanges, doFetchHistoryPicture, doFetchPicture, registerWebSocketListeners, removeWebSocketListeners } from "./FetchHandler";
import { getSocketInstance } from "@/config/websocket";

// https://stackoverflow.com/questions/3115982/how-to-check-if-two-arrays-are-equal-with-javascript
export const arraysEqual = (a, b) => {
	if (a === b) return true;
	if (a === false || b === false) return false;
	if (!Array.isArray(a) || !Array.isArray(b)) return false;
	if (a.length !== b.length) return false;
  
	// If you don't care about the order of the elements inside
	// the array, you should sort both arrays here.
	// Please note that calling sort on an array will modify that array.
	// you might want to clone your array first.
  
	for (let i = 0; i < a.length; i++) {
	  if (a[i] !== b[i]) return false;
	}
	return true;
}

const PixelsView = (props) => {

	const { pallete, notifyCenterPixel, onChangeColor, onPlacePixel, historyPictureUrl, token, options:_options, ...rest } = props

    const defaultOptions = {
		spanButton: "any", // left | middle | right | any
		maxZoomScale: 256.0, // 1 pixel == 16 pixels   (Tela Full HD veria 120x67 pixels da imagem )
		minZoomScale: 0.0625, // 1 pixel == 0.05 pixels (Tela Full HD veria 30.720x17.280 pixels de largura 'quatro imagens 8K')
		changesDelayFetch: 1000, // quando não houve modificações
		changesDelayFastFetch: 200, // quando acabou de acontecer modificações
		historyMode: false, // se true, exibe o histórico de mudanças
		DEBUG: false,
	};
    const options = _options ? {...defaultOptions,..._options} : defaultOptions;

	// Função que desenha tudo
	const mydraw = (ctx, estado) => {
		const w = estado.width;
		const h = estado.height;

		if (estado.canvasPicture) {		
			estado.canvasPicture.ondraw(ctx,estado);

			let center = pageToZoomCanvas({x:w/2,y:h/2},estado.offsetLeft,estado.offsetTop,estado.span,estado.scale);
			let centerPixelX = Math.min(Math.max(Math.floor(center.x),0),estado.canvasPicture.imgw-1);
			let centerPixelY = Math.min(Math.max(Math.floor(center.y),0),estado.canvasPicture.imgh-1);
			
			if(centerPixelX != estado.centerPixel.x || centerPixelY != estado.centerPixel.y)
			{
				estado.centerPixel.x = centerPixelX;
				estado.centerPixel.y = centerPixelY;
				if(notifyCenterPixel) notifyCenterPixel({x:centerPixelX,y:centerPixelY});
			}
			
			ctx.fillStyle = "rgba(180,180,180,0.5)";
			ctx.strokeStyle = "rgba(100,100,100,1)";
			ctx.lineWidth = 0.25;
			ctx.strokeRect( centerPixelX, centerPixelY, 1, 1 );
			ctx.fillRect( centerPixelX, centerPixelY, 1, 1 );	
		}
	};

	const onClick = (e,estado) => {
		if(!estado.canvasPicture) return false;

		const mouse = estado.mouse;
		//console.log("[%.2f,%.2f]",mouse.x,mouse.y);

		const pixelX = Math.floor(mouse.x);
		const pixelY = Math.floor(mouse.y);

		return {
			targetPixel: {x:pixelX,y:pixelY}
		};
    };

	const everyFrame = (estado) => {
		// Tem que ser assim porque o MeuCanvas lida diferente com os eventos
		// e com o estado. então é isso, que haja gambiarra.

		if(estado.targetPixel) {
			const w = estado.width;
			const h = estado.height;
			let scale = estado.scale;
        	let spanX = estado.span.x;
			let spanY = estado.span.y;
			let centerPage = {x:w/2,y:h/2};

			let center = pageToZoomCanvas(centerPage,estado.offsetLeft,estado.offsetTop,estado.span,scale);
			let offx = (center.x - 0.5) - estado.targetPixel.x;
			let offy = (center.y - 0.5) - estado.targetPixel.y;

			if(offx * offx + offy * offy > 0.001 || Math.abs(32.0 - scale) > 0.1) {
				spanX -= offx * 0.25;
				spanY -= offy * 0.25;
				scale += (32.0 - scale) * 0.0125;
			} else {
				estado.targetPixel = false;
			}
			
			mesclarEstado(estado,{
				span: {x:spanX,y:spanY},
				targetPixel: estado.targetPixel
			});

			mesclarEstado(estado,doZoomWithCenter(estado,scale,centerPage));
		}

		if(estado.enterPressionado) {
			// Tudo bem pq só vai enviar o POST mesmo se for outra posição e/ou cor
			onPlacePixel();
		}

		if(estado.changesTerminouFetch) {
			let agora = Date.now();
			let diferenca = agora - estado.changesUltimoFetch;
			if(!estado.historyMode && diferenca > estado.changesDelayFetch) {
				doFetchChanges(estado,false);
				return false; // Não causa redraw
			}
			else
			{
				// retorna uma 'mudança' para causar redraw
				// pois acabou de terminar o último fetch então pode precisar
				if(estado.changesNeedsRedraw)
				return { changesNeedsRedraw: false }
				else return false
			}
		} else {
			// esperando terminar fetch
			if(estado.changesNeedsRedraw)
			return { changesNeedsRedraw: false }
			else return false
		}
	};

	// Não é o jeito certo? idaí?
	const myGetInitialState = (estado) => {
		mesclarEstado(estado, {
			canvasPicture: false,
			canvasPictureOffset: -1,
			changesOffset: -1,
			changesIdentifier: false,
			changesTerminouFetch: true,
			changesUltimoFetch: -1,
			changesDelayFetch: options.changesDelayFetch,
			changesDelayFastFetch: options.changesDelayFastFetch,
			changesNeedsRedraw: false,
			historyMode: options.historyMode,
			historyPictureUrl: historyPictureUrl,
			pallete: pallete,
			centerPixel: {x:0,y:0},
			targetPixel: false,
			enterPressionado: false,
			token: token
		});

		if(!estado.historyMode) {
			const socket = getSocketInstance(estado.token);
			if(socket !== null)
			registerWebSocketListeners(socket,estado);
		}

		//const pictureResponse = getData("picture", false)
		//carregarImagem(estado,imagemUrl,imagemOffset,true);

		if(!estado.historyMode) {
			doFetchPicture(estado,true);
		} else {
			doFetchHistoryPicture(estado,true);
		}
	};

	const onPropsChange = (estado) => {
		//if(!estado.canvasPicture 
		//	|| imagemOffset != estado.canvasPictureOffset)
        //{
		//	carregarImagem(estado,imagemUrl,imagemOffset,false);
		//}

		if(!estado.historyMode) {
			const socket = getSocketInstance(estado.token);
			if(socket !== null)
			registerWebSocketListeners(socket,estado);
		}

		if(!arraysEqual(estado.pallete,pallete)) {
			mesclarEstado(estado, {
				pallete: pallete
			});
		}

		if(historyPictureUrl !== estado.historyPictureUrl) {
			mesclarEstado(estado, {
				historyPictureUrl: historyPictureUrl
			});

			doFetchHistoryPicture(estado,false);
		}
	};

	const onSpan = (e,estado) => {
		if(estado.targetPixel)
		{
			return {targetPixel: false};
		}
	}

	/*const onKeyPress = (e,estado) =>
    {
        if(e.key == "Enter")
        {
            onPlacePixel();
        }
    };*/

	const onKeyDown = (e,estado) => {
		let offx = 0;
		let offy = 0;
		let offCor = 0;
		switch (e.key) {
			case "ArrowLeft":
				offx--;
				break;
			case "ArrowUp":
				offy--;
				break;
			case "ArrowRight":
				offx++;
				break;
			case "ArrowDown":
				offy++;
				break;
			case "Tab":
				e.preventDefault();
				if(e.shiftKey) {
					onChangeColor(-2);
				} else {
					onChangeColor(-1);
				}
				break;
		}

		if(offx != 0 || offy != 0)	{
			const pixelPos = estado.centerPixel;

			mesclarEstado(estado, {
				targetPixel: {
					x:pixelPos.x + offx,
					y:pixelPos.y + offy
				}
			});
		}

		if(e.key == "Enter") {
			mesclarEstado(estado,{
				enterPressionado: true
			});
        }
	};

	const onKeyUp = (e,estado) =>
    {
		if(e.key == "Enter") {
			mesclarEstado(estado,{
				enterPressionado: false
			});
        }
    }


	// https://dev.to/otamnitram/react-useeffect-cleanup-how-and-when-to-use-it-2hbm
	const onDismount = (estado) => {
		console.log("onDismount PixelsView");
		if(!estado.historyMode) {
			removeWebSocketListeners(estado);
		}
	};

	return (
		<ZoomableCanvas
			getInitialState={myGetInitialState}
			onPropsChange={onPropsChange}
			draw={mydraw}
			options={options}
			onDismount={onDismount}
			everyFrame={everyFrame}
			events={{
				onClick: onClick,
				//onKeyPress:onKeyPress,
				onKeyDown:onKeyDown,
				onKeyUp:onKeyUp,
				onSpan: onSpan
			}}
		/>
	);
}

export default memo(PixelsView);
