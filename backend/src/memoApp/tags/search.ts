// ② すべてのタグの取得 (GET /tags)
import { Router } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { prisma } from "../../db";

const searchRouter = Router();

searchRouter.get("/tags", async (req, res) => {
    try {
        const q = (req.query.q as string)?.trim();
        const tags = await prisma.tags.findMany({
            where: q ? { title: { contains: q, mode: 'insensitive' } } : {},
            orderBy: { id: 'asc' }
        });
        res.status(200).json({ items: tags });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "エラーが発生しました。" });
    }
});