import { OAuth2Client } from "google-auth-library";
import { OAUTH2_CLIENT_ID } from "../config/options.js";
import { SessionManager } from "../middleware/sessionManager.js";

// Cria um novo cliente OAuth2 (Cache)
const client = new OAuth2Client(OAUTH2_CLIENT_ID);

class GoogleLogin {
    // https://developers.google.com/identity/gsi/web/guides/verify-google-id-token#using-a-google-api-client-library
    static async verify(credential, session) {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: OAUTH2_CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });
        const payload = ticket?.getPayload();
        if(!payload) {
            throw new Error("Token inválido");
        }

        console.log("Payload:", JSON.stringify(payload,null,2));
        
        SessionManager.doLogin(session, payload);
    }
}

export default GoogleLogin;