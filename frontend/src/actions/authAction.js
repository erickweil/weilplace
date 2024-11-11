"use server";

import { cookies } from "next/headers";

export async function obterEstadoGlobalInicial() {
    const _cookies = await cookies();
    return {
        API_URL: process.env.API_URL_CLIENT,
        TOKEN: _cookies.has("token") ? _cookies.get("token")?.value : null,
        DATA_SERVER: new Date()
    };
}
