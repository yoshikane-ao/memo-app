// メモの削除
import { Router } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { prisma } from "../../db";

const deleteRouter = Router();

deleteRouter.delete("/:id", async (req, res) => {
    try {

        const id = Number(req.params.id);

        const deletedMemo = await prisma.memos.delete({
            where: { id: Number(id) },
        });

        res.status(200).json(deletedMemo);
    } catch (error) {
        console.error(error);

        res.status(500).json({ message: "削除中にエラーが発生しました。" });
    }
});


export default deleteRouter;