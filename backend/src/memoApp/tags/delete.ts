import { Router } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { prisma } from "../../db";

const router = Router();

router.delete("/tags/:title", async (req, res) => {

    try {
        // URLからタグの名前を取得（日本語などの文字化けを防ぐためにデコード）
        const title = decodeURIComponent(req.params.title);

        // Prismaで該当するタグを削除
        await prisma.memo_tags.deleteMany({
            where: {
                tag: {
                    title: title
                }
            },
        })

        await prisma.tags.delete({
            where: { title: title },
        });

        res.status(200).json({ message: "タグを削除しました。" });
    } catch (error) {
        console.error("タグ削除エラー:", error);

        // ★修正: (error as any).code に変更する
        if ((error as any).code === 'P2025') {
            return res.status(404).json({ message: "削除しようとしたタグが見つかりません。" });
        }

        res.status(500).json({ message: "削除中にエラーが発生しました。" });
    }
});

export default router;