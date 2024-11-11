import '@/styles/globals.css'

import React from "react"
import { obterEstadoGlobalInicial } from '@/actions/authAction';
import EstadoGlobal from '@/components/EstadoGlobal';

 
export const metadata = {
  title: 'Weilplace',
  description: 'Coloque um Pixel!',
}

export default async function RootLayout({
    // Layouts must accept a children prop.
    // This will be populated with nested layouts or pages
    children,
  }) {
    const estado = await obterEstadoGlobalInicial();    

    return (
      <html lang="pt-BR" id="__next">
        <body>
          <EstadoGlobal estado={estado}>
            {children}
          </EstadoGlobal>
        </body>
      </html>
    )
  }