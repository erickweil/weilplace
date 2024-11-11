"use client";
import { Dispatch, SetStateAction, createContext, useEffect, useState } from "react";

export const GlobalContext = createContext({
  getEstado: {},
  setEstado: () => {}
});

export default function EstadoGlobal({ children, estado }) {
  const [getEstado, setEstado] = useState(estado);
  // Guardando API_URL no local storage, dessa forma o fetchApi pode acessar a URL da API no lado cliente
  useEffect(() => {
      // Se receber um prop do lado servidor, atualiza o estado
      if(estado.DATA_SERVER !== getEstado.DATA_SERVER) {
        if(estado.DATA_SERVER === undefined) {
          console.error("ESTADO GLOBAL NÃO DEFINIDO");
          return;
        }

        if(getEstado.DATA_SERVER && estado.DATA_SERVER < getEstado.DATA_SERVER) {
          console.error("ESTADO GLOBAL DESATUALIZADO NO SERVIDOR PROPS:", JSON.stringify(estado, null, 2), "ESTADO:", JSON.stringify(getEstado, null, 2));
        }

        getEstado.TOKEN = estado.TOKEN;
        getEstado.API_URL = estado.API_URL;
        getEstado.DATA_SERVER = estado.DATA_SERVER;
        setEstado({...getEstado});
      }
  }, [estado, getEstado]);

  const props = {
    getEstado: getEstado,
    setEstado: setEstado
  };

  return (
    <GlobalContext.Provider value={props}>
      {children}
    </GlobalContext.Provider>
  );
}
