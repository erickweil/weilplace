
// https://stackoverflow.com/questions/7666516/fancy-name-generator-in-node-js

import { readFileSync } from "fs";
import path from "path";
const PATH_NOMES = process.env.PATH_NOMES || "./public/nomes.json";
const NOMES = JSON.parse(readFileSync(path.join(process.cwd(), PATH_NOMES),"utf8"));

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
		}

		next();
	}
}