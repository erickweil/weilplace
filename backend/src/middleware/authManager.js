import jwt from "jsonwebtoken";
import { promisify } from "util";
import { SESSION_SECRET, REQUIRE_GOOGLE_LOGIN, SESSION_MAX_AGE } from "../config/options.js";

// https://stackoverflow.com/questions/7666516/fancy-name-generator-in-node-js

// import { readFileSync } from "fs";
import { nomesJson } from "../config/nomes.js";

//const PATH_NOMES = process.env.PATH_NOMES || "./public/nomes.json";
//const NOMES = JSON.parse(readFileSync(PATH_NOMES,"utf8"));
const NOMES = nomesJson;

export const haiku = () =>{  
	const nome = NOMES.nomes[Math.floor(Math.random()*(NOMES.nomes.length-1))];
	const sobrenome = NOMES.sobrenomes[Math.floor(Math.random()*(NOMES.sobrenomes.length-1))];
	//console.log("%d nomes e %d sobrenomes, %d possibilidades",NOMES.nomes.length,NOMES.sobrenomes.length,NOMES.nomes.length*NOMES.sobrenomes.length);
	return nome.toLowerCase()+"_"+sobrenome.toLowerCase();
};

export class AuthManager {

    static async _decodeJWTToken(token) {
        // promisify converte uma função de callback para uma função async/await
        try {    
            return {
                decoded: await promisify(jwt.verify)(token, SESSION_SECRET, {}), 
                error: false
            };
        } catch (error) { // Depois tinha que fazer um tratamento de erro melhor que detectasse se o token expirou ou se é inválido
            let errorMessage = undefined;
            if(error instanceof jwt.JsonWebTokenError) {
                if(error.message == "jwt must be provided") {
                    errorMessage = "O token de autenticação não foi fornecido";
                } else if (error.message == "jwt malformed" || error.message == "invalid signature" || error.message == "invalid token") {
                    errorMessage = "O token de autenticação foi alterado ou é inválido";
                } else if (error.message == "jwt expired") {
                    errorMessage = "O token de autenticação expirou";
                } else {    
                    errorMessage = "Problemas ao decodificar o token JWT: "+(error.message || error);
                }
            } else {
                errorMessage = "Erro ao decodificar o token JWT:"+(error.message || error);
            }
    
            return {decoded: null, error: errorMessage};
        }
    }

    static tokenMiddleware(exigirLogin = true, webSockets = false) {
        return async (req, res, next) => {
            try {
                let auth;
                if(webSockets) { // usado para testes e para quando é websockets apenas
                    let url = new URL(`http://localhost${req.url}`);
                    auth = url.searchParams.has("token") ? `Bearer ${url.searchParams.get("token")}` : undefined;
                } else {
                    auth = req.headers.authorization;
                }
        
                if (!auth) {
                    // Se essa rota não EXIGE que seja feito login, não tem problema...
                    // Assim a mesma rota pode funcionar diferente para usuários logados vs não logados
                    if (!exigirLogin) {
                        //console.log("Usuário não autenticado, mas não é necessário");
                        next();
                        return;
                    }
                            
                    return res.status(401).json({error:"É necessário se autenticar"});
                }
        
                // Bearer eyJhbGciOnR5VCJ9.eyJpZCI6IjY0YTYzMj4cCI6MTIyM30.iZvQN6NiGQ9GE1OyLtEockkqc
                const [, token] = auth.split(" "); // desestruturação
        
                // promisify converte uma função de callback para uma função async/await
                const {decoded, error} = await AuthManager._decodeJWTToken(token);
                if (error) {
                    return res.status(498).json({error: error});
                } else { // se o token for válido
                    // Fazer essa pesquisa no banco invalida toda as vantagens do JWT
                    // Mas agora me explica como invalidar todos os tokens de um usuário se:
                    // - Usuário trocou a senha
                    // - Usuário foi deletado
                    // Mudar o secret não resolve - Requerimento é invalidar todos os tokens de um usuário, e não de todos os usuários
                    // Blacklist em memória de Tokens não resolve - Torna a aplicação Statefull e impede múltiplas instâncias do server rodando
                    // Blacklist no banco é equivalente a pesquisar o usuário
                    // Se utilizar o redis para verificar os tokens então vamos utilizar sessão logo.
                    // // const usuario = await Usuario.findById(decoded._id).select("+papeis +email");            
                    // // if (!usuario)
                    // //     return res.status(498).json({ error: true, message: "O token de autenticação foi invalidado pelo servidor" });
        
                    // Refresh Token resolve? daqui 15 minutos o token é invalidado...
        
                    //console.log("SETANDO: req.decodedToken: ", decoded);
                    req.tokenPayload = decoded;
                    next();
                    return;
                }
            } catch(error) {
                console.error(error);
                return res.status(500).json({error: "Erro ao processar o token de autenticação"});
            }
        };
    }

    static async createToken(userinfo) {
        /**
        Payload: {
            "iss": "https://accounts.google.com",
            "azp": "000000-blablabla.apps.googleusercontent.com",
            "aud": "000000-blablabla.apps.googleusercontent.com",
            "sub": "01234567890123789",
            "email": "email@example.com",
            "email_verified": true,
            "nbf": 01234567890,
            "name": "nome completo",
            "picture": "https://lh3.googleusercontent.com/a/blablablablablablablablabla",
            "given_name": "nome",
            "family_name": "completo",
            "iat": 1730208693,
            "exp": 1730212293,
            "jti": "01234567890abcdef"
        }
        */
        //session.userinfo = userinfo;
        // https://developers.google.com/identity/openid-connect/openid-connect#obtainuserinfo
        // An identifier for the user, unique among all Google accounts and never reused. A Google account can have multiple email addresses at different points in time, but the sub value is never changed. Use sub within your application as the unique-identifier key for the user. Maximum length of 255 case-sensitive ASCII characters.
        //session.username = userinfo.sub;
        //session.save();
        const token = await promisify(jwt.sign)(
            {
                username: userinfo.sub,
                name: userinfo.name
            },
            SESSION_SECRET,
            {
                expiresIn: SESSION_MAX_AGE // expressed in seconds or a string describing a time span
            }
        );

        // Para retornar o tempo de expiração
        const {decoded, error} = await AuthManager._decodeJWTToken(token);
        if (error) {
            throw new Error(error);
        }

        return {
            token: token, 
            payload: decoded
        };
    }

    static requireLoggedInUserInfo(tokenPayload) {
        if(REQUIRE_GOOGLE_LOGIN) {
            if(!tokenPayload) {
                return undefined;
            }

            return tokenPayload;
        } else {
            return { 
                username: "anonimo",
                name: "Anônimo"
            };
        }
    }
}