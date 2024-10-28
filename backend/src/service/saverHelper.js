import sharp from "sharp";

export const loadOrCreateNewImage = async (path_picture, width, height) => {
    let imgSharpObj;
    try {
        imgSharpObj = await sharp(path_picture);
        let imgMetadata = await imgSharpObj.metadata();

        if(imgMetadata.width != width || imgMetadata.height != height) {
            throw new Error(`Imagem deveria ser ${width}x${height} porém é ${imgMetadata.width}x${imgMetadata.height} abortando...`);
        }
    } catch (e) {
        console.log(e);
        console.log("Criando nova imagem, pois não havia nenhuma");

        imgSharpObj = await sharp({
            create: {
                width: width,
                height: height,
                channels: 3,
                background: {r: 255, g: 255, b: 255}
            }
        });
    }

    return imgSharpObj;
};