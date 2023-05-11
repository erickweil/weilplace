import { handleGetTeste } from "../src/routes/testeRoutes.js";
import {jest,describe,expect,test} from "@jest/globals";


describe("Teste",() => {

	test("Receber mensagem", async () => {
		const mensagemEnviada = "Oi tudo bem?";
		const resp = await handleGetTeste({msg: mensagemEnviada});

		let mensagemRecebida = resp.json.body.msg;

		expect(mensagemRecebida).toBe(mensagemEnviada);
	});

});
