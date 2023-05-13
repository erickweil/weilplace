import {jest,beforeAll,afterAll,describe,expect,test} from "@jest/globals";

import { IMAGE_WIDTH } from "../src/config/options.js";

import { handlePostPixel, handleGetChanges } from "../src/routes/pixelsRoutes.js";
import PixelChanges from "../src/controller/pixelChanges.js";
import RedisMock from "../src/controller/redisMock.js";


const session = {username: "erick"};

// Poderia utilizar o supertest, mas já que o controller é separado chamar ele direto vai dar
// no exato mesmo comportamento, sem toda a lentidão de ligar o server e esperar requisições
describe("Testando Rota Pixels",() => {
	const redisMock = new RedisMock();

	beforeAll(async () => {        
		await PixelChanges.init(redisMock, {
			place_delay: 0,
		});
	});

	test("Checando mudanças começando vazias", async () => {
		expect(await handleGetChanges({i:"0"})).toMatchObject({
			status: 200,
			json: {
				message: "OK",
				i: 0
			}
		});
	});
  

	test("Chamando mudanças sem passar o parâmetro i", async () => {
		expect(await handleGetChanges({})).toMatchObject({
			status: 400
		});
	});

	test("Setando pixel", async () => {
		await PixelChanges.init(redisMock, {
			place_delay: 100,
		});

		expect(await handlePostPixel({x:"0",y:"0",c:"0"},session)).toMatchObject({
			status:200,
			json: {
				message: "OK",
				delay: 100
			}
		});
	});

	test("Setando pixel antes do delay acabar", async () => {
		expect(await handlePostPixel({x:"0",y:"0",c:"0"},session)).toMatchObject({
			status:200,
			json: {
				message: "DELAY"
			}
		});
	});

	test("Mudanças do pixel setado", async () => {
		expect(await handleGetChanges({i:"0"})).toMatchObject({
			status: 200,
			json: {
				message: "OK",
				i: 1,
				changes: "AAAAAAAA"
			}
		});
	});

	test("Setando uma linha inteira", async () => {
		await PixelChanges.init(redisMock, {
			place_delay: 0,
		});

		for(let x = 0;x < IMAGE_WIDTH;x++) {
			await handlePostPixel({x:""+x,y:"0",c:"0"},session);
		}

		// Pega todas as mudanças
		expect(await handleGetChanges({i:"0"})).toMatchObject({
			status: 200,
			json: {
				message: "OK",
				i: IMAGE_WIDTH + 1
			}
		});
	});

	test("Testando resposta não passar do limite", async () => {
		await PixelChanges.init(redisMock, {
			max_changes_response: 256,
		});
		// Pega todas as mudanças
		expect(await handleGetChanges({i:"0"})).toMatchObject({
			status: 200,
			json: {
				message: "OK",
				i: 256,
				more: true
			}
		});
	});

});