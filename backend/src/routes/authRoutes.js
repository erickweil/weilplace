import express from "express";
import GoogleLogin from "../controller/googleLogin.js";
import { SessionManager } from "../middleware/sessionManager.js";
import { genericRouteHandler } from "../middleware/routeHandler.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticação
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Fazer login com Google
 *     description: "Faz login com Google e retorna um token de autenticação, veja: https://developers.google.com/identity/gsi/web/reference/html-reference#id-token-handler-endpoint"
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               g_csrf_token:
 *                 type: string
 *                 description: A random string that changes with each request to the handler endpoint.
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZ..."
 *               credential:
 *                 type: string
 *                 description: The credential object returned by the Google Identity Services API.
 *                 example: 93794aaaa4ef852e
 *     responses:
 *       200:
 *         description: Logado com sucesso
 */
router.post("/login", async (req,res) => {
    try {
        console.log("Login com Google");
        console.log("Body:",req.body);
        console.log("Cookies:",req.headers.cookie);

        await GoogleLogin.verify(req.body.credential, req.session);

        return res.status(200).json({message: "Logado com sucesso"});
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Erro ao logar"+error});
    }
});


/**
 * @swagger
 * /login/check:
 *   get:
 *     summary: Verificar se o usuário está logado
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Usuário logado
 */

export const handleLoginCheck = async (query,session) => {
    const userinfo = SessionManager.requireLoggedInUserInfo(session);
    if(!userinfo) {
        return { status: 401, json: {error: "Não logado"} };
    }

    return { status: 200, json: userinfo };
};

router.get("/login/check", genericRouteHandler("GET","/login/check",true,handleLoginCheck));

export default router;