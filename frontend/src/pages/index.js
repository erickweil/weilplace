import Head from 'next/head'
import NextImage from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Pixels.module.css'
import NonSSRWrapper from '@/components/no-ssr-wrapper'
import { useState, useEffect } from 'react'
import ZoomableCanvas from '@/components/Canvas/ZoomableCanvas'
import { mesclarEstado } from '@/components/Canvas/CanvasControler'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  console.log("Is SSR? -->", typeof window === "undefined");


  const route_picture = "/picture";
  const route_pallete = "/pallete";

  const getApiURL = (route) => {
    const clientside_api_url = "http://localhost:3001";
    const serverside_api_url = "http://weilplace-server:3001";
    if(typeof window === "undefined") {
      return serverside_api_url+route;
    } else {
      return clientside_api_url+route;
    }
  }

  // https://nextjs.org/docs/basic-features/data-fetching/client-side
  const [data, setData] = useState({})

  const getData = (key,default_value) => {
    if(!data || !data[key] || data[key].content === undefined) return default_value;

    return data[key].content;
  }

  const setFetchData = (key,content,loaded) => {
    const newData = {};
    newData[key] = {loaded:loaded,content:content};
    
    // Fazendo assim para caso se dois UseEffect realizarem o 
    // setData ao mesmo tempo, vão concordar nos valores.
    // 
    // Tem que lembrar que o setData do UseState é assíncrono,
    // e também só realmente entende que mudou algo se for setado
    // um objeto *diferente*.
    //
    // Devido a essas razões, é necessário mutar o próprio objeto do
    // estado primeiro, para chamadas subsequentes funcionarem com
    // os valores atualizados, e ao setar o objeto do estado é necessário
    // que seja um novo objeto (com spread operator para criar ele). 
    Object.assign(data,newData);
    setData({...data});
  }

  const doFetchPallete = () => {
    console.log("Executou getPallete Is SSR? -->", typeof window === "undefined");
  
    fetch(getApiURL(route_pallete))
    .then((res) => res.json())
    .then((json) => {
      if(!json || !json.pallete) {
        console.log("Não foi possível carregar a palleta de cores.")
        return
      }
      setFetchData("pallete",json.pallete,true)
    });
  }

  const doFetchPicture = () => {
    console.log("Executou getPicture Is SSR? -->", typeof window === "undefined");
  
    fetch(getApiURL(route_picture))
    .then((res) => Promise.all([res,res.blob()]))
    .then(([res,blob]) => {
      if(!blob) {
        console.log("Não foi possível carregar a imagem.")
        return
      }

      const offset = parseInt(res.headers.get("x-changes-offset"));
      const imgObjectURL = URL.createObjectURL(blob);

      console.log("Carregou a imagem, offset %d",offset);
      setFetchData("picture",{src:imgObjectURL,offset:offset},true)
    });
  }

  useEffect(() => {
    doFetchPallete();
    doFetchPicture();
  }, [])

  const imagemCarregou = (estado,myImg,url) => {
    let imgW = myImg.naturalWidth;
    let imgH = myImg.naturalHeight;

    const W = estado.width;
    const H = estado.height;

    //if (imgW > W)
    //if (imgH > H)
    let scaleX = W/imgW;
    let scaleY = H/imgH;

    let scale = scaleY;
    if(scaleX < scaleY)
        scale = scaleX;
    
    if(!scale)
    scale = 1;

    //imgH = imgH*scale;
    //imgW = imgW*scale; 
    
    mesclarEstado(estado,{
        imagemFundo: myImg,
        imagemFundoUrl: url,
        imagemFundoPos: {
            x:0,
            y:0
        },
        imagemFundoSize: {
            x:imgW,
            y:imgH
        },
        scale:scale,
        span:{
            x:-((W/2 - (imgW/2 * scale))/scale ),
            y:0,
        }
    });
  };


  const carregarImagem = (estado) => {
    const pictureResponse = getData("picture",false)
    const myImg = new Image();
    myImg.onload = () => {
        imagemCarregou(estado,myImg,pictureResponse.src);
    };
    myImg.src = pictureResponse.src;
  };

  // Não é o jeito certo? idaí?
  const myGetInitialState = (estado) => {
      mesclarEstado(estado,{
          mouse:{pageX:0,pageY:0,x:0,y:0,left:false,middle:false,right:false},
          span:{x:0,y:0},
          spanning:false,
          scale:1.0,
          spanningStart:{x:0,y:0},
          spanned:false,
          spanEnabled:true,
          zoomEnabled:true,
          imagemFundo: false,
          imagemFundoPos: {x:0,y:0},
          imagemFundoScale: 1.0,
          imagemFundoUrl: false,
      });

      carregarImagem(estado);
  };

  // Função que desenha tudo
  const mydraw = (ctx,estado) => {
      const w = estado.width;
      const h = estado.height;

      if(estado.imagemFundo)
      {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(estado.imagemFundo,
        estado.imagemFundoPos.x,estado.imagemFundoPos.y,
        estado.imagemFundoSize.x,estado.imagemFundoSize.y);
      }
  };


  return (
    <>
      <Head>
        <title>Weilplace</title>
        <meta name="description" content="Coloque um Pixel!" />
        <meta http-equiv="pragma" content="no-cache" />
	      <meta name="viewport" content="width=device-width, minimum-scale=1, maximum-scale=1, user-scalable=no" />
  
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <NonSSRWrapper>

      {
        (() => {
          const pictureResponse = getData("picture",false)
          if(!pictureResponse){
            return (<p>Carregando...</p>)
          } else {
            //return (<canvas className={`${styles.canvas}`}></canvas>)
            return (
              <ZoomableCanvas
              getInitialState={myGetInitialState}
              draw={mydraw}
              options={{
                spanButton:"left", // left | middle | right | any
                maxZoomScale:256.0, // 1 pixel == 16 pixels   (Tela Full HD veria 120x67 pixels da imagem )
                minZoomScale:0.0625, // 1 pixel == 0.05 pixels (Tela Full HD veria 30.720x17.280 pixels de largura 'quatro imagens 8K')
                DEBUG: true,
                spanSpeed: 15
              }}
              events={{}}
              />
            );
      
          }
        })()
      }
      

      <div className={`${styles.divPlacenow}`}>
      <p >Insira um pixel <span className={`${styles.coordinates2}`}>(0,0)</span></p>
      </div>

      <div className={`${styles.colorPicker}`}>
      <div className={`${styles.colorPickerTxt}`}>
      <p className={`${styles.coordinates}`}>(0,0)</p>
      </div>
      <div className={`${styles.colorPickerTableDiv}`}>
      <table className={`${styles.colorPickerTable}`}>
      <tbody>
      <tr>
        {
          getData("pallete",[]).map(color => {
            return (
              <th className={`${styles.colorbutton}`} style={{backgroundColor:`#${color}`}}>&nbsp;</th>
            )
          })
        }
      </tr>
      </tbody>
      </table>
      </div>
      <div className={`${styles.colorPickerButtonDiv}`}>
      <button className={`${styles.button}`}>✕</button><button className={`${styles.button}`}>✓</button>
      </div>
      </div>
    </NonSSRWrapper>
    </>
  )
}