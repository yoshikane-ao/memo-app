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

// メモの取得
router.get("/", async (req, res) => {
  try {
    const q = (req.query.q as string)?.trim();
    const type = (req.query.type as string) || 'all'; // 'all', 'title', 'content', 'tag'

    // 検索条件を動的に組み立てるオブジェクト
    let whereClause: any = {};

    if (q) {
      const searchCondition = { contains: q, mode: 'insensitive' as const };

      if (type === 'title') {
        whereClause = { title: searchCondition };
      } else if (type === 'content') {
        whereClause = { content: searchCondition };
      } else if (type === 'tag') {
        // ★重要: 中間テーブルを経由してタグ名を検索する
        whereClause = {
          memo_tags: {
            some: {
              tag: { title: searchCondition }
            }
          }
        };
      } else {
        // 'all' の場合：タイトル OR 本文 OR タグ
        whereClause = {
          OR: [
            { title: searchCondition },
            { content: searchCondition },
            {
              memo_tags: {
                some: {
                  tag: { title: searchCondition }
                }
              }
            }
          ]
        };
      }
    }

    const memos = await prisma.memos.findMany({
      where: whereClause,
      orderBy: { id: 'asc' },
      include: {
        memo_tags: {
          include: { tag: true }
        }
      }
    });

    res.status(200).json({ items: memos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "検索中にエラーが発生しました。" });
  }
});

// メモの保存
router.post("/", async (req, res) => {
  try {
    const { title, content } = req.body;

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

//  メモの更新
router.put("/", async (req, res) => {
  try {
    const { title, content, id } = req.body;

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

// メモの削除
router.delete("/:id", async (req, res) => {
  try {

    const id = Number(req.params.id);

    const deletedMemo = await prisma.memos.delete({
      where: { id: id },
    });

    res.status(200).json(deletedMemo);
  } catch (error) {
    console.error(error);

    res.status(500).json({ message: "削除中にエラーが発生しました。" });
  }
});

// ① メモに紐づくタグの同期処理 (PUT /memos/:id/tags)
router.put("/:id/tags", async (req, res) => {
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

// ② すべてのタグの取得 (GET /tags)
router.get("/tags", async (req, res) => {
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

// ③ 新規タグの作成 (POST /tags)
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