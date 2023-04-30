import Head from 'next/head'
import NextImage from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Pixels.module.css'
import NonSSRWrapper from '@/components/no-ssr-wrapper'
import { useState, useEffect } from 'react'
import PixelsView from '@/components/PixelsView/PixelsView'
import { getApiURL } from '@/config/api'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  console.log("Is SSR? -->", typeof window === "undefined");

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
  
    fetch(getApiURL("/pallete"))
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
  
    fetch(getApiURL("/picture"))
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
          const pictureResponse = getData("picture",false);
          const pallete = getData("pallete",[]);
          if(!pictureResponse) return (<p>Carregando...</p>);
          else return ( 
          <PixelsView 
            pallete={pallete} 
            imagemUrl={pictureResponse.src} 
            imagemOffset={pictureResponse.offset} 
            options={{
              DEBUG: true
            }}
            /> 
          );
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