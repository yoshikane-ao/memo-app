import { Router } from "express";
import { prisma } from "../../db";

const sortRouter = Router();

sortRouter.put("/", async (req, res) => {
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
        return res.status(400).json({ message: "不正なリクエストです。" });
    }

    try {
        // トランザクションで一括更新
        await prisma.$transaction(
            items.map((item: { id: number; orderIndex: number }) =>
                prisma.memos.update({
                    where: { id: item.id },
                    data: { orderIndex: item.orderIndex }
                })
            )
        );

        res.status(200).json({ message: "並び順を更新しました。" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "並び順の更新中にエラーが発生しました。" });
    }
});

export default sortRouter;
