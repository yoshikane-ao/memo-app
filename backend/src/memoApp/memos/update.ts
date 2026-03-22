//  メモの更新
import { Router } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { prisma } from "../../db";

const updateRouter = Router();

updateRouter.put("/", async (req, res) => {
    try {
        const { title, content, id, width, height } = req.body;

        const updateData: any = { title, content };
        if (width !== undefined) updateData.width = width;
        if (height !== undefined) updateData.height = height;

        const updateMemos = await prisma.memos.update({
            where: { id },
            data: updateData,
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