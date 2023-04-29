import ZoomableCanvas from "../Canvas/ZoomableCanvas"
import NextImage from 'next/image'
import { mesclarEstado } from '@/components/Canvas/CanvasControler'
import CanvasPicture from "./CanvasPicture";
import { getApiURL } from "@/config/api";
import { convertBase64ToBuffer, readTwoInt40bits } from "@/util/bitPacker";

const PixelsView = (props) => {
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
			}

			return false; // Não causa redraw
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

					if(applyChangesOnImage(estado,changes)) {
						//redraw?
					}
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

	const applyChangesOnImage = (estado,changes) => {

		if(!changes) return false;

		const buffer = convertBase64ToBuffer(changes);
		if(buffer.byteLength % 6 == 0)
		{
			for(let i = 0;i< buffer.byteLength/6;i++)
			{
				let xy = readTwoInt40bits([
					buffer.readUInt8(i*6 + 0),
					buffer.readUInt8(i*6 + 1),
					buffer.readUInt8(i*6 + 2),
					buffer.readUInt8(i*6 + 3),
					buffer.readUInt8(i*6 + 4)]);

				let color = buffer.readUInt8(i*6 + 5);

				//PixelSaver.setSinglePixel(xy[0],xy[1],PALLETE[color]);
				estado.canvasPicture.drawPixel([0,255,0],xy[0],xy[1]);
			}

			return true;
		} else {
			console.log("Erro ao aplicar mudanças na imagem, buffer de tamanho inválido:"+buffer.byteLength);
			return false;
		}
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
			changesDelayFetch: 3000,
			pallete: false,
			
		});

		//const pictureResponse = getData("picture", false)
		carregarImagem(estado,props.imagemUrl,props.imagemOffset,props.pallete);
	};

	const onPropsChange = (estado) => {
		if(!estado.canvasPicture 
			|| props.pallete != estado.pallete
			|| props.imagemOffset != estado.canvasPictureOffset)
        {
			carregarImagem(estado,props.imagemUrl,props.imagemOffset,props.pallete);
		}
	};

	return (
		<ZoomableCanvas
			getInitialState={myGetInitialState}
			onPropsChange={onPropsChange}
			draw={mydraw}
			options={{
				spanButton: "any", // left | middle | right | any
				maxZoomScale: 256.0, // 1 pixel == 16 pixels   (Tela Full HD veria 120x67 pixels da imagem )
				minZoomScale: 0.0625, // 1 pixel == 0.05 pixels (Tela Full HD veria 30.720x17.280 pixels de largura 'quatro imagens 8K')
				DEBUG: true,
				spanSpeed: 15
			}}
			
			everyFrame={everyFrame}
			events={{}}
		/>
	);
}

export default PixelsView;