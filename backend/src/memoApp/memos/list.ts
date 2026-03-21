import { Router } from "express";
import { prisma } from "../../db";

const listRouter = Router();

// 一覧表示（全件取得）のロジック
listRouter.get("/", async (req, res) => {
    try {
        const memos = await prisma.memos.findMany({
            orderBy: [
                { orderIndex: 'asc' },
                { id: 'desc' }
            ],
            include: {
                memo_tags: {
                    include: { tag: true }
                }
            }
        });

        res.status(200).json({ items: memos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "一覧の取得中にエラーが発生しました。" });
    }
});

export default listRouter;