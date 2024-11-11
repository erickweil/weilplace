import { getApiURL } from "@/config/api";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
/**
 * 
 * @param {NextRequest} req 
 * @returns {Response}
 */
export async function POST(req) {
    console.log(req.method, req.url);

    const searchParams = new URLSearchParams(req.url.split('?')[1]);
    searchParams.forEach((value, key) => console.log(`Search Params --> ${key}: ${value}`));

    // https://github.com/vercel/next.js/discussions/44212
    
    const formData = await req.formData();
    const body = {
        credential: formData.get("credential"),
        g_csrf_token: formData.get("g_csrf_token")
    };
    
    console.log("Body OAUTH2 -->", body);

    const reqCookies = req.cookies;
    console.log("Cookies OAUTH2 -->", reqCookies);

    if(!body || !body.credential || !body.g_csrf_token) {
        return NextResponse.json({message: "Credenciais inválidas"}, {status: 400});
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
        return NextResponse.json({message: "Erro ao logar"+json.error}, {status: 500});
    }

    const { token, payload } = json;
    console.log("Logado com sucesso:", payload);

    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/303
    /*
        when a user agent receives a 302 in response to a POST request, it uses the GET method in the subsequent redirection request, as permitted by the HTTP specification.
        In cases where you want any request method to be changed to GET, use 303 See Other. This is useful when you want to give a response to a PUT method that is not the uploaded resource but a confirmation message such as: "you successfully uploaded XYZ". 

        This response code is often sent back as a result of PUT or POST methods so the client may retrieve a confirmation, or view a representation of a real-world object (see HTTP range-14). The method to retrieve the redirected resource is always GET. 
    */
    //res.redirect(303, "/");


    // This will purge the Client-side Router Cache, and revalidate the Data Cache on the next page visit.
    revalidatePath('/', 'layout');

    // Salva o token no cookie, para ser usado em futuras requisições
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_WEB_URL), {
        status: 303,
        headers: {
            /**
            https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/Set-Cookie
            Set-Cookie: <nome-cookie>=<valor-cookie>; Domain=<domain-value>; Secure; HttpOnly
             */
            "Set-Cookie": `token=${token}; Path=/; SameSite=Strict; Secure; HttpOnly; Expires=${new Date(payload.exp * 1000).toUTCString()}`
        }
    });
}