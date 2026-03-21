// ① メモに紐づくタグの同期処理 (PUT /memos/:id/tags)
import { Router } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { prisma } from "../../db";

const relationRouter = Router();

relationRouter.put("/:id/tags", async (req, res) => {
    const memoId = Number(req.params.id);
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
        return res.status(400).json({ message: "tagsは配列で送信してください" });
    }

    try {
        await prisma.$transaction(async (tx) => {
            const tagIds: number[] = [];

            for (const tagName of tags) {
                const tag = await tx.tags.upsert({
                    where: { title: tagName },
                    update: {},
                    create: { title: tagName },
                });
                tagIds.push(tag.id);
            }

            await tx.memo_tags.deleteMany({ where: { memo_id: memoId } });

            if (tagIds.length > 0) {
                await tx.memo_tags.createMany({
                    data: tagIds.map((tagId) => ({ memo_id: memoId, tag_id: tagId })),
                });
            }
        });

        res.status(200).json({ message: "タグの更新が完了しました" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "タグの保存中にエラーが発生しました。" });
    }
});

export default relationRouter;