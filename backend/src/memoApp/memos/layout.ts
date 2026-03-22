import { Router } from "express";
import { prisma } from "../../db";

const layoutRouter = Router();

layoutRouter.put("/", async (req, res) => {
    const { memoId, width, height } = req.body;
    if (!memoId) {
        return res.status(400).json({ message: "memoIdが必要です" });
    }
    
    try {
        await prisma.memos.update({
            where: { id: Number(memoId) },
            data: { 
                width: width ? Number(width) : null, 
                height: height ? Number(height) : null 
            }
        });
        res.status(200).json({ message: "レイアウトを保存しました" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "レイアウトの保存に失敗しました" });
    }
});

export default layoutRouter;