// ③ 新規タグの作成 (POST /tags)
import { Router } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { prisma } from "../../db";

const router = Router();

router.post("/tags", async (req, res) => {
  try {
    const { title } = req.body;
    const newTag = await prisma.tags.create({
      data: { title },
    });
    res.status(201).json({ items: newTag });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "エラーが発生しました。" });
  }
});

export default router;