import ZoomableCanvas, { doZoomWithCenter, pageToZoomCanvas } from "../Canvas/ZoomableCanvas"
import NextImage from 'next/image'
import { mesclarEstado } from '@/components/Canvas/CanvasControler'
import CanvasPicture from "./CanvasPicture";
import { getApiURL } from "@/config/api";
import { handlePixelChanges } from "@/config/changesProtocol";
import React, {memo} from 'react'

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

	const { pallete, notifyCenterPixel, onPlacePixel, options:_options, ...rest } = props

    const defaultOptions = {
		spanButton: "any", // left | middle | right | any
		maxZoomScale: 256.0, // 1 pixel == 16 pixels   (Tela Full HD veria 120x67 pixels da imagem )
		minZoomScale: 0.0625, // 1 pixel == 0.05 pixels (Tela Full HD veria 30.720x17.280 pixels de largura 'quatro imagens 8K')
		changesDelayFetch: 1000,
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

		if(estado.changesTerminouFetch) {
			let agora = Date.now();
			let diferenca = agora - estado.changesUltimoFetch;
			if(diferenca > estado.changesDelayFetch) {
				doFetchChanges(estado);
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
			return false; // Não causa redraw
		}
	};

	const doFetchChanges = (estado) => {		
		estado.changesTerminouFetch = false;

		const url = getApiURL("/changes");
		url.search =  new URLSearchParams({i:estado.changesOffset});
		fetch(url,{method:"GET",credentials: 'include'})
		.then((res) => res.json())
		.then((json) => {
			try {
				const i = parseInt(json.contents.i);
				const changes = json.contents.changes;
				const identifier = json.contents.identifier;
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

	// Pegando a imagem com fetch para ler o Header com o offset das mudanças
    // Assim é garantido que não faltará nenhum pixel a ser colocado.
    const doFetchPicture = (estado,centralizar) => { 
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
	};

	const carregarImagem = (estado,url,imagemOffset,identifier,centralizar) => {
		const myImg = new Image();
		myImg.onload = () => {
			imagemCarregou(estado, myImg, url,imagemOffset,identifier,centralizar);
		};
		myImg.src = url;
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
			changesNeedsRedraw: false,
			pallete: pallete,
			centerPixel: {x:0,y:0},
			targetPixel: false
		});

		//const pictureResponse = getData("picture", false)
		//carregarImagem(estado,imagemUrl,imagemOffset,true);
		doFetchPicture(estado,true);
	};

	const onPropsChange = (estado) => {
		//if(!estado.canvasPicture 
		//	|| imagemOffset != estado.canvasPictureOffset)
        //{
		//	carregarImagem(estado,imagemUrl,imagemOffset,false);
		//}

		if(!arraysEqual(estado.pallete,pallete)) {
			mesclarEstado(estado, {
				pallete: pallete
			});
		}
	};

	const onSpan = (e,estado) => {
		if(estado.targetPixel)
		{
			return {targetPixel: false};
		}
	}

	const onKeyPress = (e,estado) =>
    {
        if(e.key == "Enter")
        {
            onPlacePixel();
        }
    };


	return (
		<ZoomableCanvas
			getInitialState={myGetInitialState}
			onPropsChange={onPropsChange}
			draw={mydraw}
			options={options}
			
			everyFrame={everyFrame}
			events={{
				onClick: onClick,
				onKeyPress:onKeyPress,
				onSpan: onSpan
			}}
		/>
	);
}

export default memo(PixelsView);