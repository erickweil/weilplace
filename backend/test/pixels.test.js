/* eslint-disable indent */
import dotenv from "dotenv";
import {jest,beforeAll,describe,expect,test} from "@jest/globals";

import { handlePostPixel, handleGetChanges } from "../src/routes/pixelsRoutes.js";
import { IMAGE_WIDTH, initOptions } from "../src/config/options.js";
import PixelChanges from "../src/controller/pixelChanges.js";

const session = {username: "erick"};

describe("Testando Rota Pixels",() => {

	beforeAll(async () => {
		dotenv.config();
        process.env.PLACE_DELAY = "100";
		initOptions();
        
		await PixelChanges.init(false);
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
        process.env.PLACE_DELAY = "0";
        initOptions();

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
        process.env.MAX_CHANGES_RESPONSE = "256";
        initOptions();
        // Pega todas as mudanças
        expect(await handleGetChanges({i:"0"})).toMatchObject({
			status: 200,
            json: {
                message: "OK",
                i: 256
            }
        });
	});

});