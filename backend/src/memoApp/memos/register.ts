// メモの保存
import { Router } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { prisma } from "../../db";

const registerRouter = Router();

registerRouter.post("/", async (req, res) => {
    try {
        const { title, content } = req.body;

        const newMemo = await prisma.memos.create({
            data: {
                title,
                content,
            },
        });

        res.status(201).json(newMemo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "保存中にエラーが発生しました。" });
    }
});


export default registerRouter;