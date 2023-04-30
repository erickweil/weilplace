import ZoomableCanvas from "../Canvas/ZoomableCanvas"
import NextImage from 'next/image'
import { mesclarEstado } from '@/components/Canvas/CanvasControler'
import CanvasPicture from "./CanvasPicture";
import { getApiURL } from "@/config/api";
import { handlePixelChanges } from "@/config/changesProtocol";

const PixelsView = (props) => {

	const { pallete, imagemUrl, imagemOffset, options:_options, ...rest } = props

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
		}
	};

	const everyFrame = (estado) => {
		// Tem que ser assim porque o MeuCanvas lida diferente com os eventos
		// e com o estado. então é isso, que haja gambiarra.

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
		console.log("Executou doFetchChanges(%d)",estado.changesOffset);
		
		estado.changesTerminouFetch = false;

		const url = getApiURL("/changes");
		url.search =  new URLSearchParams({i:estado.changesOffset});
		fetch(url,{method:"GET"})
		.then((res) => res.json())
		.then((json) => {
			try {
				const i = parseInt(json.contents.i);
				const changes = json.contents.changes;
				if(i != estado.changesOffset) {
					estado.changesOffset = i;
					estado.changesNeedsRedraw = handlePixelChanges(changes,pallete,(hexColor,x,y) => {
						estado.canvasPicture.drawPixel(hexColor,x,y);
					});
				}
			} catch(e) {
				console.log("Erro ao carregar mudanças da imagem:",e);
			}

			estado.changesUltimoFetch = Date.now();
			estado.changesTerminouFetch = true;
		})
		.catch((error) => {
			console.log(error);
			estado.changesUltimoFetch = Date.now();
			estado.changesTerminouFetch = true;
		});

	}

	const imagemCarregou = (estado, myImg, url,imagemOffset,pallete) => {
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
			pallete: pallete,

			scale: scale,
			span: {
				x: -((W / 2 - (imgW / 2 * scale)) / scale),
				y: 0,
			}
		});
	};

	const carregarImagem = (estado,url,imagemOffset,pallete) => {
		const myImg = new Image();
		myImg.onload = () => {
			imagemCarregou(estado, myImg, url,imagemOffset,pallete);
		};
		myImg.src = url;
	};

	// Não é o jeito certo? idaí?
	const myGetInitialState = (estado) => {
		mesclarEstado(estado, {
			canvasPicture: false,
			canvasPictureOffset: -1,
			changesOffset: -1,
			changesTerminouFetch: true,
			changesUltimoFetch: -1,
			changesDelayFetch: options.changesDelayFetch,
			changesNeedsRedraw: false,
			pallete: false,
			
		});

		//const pictureResponse = getData("picture", false)
		carregarImagem(estado,imagemUrl,imagemOffset,pallete);
	};

	const onPropsChange = (estado) => {
		if(!estado.canvasPicture 
			|| pallete != estado.pallete
			|| imagemOffset != estado.canvasPictureOffset)
        {
			carregarImagem(estado,imagemUrl,imagemOffset,pallete);
		}
	};

	return (
		<ZoomableCanvas
			getInitialState={myGetInitialState}
			onPropsChange={onPropsChange}
			draw={mydraw}
			options={options}
			
			everyFrame={everyFrame}
			events={{}}
		/>
	);
}

export default PixelsView;