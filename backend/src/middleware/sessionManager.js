
// https://stackoverflow.com/questions/7666516/fancy-name-generator-in-node-js

import { REQUIRE_GOOGLE_LOGIN } from "../config/options.js";
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

export class SessionManager {

	static initSession(req,res,next) {

		if(!req.session.username) {	
			req.session.username = haiku();
            req.session.userinfo = null;
            req.session.save();
		}

		next();
	}

    static doLogin(session, userinfo) {
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
        session.userinfo = userinfo;
        // https://developers.google.com/identity/openid-connect/openid-connect#obtainuserinfo
        // An identifier for the user, unique among all Google accounts and never reused. A Google account can have multiple email addresses at different points in time, but the sub value is never changed. Use sub within your application as the unique-identifier key for the user. Maximum length of 255 case-sensitive ASCII characters.
        session.username = userinfo.sub;
        session.save();
    }

    static checkSession(session) {
        //console.log("Check Session:", session);
        if(!session || !session.username) {
            //console.log("Sem sessão!");
            return {
                hasSession: false,
                loggedIn: false,
                userinfo: null
            };
        }

        if(!session.userinfo) {
            //console.log("Sem userinfo!");
            return {
                hasSession: true,
                loggedIn: false,
                userinfo: { username: session.username }
            };
        }

        //console.log("Possui sessão e está logado");
        return {
            hasSession: true,
            loggedIn: true,
            userinfo: { ...session.userinfo, ...{ username: session.username } }
        };
    }

    static requireLoggedInUserInfo(session) {
        const { hasSession, loggedIn, userinfo } = SessionManager.checkSession(session);
        if(REQUIRE_GOOGLE_LOGIN) {
            if(!hasSession || !loggedIn) {
                return undefined;
            }

            return userinfo;
        } else {
            if(!hasSession) {
                return undefined;
            }

            return userinfo;
        }
    }
}