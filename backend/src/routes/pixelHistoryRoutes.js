import express from "express";
import path from "path";

import { DISABLE_FILESYSTEM, PATH_PICTURE } from "../config/options.js";
import PixelHistory from "../controller/pixelHistory.js";
import { genericRouteHandler } from "../middleware/routeHandler.js";

const router = express.Router();

/**
 * @swagger
 * /history:
 *   get:
 *     summary: Lista as imagens salvas no histórico
 *     description: Lista as imagens salvas no histórico de acordo com a data, ou todas as datas disponíveis se não for informada
 *     tags: [Pixels]
 *     parameters:
 *     - in: query
 *       name: date
 *       required: false
 *       schema:
 *         type: string
 *         description: Data da imagem
 *     responses:
 *       200:
 *         description: Respondeu com a lista de imagens       
 */

export const handleGetHistoryPictures = async (query,session) => {
    if(query.date && !query.date.match(/^\d{4}-\d{2}-\d{2}$/)) 
        return { status: 400, json: {message: "Data inválida"} };

	const resp = await PixelHistory.listHistoryPictures(query.date);
    
	return {
		status: 200,
		json: resp
	};
};

router.get("/history", genericRouteHandler("GET","/history",true,handleGetHistoryPictures));

/**
 * @swagger
 * /history/{date}/{filename}:
 *   get:
 *     summary: Baixar uma imagem salva no histórico
 *     tags: [Pixels]
 *     parameters:
 *     - in: path
 *       name: date
 *       required: true
 *       schema:
 *         type: string
 *         description: Data da imagem
 *     - in: path
 *       name: filename
 *       required: true
 *       schema:
 *         type: string
 *         description: Nome do arquivo
 *     responses:
 *       200:
 *         description: Respondeu com a imagem          
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/history/:date/:filename", async (req,res) => {
    try {
        if(!req.params.date || !req.params.filename)
            return res.status(400).json({message: "Necessário informar a data e o nome do arquivo"});
        if(!req.params.date.match(/^\d{4}-\d{2}-\d{2}$/))
            return res.status(400).json({message: "Data inválida"});
        if(!req.params.filename.match(/^\d{2}\.\d{2}\.\d{2}\..*$/))
            return res.status(400).json({message: "Nome de arquivo inválido"});

        if(DISABLE_FILESYSTEM) {
            return res.status(404).json({message: "Sistema de arquivos desabilitado"});
        }

        const imageFilepath = path.join(path.dirname(PATH_PICTURE),req.params.date,req.params.filename);

        return res.status(200)
            .sendFile(imageFilepath,{
                root: path.resolve()
            });
    } catch(e) {
        console.error(e);
        return res.status(500).json({message: "Erro ao baixar a imagem:"+e});
    }
});

export default router;