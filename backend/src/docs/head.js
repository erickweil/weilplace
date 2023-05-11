import { API_URL } from "../config/options.js";

const getSwaggerOptions = () => {
	return {
		swaggerDefinition: {
			openapi: "3.0.0",
			info: {
				title: "Pixels API",
				version: "1.0.0",
				description: "API para desenhar pixels em um canvas compartilhado",
				contact: {
					name: "Erick Leonardo Weil",
					email: "erick.weil@ifro.edu.br",
				},
			},
			servers: [
				{
					url: API_URL,
				}
			],
		},
		paths: {},
		apis: ["./src/routes/*.js"],
	};
};

export default getSwaggerOptions;