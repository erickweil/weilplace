import express from "express";
const router = express.Router();

router.get("/teste", (req,res) => {
	res.status(200).json({ message: "Apenas Testando" });
});

export default router;