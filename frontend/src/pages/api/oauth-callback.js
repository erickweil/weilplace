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

    const cookiesLogin = fetchRes.headers.getSetCookie();
    if(cookiesLogin && cookiesLogin.length > 0) {
        console.log("Cookies do /login:", cookiesLogin);

        // https://github.com/vercel/next.js/discussions/48434
        res.setHeader("Set-Cookie", fetchRes.headers.getSetCookie());
    } else {
        console.log("Não setou nenhum cookie a mais");
    }

    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/303
    /*
        when a user agent receives a 302 in response to a POST request, it uses the GET method in the subsequent redirection request, as permitted by the HTTP specification.
        In cases where you want any request method to be changed to GET, use 303 See Other. This is useful when you want to give a response to a PUT method that is not the uploaded resource but a confirmation message such as: "you successfully uploaded XYZ". 

        This response code is often sent back as a result of PUT or POST methods so the client may retrieve a confirmation, or view a representation of a real-world object (see HTTP range-14). The method to retrieve the redirected resource is always GET. 
    */
    res.redirect(303, "/");
}