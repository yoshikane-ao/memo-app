//  メモの更新
import { Router } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { prisma } from "../../db";

const updateRouter = Router();

updateRouter.put("/", async (req, res) => {
    try {
        const { title, content, id } = req.body;

        const updateMemos = await prisma.memos.update({
            where: { id },
            data: { title, content },
        });

        const historyMemo = await prisma.memoHistories.create({
            data: { title, content, memoId: id },
        });

        res.status(200).json(updateMemos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "保存中にエラーが発生しました。" });
    }
});

export default updateRouter;