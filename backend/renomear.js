// só necessário para migrar da versão antiga para nova
import path from "path";
import { copyFile, mkdir, readdir, unlink } from "fs/promises";
import { PATH_PICTURE } from "./src/config/options.js";

const pixelsPictureDirectory = path.dirname(PATH_PICTURE);

const files = await readdir(pixelsPictureDirectory);

for(const file of files) {
    if(!file.match(/^picture_\d+-\d+-\d+ \d+\.\d+\.\d+\..*$/)) {
        console.log("Ignorando arquivo %s",file);
        continue;
    }
    const [_picture, datetimefile] = file.split("_");
    const [date, timefile] = datetimefile.split(" ");
    const [year, month, day] = date.split("-");
    const [hour, minute, second, extension] = timefile.split(".");

    const newDir = `${year.padStart(4,"0")}-${month.padStart(2,"0")}-${day.padStart(2,"0")}`;
    const newFileName = `${newDir}/${hour.padStart(2,"0")}.${minute.padStart(2,"0")}.${second.padStart(2,"0")}.${extension}`;
    
    const oldPath = path.join(pixelsPictureDirectory, file);
    const newPath = path.join(pixelsPictureDirectory, newFileName);

    await mkdir(path.join(pixelsPictureDirectory, newDir), { recursive: true });
    await copyFile(oldPath, newPath);
    await unlink(oldPath);
}