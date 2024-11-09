import path from "path";
import { copyFile, mkdir, readdir } from "fs/promises";
import { DISABLE_FILESYSTEM, PATH_PICTURE } from "../config/options.js";

const pixelsPictureDirectory = path.dirname(PATH_PICTURE);
const pixelsPictureFilename = path.basename(PATH_PICTURE);
const pixelxPictureExtension = path.extname(pixelsPictureFilename);

const getYYYY_MM_DD = (date, sep) => {
    const year = ""+date.getUTCFullYear();
    const month = ""+(date.getUTCMonth()+1); // beware: January = 0; February = 1, etc.
    const day = ""+date.getUTCDate();
    return year.padStart(4,"0")+sep+month.padStart(2,"0")+sep+day.padStart(2,"0");
};

const getHH_MM_SS = (date, sep) => {
    const hour = ""+date.getUTCHours();
    const minute = ""+date.getUTCMinutes();
    const second = ""+date.getUTCSeconds();
    return hour.padStart(2,"0")+sep+minute.padStart(2,"0")+sep+second.padStart(2,"0");
};

class PixelHistory {
    // Chamado pelo PixelSaver
    static async saveHistoryPicture() {
        if(DISABLE_FILESYSTEM) {
            return null;
        }

        // https://stackoverflow.com/questions/4402934/javascript-time-and-date-getting-the-current-minute-hour-day-week-month-y
        const now = new Date();

        const todayDir = path.join(pixelsPictureDirectory, getYYYY_MM_DD(now, "-"));
        const historyPath = path.join(todayDir, getHH_MM_SS(now,".")+pixelxPictureExtension);

        await mkdir(todayDir, { recursive: true });
        await copyFile(PATH_PICTURE,historyPath);

        return historyPath;
    }

    static async listHistoryPictureByDay(filterDay) {
        if(DISABLE_FILESYSTEM) {
            return [];
        }

        const todayDir = path.join(pixelsPictureDirectory, filterDay);
        const files = await readdir(todayDir);
        
        return files
            .filter(file => file.match(/^\d{2}\.\d{2}\.\d{2}\..*$/))
            .sort()
            .map(file => `${filterDay}/${file}`);
    }

    static async listHistoryPictures(filterDay) {
        if(DISABLE_FILESYSTEM) {
            return [];
        }
        
        if(!filterDay) {
            const files = await readdir(pixelsPictureDirectory);

            const days = files
                .filter(file => file.match(/^\d{4}-\d{2}-\d{2}$/))
                .sort();
            
            const history = [];
            for(const day of days) {
                const pictures = await PixelHistory.listHistoryPictureByDay(day);
                history.push(...pictures);
            }

            return history;
        } else {
            return await PixelHistory.listHistoryPictureByDay(filterDay);
        }
    }
}

export default PixelHistory;