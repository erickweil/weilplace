import Head from 'next/head'
import NonSSRWrapper from '@/components/no-ssr-wrapper'
import { useState, useEffect, useRef, useCallback } from 'react'
import PixelsView from '@/components/PixelsView/PixelsView'
import { getApiURL } from '@/config/api';
import DatePicker from '@/components/DatePicker';

const pixelsViewOptions = {
  DEBUG: false,
  historyMode: true
};

export default function Home() {
  console.log("Bom dia!");

  // https://nextjs.org/docs/basic-features/data-fetching/client-side
  const [pallete, setPallete] = useState([]);

  const [centerPixelPos, setCenterPixelPos] = useState({x:0,y:0});
  const centerPixelPosRef = useRef(centerPixelPos);

  const [historyPictureUrls, setHistoryPictureUrls] = useState([]);

  const [selectedPicture, setSelectedPicture] = useState(false);

  useEffect(() => {
    console.log("Carregando o histórico!")

    const doFetchHistoryDays = async () => {    
        const allPictures = await fetch(getApiURL("/history"),{credentials: 'include'})
        .then((res) => res.json());
        
        if(!allPictures || !Array.isArray(allPictures)) {
            console.log("Não foi possível carregar o histórico")
            return
        }

        /*let allPictures = [];
        for(const date of resultHistory) {
            const resultPictures = await fetch(getApiURL("/history?date="+date),{credentials: 'include'})
            .then((res) => res.json());
            
            if(!resultPictures || !Array.isArray(resultPictures)) {
                console.log("Não foi possível carregar o histórico")
                return
            }

            allPictures = allPictures.concat(resultPictures);
        }*/

        setHistoryPictureUrls(allPictures);
        setSelectedPicture(allPictures[allPictures.length-1]);
    }

    doFetchHistoryDays();
  }, [setHistoryPictureUrls, setSelectedPicture])

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
    
  }, [centerPixelPosRef]);

  return (
    <>
      <Head>
        <title>Weilplace</title>
        <meta name="description" content="Histórico" />
        <meta http-equiv="pragma" content="no-cache" />
	      <meta name="viewport" content="width=device-width, minimum-scale=1, maximum-scale=1, user-scalable=no" />
  
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <NonSSRWrapper>

        { 
            selectedPicture === false ? <p>Carregando...</p> :
            <PixelsView
            // Muito cuidado com os props desse componente
            // Tem que ser valores que NÃO IRÃO MUDAR quando o componente atualizar qualquer coisinha
            // qualquer callback tem que usar o useCallback para não ser um objeto diferente cada vez
            // Não que irá parar de funcionar mas fica muito lento se fizer redraw a cada frame por exemplo (tipo muito lento mesmo completamente atoa)
            
                pallete={pallete} 
                options={pixelsViewOptions}
                notifyCenterPixel={notifyCenterPixel}
                onPlacePixel={onPlacePixel}
                historyPictureUrl={selectedPicture}
            />
        }

        {
            historyPictureUrls.length === 0 ? <p>Carregando...</p> :
            //historyPictureUrls.map((url) => {
                //return <li key={url}><a onClick={() => setSelectedPicture(url)}>{url}</a></li>
            //})
            <DatePicker dates={historyPictureUrls} dateSelected={selectedPicture} onSelectDate={(url) => setSelectedPicture(url)} />
        }
      
    </NonSSRWrapper>
    </>
  )
}
