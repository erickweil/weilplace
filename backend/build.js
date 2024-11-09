// Transformar pallete em um pallete.json no public/, para ser consumido pelo frontend direto
import { writeFile } from "fs/promises";
import { palleteJson } from "./src/config/pallete.js";

await writeFile("./public/pallete.json", JSON.stringify(palleteJson, null, 4));

