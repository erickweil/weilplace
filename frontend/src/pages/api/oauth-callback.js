import { getApiURL } from "@/config/api";
import { NextApiRequest, NextApiResponse } from "next";
/**
 * 
 * @param {NextApiRequest} req 
 * @param {NextApiResponse} res 
 * @returns 
 */
export default async function handler(req, res) {
    console.log(req.method, req.url);

    const searchParams = new URLSearchParams(req.url.split('?')[1]);
    searchParams.forEach((value, key) => console.log(`Search Params --> ${key}: ${value}`));

    const body = req.body;
    console.log("Body OAUTH2 -->", body);

    const cookies = req.cookies;
    console.log("Cookies OAUTH2 -->", cookies);

    if(!body || !body.credential || !body.g_csrf_token) {
        return res.status(400).json({message: "Credenciais inválidas"});
    }

    const fetchRes = await fetch(getApiURL("/login"),{
        method: "POST",
        body: JSON.stringify({
            credential: body.credential,
            g_csrf_token: body.g_csrf_token
        }),
        headers: { 
            "Content-Type": "application/json",
            "Cookie": req.headers.cookie
        },
        credentials: 'include'
    });
    const json = await fetchRes.json();

    if(fetchRes.status !== 200 || !json || json.error) {
        console.log("Erro ao logar:", json);
        return res.status(500).json({message: "Erro ao logar"+json.error});
    }

    console.log("Logado com sucesso:", json);
    console.log("Cookies do /login:", fetchRes.headers.getSetCookie());

    // https://github.com/vercel/next.js/discussions/48434
    res.setHeader("Set-Cookie", fetchRes.headers.getSetCookie());
    res.redirect(307, "/?login=success");
}