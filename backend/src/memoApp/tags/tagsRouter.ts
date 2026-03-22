import { Router } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { prisma } from "../../db";
import registerRouter from "./register";
import deleteRouter from "./delete";

const tagsRouter = Router();

tagsRouter.use("/register", registerRouter);// タグ登録API
tagsRouter.use("/delete", deleteRouter); // タグ削除API

// 全タグ一覧取得
tagsRouter.get("/list", async (req, res) => {
    try {
        const tags = await prisma.tags.findMany({
            orderBy: { id: 'asc' }
        });
        res.status(200).json({ items: tags });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "エラーが発生しました" });
    }
});

// タグの紐付け
tagsRouter.post("/link", async (req, res) => {
    try {
        const { memoId, tagId } = req.body;
        if (!memoId || !tagId) {
            return res.status(400).json({ message: "memoId と tagId が必要です" });
        }
        await prisma.memo_tags.create({
            data: { memo_id: Number(memoId), tag_id: Number(tagId) }
        });
        res.status(200).json({ message: "タグを紐付けました" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "エラーが発生しました" });
    }
});

// タグの新規作成＆紐付け
tagsRouter.post("/", async (req, res) => {
    try {
        const { memoId, title } = req.body;
        if (!title) return res.status(400).json({ message: "title が必要です" });

        let tag = await prisma.tags.findUnique({ where: { title } });
        if (!tag) {
            tag = await prisma.tags.create({ data: { title } });
        }

        if (memoId) {
            // memo_tags への紐付けを試みる
            const existingLink = await prisma.memo_tags.findFirst({
                where: { memo_id: Number(memoId), tag_id: tag.id }
            });
            if (!existingLink) {
                await prisma.memo_tags.create({
                    data: { memo_id: Number(memoId), tag_id: tag.id }
                });
            }
        }
        res.status(201).json(tag);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "エラーが発生しました" });
    }
});

// メモからタグの紐付けを解除
tagsRouter.delete("/unlink/:memoId/:tagId", async (req, res) => {
    try {
        const { memoId, tagId } = req.params;
        await prisma.memo_tags.deleteMany({
            where: { memo_id: Number(memoId), tag_id: Number(tagId) }
        });
        res.status(200).json({ message: "タグの紐付けを解除しました" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "エラーが発生しました" });
    }
});

// タグをシステムから完全削除（全メモとの紐付けも解除）
tagsRouter.delete("/system-delete/:tagId", async (req, res) => {
    try {
        const tagId = Number(req.params.tagId);
        await prisma.memo_tags.deleteMany({ where: { tag_id: tagId } });
        await prisma.tags.delete({ where: { id: tagId } });
        res.status(200).json({ message: "タグを完全に削除しました" });
    } catch (error) {
        console.error("タグ削除エラー:", error);
        if ((error as any).code === 'P2025') {
            return res.status(404).json({ message: "タグが見つかりません" });
        }
        res.status(500).json({ message: "削除中にエラーが発生しました" });
    }
});

export { tagsRouter };