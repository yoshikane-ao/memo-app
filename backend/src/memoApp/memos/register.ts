// メモの保存
import { Router } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { prisma } from "../../db";

const registerRouter = Router();

registerRouter.post("/", async (req, res) => {
    try {
        const { title, content, tags } = req.body;

        const newMemo = await prisma.memos.create({
            data: {
                title,
                content,
                memo_tags: Array.isArray(tags) && tags.length > 0 ? {
                    create: tags.map((tagName: string) => ({
                        tag: {
                            connectOrCreate: {
                                where: { title: tagName },
                                create: { title: tagName }
                            }
                        }
                    }))
                } : undefined
            },
        });

        res.status(201).json(newMemo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "保存中にエラーが発生しました。" });
    }
});


export default registerRouter;