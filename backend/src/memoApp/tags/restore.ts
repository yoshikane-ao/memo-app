import { Router } from "express";
import { prisma } from "../../db";
import { syncSerialSequence } from "../shared/syncSerialSequence";

type RestoreTagPayload = {
  id: number;
  title: string;
  linkedMemoIds?: number[];
};

const restoreRouter = Router();

restoreRouter.post("/", async (req, res) => {
  const payload = req.body as RestoreTagPayload;

  try {
    const restoredTag = await prisma.$transaction(async (tx) => {
      const existingTagById = await tx.tags.findUnique({
        where: { id: payload.id },
      });

      let tag = existingTagById;

      if (!tag) {
        const existingTagByTitle = await tx.tags.findUnique({
          where: { title: payload.title },
        });

        if (existingTagByTitle) {
          tag = existingTagByTitle;
        } else {
          tag = await tx.tags.create({
            data: {
              id: payload.id,
              title: payload.title,
            },
          });

          await syncSerialSequence(tx, "Tags");
        }
      }

      const linkedMemoIds = [...new Set((payload.linkedMemoIds ?? []).map(Number))];

      if (linkedMemoIds.length > 0) {
        const existingMemos = await tx.memos.findMany({
          where: {
            id: {
              in: linkedMemoIds,
            },
          },
          select: { id: true },
        });

        const existingMemoIds = existingMemos.map((memo) => memo.id);

        if (existingMemoIds.length > 0) {
          const existingLinks = await tx.memo_tags.findMany({
            where: {
              memo_id: {
                in: existingMemoIds,
              },
              tag_id: tag.id,
            },
            select: { memo_id: true },
          });

          const linkedMemoIdSet = new Set(existingLinks.map((link) => link.memo_id));
          const missingMemoIds = existingMemoIds.filter((memoId) => !linkedMemoIdSet.has(memoId));

          if (missingMemoIds.length > 0) {
            await tx.memo_tags.createMany({
              data: missingMemoIds.map((memoId) => ({
                memo_id: memoId,
                tag_id: tag.id,
              })),
            });
          }
        }
      }

      return tag;
    });

    res.status(201).json(restoredTag);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to restore tag." });
  }
});

export default restoreRouter;
