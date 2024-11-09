
import Redis from "redis";

import { REDIS_URL } from "./options.js";

/** @type {ReturnType<Redis.createClient>} */
let redisClient = false;

let connectionTimeout = false;
function throwTimeoutError() {
	connectionTimeout = setTimeout(() => {
		throw new Error("Redis connection failed");
	}, 10000);
}

// só vai definir os scripts na primeira vez que tentar a conexão?
export const connectToRedis = async (luaScripts) => {
	if(redisClient !== false) return redisClient;
	// https://plainenglish.io/blog/proper-way-to-connect-redis-nodejs-80023fb033db
	let redisOptions = {
		url: REDIS_URL
	};
	if(luaScripts) redisOptions.scripts = luaScripts;

	let newRedisClient = Redis.createClient(redisOptions);
	redisClient = newRedisClient;

	newRedisClient.on("connect", () => {
		console.log("Redis - Connection status: connected");
		clearTimeout(connectionTimeout);
	});

	newRedisClient.on("end", () => {
		console.log("Redis - Connection status: disconnected");
		throwTimeoutError();
	});

	newRedisClient.on("reconnecting", () => {
		console.log("Redis - Connection status: reconnecting");
		clearTimeout(connectionTimeout);
	});

	newRedisClient.on("error", (err) => {
		console.log("Redis - Connection status: error ", { err });
		throwTimeoutError();
	});

	await newRedisClient.connect();

	return newRedisClient;
};