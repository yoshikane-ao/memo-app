import { Router } from "express";
import { prisma } from "../../db";

const searchRouter = Router();

searchRouter.get("/", async (req, res) => {
  try {
    const q = (req.query.q as string)?.trim();
    const type = (req.query.type as string) || 'all';

    // 検索キーワードがない場合は、ここでは何もせず次に回すか、エラーを返す
    if (!q) {
      return res.status(400).json({ message: "検索キーワードが必要です。" });
    }

    const searchCondition = { contains: q };
    let whereClause: any = {};

    // --- 検索ロジック (元のコードを維持) ---
    if (type === 'title') {
      whereClause = { title: searchCondition };
    } else if (type === 'content') {
      whereClause = { content: searchCondition };
    } else if (type === 'tag') {
      whereClause = { memo_tags: { some: { tag: { title: searchCondition } } } };
    } else {
      whereClause = {
        OR: [
          { title: searchCondition },
          { content: searchCondition },
          { memo_tags: { some: { tag: { title: searchCondition } } } }
        ]
      };
    }

    const memos = await prisma.memos.findMany({
      where: whereClause,
      orderBy: { id: 'asc' },
      include: { memo_tags: { include: { tag: true } } }
    });

    res.status(200).json({ items: memos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "検索中にエラーが発生しました。" });
  }
});

export default searchRouter;