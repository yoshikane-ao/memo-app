import { Router } from "express";
import { prisma } from "../../db";
import { syncSerialSequence } from "../shared/syncSerialSequence";

type RestoreMemoPayload = {
  id: number;
  orderIndex: number;
  width: number | null;
  height: number | null;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  memo_tags?: Array<{
    tag: {
      id: number;
      title: string;
    };
  }>;
};

const restoreRouter = Router();

restoreRouter.post("/", async (req, res) => {
  const payload = req.body as RestoreMemoPayload;

  try {
    const restoredMemo = await prisma.$transaction(async (tx) => {
      const existingMemo = await tx.memos.findUnique({
        where: { id: payload.id },
        include: {
          memo_tags: {
            include: { tag: true },
          },
        },
      });

      if (existingMemo) {
        return existingMemo;
      }

      const resolvedTagIds: number[] = [];

      for (const memoTag of payload.memo_tags ?? []) {
        const existingTagById = await tx.tags.findUnique({
          where: { id: memoTag.tag.id },
        });

        if (existingTagById) {
          resolvedTagIds.push(existingTagById.id);
          continue;
        }

        const existingTagByTitle = await tx.tags.findUnique({
          where: { title: memoTag.tag.title },
        });

        if (existingTagByTitle) {
          resolvedTagIds.push(existingTagByTitle.id);
          continue;
        }

        const createdTag = await tx.tags.create({
          data: {
            id: memoTag.tag.id,
            title: memoTag.tag.title,
          },
        });

        resolvedTagIds.push(createdTag.id);
      }

      if ((payload.memo_tags?.length ?? 0) > 0) {
        await syncSerialSequence(tx, "Tags");
      }

      const createdMemo = await tx.memos.create({
        data: {
          id: payload.id,
          orderIndex: payload.orderIndex,
          width: payload.width,
          height: payload.height,
          title: payload.title,
          content: payload.content,
          createdAt: new Date(payload.createdAt),
          updatedAt: new Date(payload.updatedAt),
          memo_tags:
            resolvedTagIds.length > 0
              ? {
                  create: resolvedTagIds.map((tagId) => ({
                    tag: {
                      connect: { id: tagId },
                    },
                  })),
                }
              : undefined,
        },
        include: {
          memo_tags: {
            include: { tag: true },
          },
        },
      });

      await syncSerialSequence(tx, "Memos");

      return createdMemo;
    });

    res.status(201).json(restoredMemo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to restore memo." });
  }
});

export default restoreRouter;
