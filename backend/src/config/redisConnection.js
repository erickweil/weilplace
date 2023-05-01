
import Redis from "redis";

import { REDIS_URL } from "./options.js";

let redisClient = false;

let connectionTimeout = false;
function throwTimeoutError() {
	connectionTimeout = setTimeout(() => {
		throw new Error("Redis connection failed");
	}, 10000);
}

export const connectToRedis = async () => {
	if(redisClient !== false) return redisClient;
	// https://plainenglish.io/blog/proper-way-to-connect-redis-nodejs-80023fb033db
	redisClient = Redis.createClient({
		url: REDIS_URL
	});

	redisClient.on("connect", () => {
		console.log("Redis - Connection status: connected");
		clearTimeout(connectionTimeout);
	});

	redisClient.on("end", () => {
		console.log("Redis - Connection status: disconnected");
		throwTimeoutError();
	});

	redisClient.on("reconnecting", () => {
		console.log("Redis - Connection status: reconnecting");
		clearTimeout(connectionTimeout);
	});

	redisClient.on("error", (err) => {
		console.log("Redis - Connection status: error ", { err });
		throwTimeoutError();
	});

	await redisClient.connect();

	return redisClient;
};