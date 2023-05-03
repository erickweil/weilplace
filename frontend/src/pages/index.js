import Head from 'next/head'
import NextImage from 'next/image'
import { Inter } from 'next/font/google'
import NonSSRWrapper from '@/components/no-ssr-wrapper'
import { useState, useEffect, useRef, useCallback } from 'react'
import PixelsView from '@/components/PixelsView/PixelsView'
import { getApiURL } from '@/config/api'
import PalleteColorPicker from '@/components/PalleteColorPicker'

//const inter = Inter({ subsets: ['latin'] })

const pixelsViewOptions = {
  DEBUG: false
};


export const setFetchData = (data,key,content,loaded) => {
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
    //setData({...data});
    return {...data};
}

export const getData = (data,key,default_value) => {
  if(!data || !data[key] || data[key].content === undefined) return default_value;

  return data[key].content;
}

export const doPixelPost = async (x,y,c) => {				
  const res = await fetch(getApiURL("/pixel"),{
    method: "POST",
    body: JSON.stringify({x:x, y:y, c:c}),
    headers: { "Content-Type": "application/json" },
    credentials: 'include'
  });
  return res.json();
}

export default function Home() {
  console.log("Executou Home() Is SSR? -->", typeof window === "undefined");

  // https://nextjs.org/docs/basic-features/data-fetching/client-side
  const [data, setData] = useState({})

  const [centerPixelPos, setCenterPixelPos] = useState({x:0,y:0});
  const centerPixelPosRef = useRef(centerPixelPos);

  const [placePixelDelay, setplacePixelDelay] = useState(0);

  const [colorIndex, _setColorIndex] = useState(0);
  const colorIndexRef = useRef(colorIndex);

  const setColorIndex = (value) => {
    colorIndexRef.current = value
    _setColorIndex(value);
  };

  useEffect(() => {
    const doFetchPallete = () => {    
      fetch(getApiURL("/pallete"),{credentials: 'include'})
      .then((res) => res.json())
      .then((json) => {
        if(!json || !json.pallete) {
          console.log("Não foi possível carregar a palleta de cores.")
          return
        }
        setData(data => setFetchData(data,"pallete",json.pallete,true));
      });
    }

    doFetchPallete();
  }, [])

  // Precisa usar callback porque o PixelsView é componente com memo
  // Ou seja, para previnir re-draw a callback não pode ser criada de-novo
  const notifyCenterPixel = useCallback((pos) => {
    setCenterPixelPos(prev => {
      let ret = {x:pos.x,y:pos.y}
      centerPixelPosRef.current = ret
      return ret;
    });
  }, [setCenterPixelPos]);

  const onPlacePixel = useCallback(async () => {
    const resp = await doPixelPost(centerPixelPosRef.current.x, centerPixelPosRef.current.y,colorIndexRef.current);
    if(!resp || !resp.contents) return;
    
    if(resp.contents.delay != 0) {
      setplacePixelDelay(prev => (Date.now() + resp.contents.delay * 1000));
    }
  }, [colorIndexRef,centerPixelPosRef,setplacePixelDelay]);

  const pallete = getData(data,"pallete",[]);
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

      <PixelsView
      // Muito cuidado com os props desse componente
      // Tem que ser valores que NÃO IRÃO MUDAR quando o componente atualizar qualquer coisinha
      // qualquer callback tem que usar o useCallback para não ser um objeto diferente cada vez
      // Não que irá parar de funcionar mas fica muito lento se fizer redraw a cada frame por exemplo (tipo muito lento mesmo completamente atoa)
       
        pallete={pallete} 
        options={pixelsViewOptions}
        notifyCenterPixel={notifyCenterPixel}
        onPlacePixel={onPlacePixel}
      />
      
      <PalleteColorPicker
        timeToPlaceAgain={placePixelDelay}
        pallete={pallete}
        coordinates={centerPixelPos}
        onPlacePixel={onPlacePixel}
        colorIndex={colorIndex}
        setColorIndex={setColorIndex}
      />
      
    </NonSSRWrapper>
    </>
  )
}