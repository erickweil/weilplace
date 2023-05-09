import Head from 'next/head'
import NextImage from 'next/image'
import { Inter } from 'next/font/google'
import NonSSRWrapper from '@/components/no-ssr-wrapper'
import { useState, useEffect, useRef, useCallback } from 'react'
import PixelsView from '@/components/PixelsView/PixelsView'
import { getApiURL } from '@/config/api'
import PalleteColorPicker from '@/components/PalleteColorPicker'
import { getSocketInstance, requestWebSocket } from '@/config/websocket'

//const inter = Inter({ subsets: ['latin'] })

const pixelsViewOptions = {
  DEBUG: false
};

const _lastPixelPost = {x:-1,y:-1,c:-1};
export const doPixelPost = async (x,y,c) => {
  if(x == _lastPixelPost.x && y == _lastPixelPost.y && c == _lastPixelPost.c) {
    return;
  }
  
  _lastPixelPost.x = x;
  _lastPixelPost.y = y;
  _lastPixelPost.c = c;

  const socket = getSocketInstance();
	if(socket !== null) {
    return await requestWebSocket(socket,"POST","/pixel",{x:x, y:y, c:c});
  }
  else {
    const res = await fetch(getApiURL("/pixel"),{
      method: "POST",
      body: JSON.stringify({x:x, y:y, c:c}),
      headers: { "Content-Type": "application/json" },
      credentials: 'include'
    });
    return res.json();
  }
}

export default function Home() {
  console.log("Bom dia!");

  // https://nextjs.org/docs/basic-features/data-fetching/client-side
  const [pallete, setPallete] = useState(false);

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
        setPallete(json.pallete);
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
    try {
      const resp = await doPixelPost(centerPixelPosRef.current.x, centerPixelPosRef.current.y,colorIndexRef.current);
      if(!resp) return;
      
      if(resp.delay !== undefined && resp.delay != 0) {
        setplacePixelDelay(prev => (Date.now() + resp.delay * 1000));
      }
    } catch (erro) {
      console.log(erro);
    }
  }, [colorIndexRef,centerPixelPosRef,setplacePixelDelay]);

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
        pallete === false ? <p>Carregando...</p> :
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
      }
      
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
