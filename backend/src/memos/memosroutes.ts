import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client";
import { prisma } from "../db";
// const prisma = new PrismaClient();
// import { findByMemo } from "./memorepo"

const router = Router();

// memosRouter.get("/:id", async(req, res) => {
//   const id = Number(req.params);
//   const memos = await findByMemo(id);
//   res.status(200).json({ memos });
// })

router.get("/", async (req, res) => {
  try {
    const q = (req.query.q as string | string)?.trim();
    const memos = await prisma.memos.findMany({
      where: q
        ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
          ],
        }
        : {},
      orderBy: {
        id: 'asc',
      }
    });

    res.status(200).json({
      items: memos,
      page: 1,
      limit: 20,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "エラーが発生しました。" });
  }
})

router.post("/", async (req, res) => {
  try {
    const { title, content } = req.body; // フロントから送られたデータ

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

router.put("/", async (req, res) => {
  try {
    const { title, content, id } = req.body; // フロントから送られたデータ

    const updateMemos = await prisma.memos.update({
      where: { id },
      data: { title, content },
    });

    const historyMemo = await prisma.memoHistories.create({
      data: { title, content, memoId: id },
    });

    res.status(200).json(updateMemos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "保存中にエラーが発生しました。" });
  }
});

export default router;