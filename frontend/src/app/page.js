"use client";

import '@/styles/globals.css'
import Head from 'next/head'
import NextImage from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Pixels.module.css'
import NonSSRWrapper from '@/components/no-ssr-wrapper'
import { useState, useEffect, useRef, useCallback, useContext } from 'react'
import PixelsView from '@/components/PixelsView/PixelsView'
import { getApiURL } from '@/config/api'
import PalleteColorPicker from '@/components/PalleteColorPicker'
import { getSocketInstance, requestWebSocket } from '@/config/websocket'
import GoogleLogin from '@/components/GoogleLogin'
import Link from 'next/link'
import { GlobalContext } from '@/components/EstadoGlobal';

//const inter = Inter({ subsets: ['latin'] })

const pixelsViewOptions = {
  DEBUG: false
};

const _lastPixelPost = {x:-1,y:-1,c:-1};
export const doPixelPost = async (token, x,y,c) => {
  if(x == _lastPixelPost.x && y == _lastPixelPost.y && c == _lastPixelPost.c) {
    return;
  }
  
  _lastPixelPost.x = x;
  _lastPixelPost.y = y;
  _lastPixelPost.c = c;

  const socket = getSocketInstance(token);
	if(socket !== null) {
    return await requestWebSocket(socket,"POST","/pixel",{x:x, y:y, c:c});
  }
  else {
    const res = await fetch(getApiURL("/pixel"),{
      method: "POST",
      body: JSON.stringify({x:x, y:y, c:c}),
      headers: { 
        "Content-Type": "application/json",
        ...(token ? {"Authorization": "Bearer " + token} : {})
      },
      credentials: 'include'
    });
    return res.json();
  }
}

export default function Home() {
  console.log("Bom dia!");

  const context = useContext(GlobalContext);

  const token = context.getEstado.TOKEN;
  const precisaLogin = process.env.NEXT_PUBLIC_REQUIRE_GOOGLE_LOGIN === "true";

  // https://nextjs.org/docs/basic-features/data-fetching/client-side
  const [pallete, setPallete] = useState(false);

  const [centerPixelPos, setCenterPixelPos] = useState({x:0,y:0});
  const centerPixelPosRef = useRef(centerPixelPos);

  const [placePixelDelay, setplacePixelDelay] = useState(0);

  const [colorIndex, _setColorIndex] = useState(0);
  const colorIndexRef = useRef(colorIndex);

  const [dadosUsuarioLogado, setdadosUsuarioLogado] = useState(null);

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

  // Mesmo não precisando login, /login/check irá obter o nome haiku() aleatório gerado na API
  useEffect(() => {
    const doFetchLoginCheck = () => {    
      fetch(getApiURL("/login/check"),{
        headers: {
          ...(token ? {"Authorization": "Bearer " + token} : {})
        },
        credentials: 'include'
      })
      .then((res) => res.json())
      .then((json) => {
        if(!json || json.error) {
          console.log("Não está logado");
        } else {
          console.log("Dados usuário logado:",json);
          setdadosUsuarioLogado(json);
        }
      });
    }

    doFetchLoginCheck();
  }, [token])

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
      const resp = await doPixelPost(token, centerPixelPosRef.current.x, centerPixelPosRef.current.y,colorIndexRef.current);
      if(!resp) return;
      
      if(resp.delay !== undefined && resp.delay != 0) {
        setplacePixelDelay(prev => (Date.now() + resp.delay * 1000));
      }
    } catch (erro) {
      console.log(erro);
    }
  }, [token,colorIndexRef,centerPixelPosRef,setplacePixelDelay]);

  const setColorIndex = useCallback((value) => {
    if(value < 0) {
      if(value === -1) {
        colorIndexRef.current = (colorIndexRef.current + 1) % pallete.length;
      } else {
        colorIndexRef.current = colorIndexRef.current === 0 ? pallete.length -1 : colorIndexRef.current - 1;
      }
    } else {
      colorIndexRef.current = value
    }
    _setColorIndex(colorIndexRef.current);
  }, [colorIndexRef, pallete, _setColorIndex]);

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
        // Atualização: Para de funcionar mesmo, perde o callback do publishchanges que chega via websockets
        
          pallete={pallete} 
          options={pixelsViewOptions}
          notifyCenterPixel={notifyCenterPixel}
          onChangeColor={setColorIndex}
          onPlacePixel={onPlacePixel}
          token={token}
        />
      }

      <div className={`${styles.topLinkInfo}`}>
        <Link href="/historico">Histórico</Link>      
        <Link href={getApiURL("/picture")} download>Baixar</Link>
      </div>
      
      { 
        (!precisaLogin || dadosUsuarioLogado) ? 
        <PalleteColorPicker
            timeToPlaceAgain={placePixelDelay}
            pallete={pallete}
            coordinates={centerPixelPos}
            onPlacePixel={onPlacePixel}
            colorIndex={colorIndex}
            setColorIndex={setColorIndex}
        />
        :
        <GoogleLogin />
      }

      
    </NonSSRWrapper>
    </>
  )
}
