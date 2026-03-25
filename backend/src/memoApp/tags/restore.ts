import { Router } from "express";
import { prisma } from "../../db";
import {
  arrayField,
  handleRouteError,
  parseBody,
  positiveIntField,
  stringField,
} from "../shared/requestValidation";
import { syncSerialSequence } from "../shared/syncSerialSequence";

const parseRestoreTagBody = (value: unknown) =>
  parseBody(value, {
    id: positiveIntField(),
    title: stringField(),
    linkedMemoIds: arrayField(positiveIntField(), {
      optional: true,
      defaultValue: [],
      dedupeBy: (memoId) => memoId,
    }),
  });

const restoreRouter = Router();

restoreRouter.post("/", async (req, res) => {
  try {
    const body = parseRestoreTagBody(req.body);
    const linkedMemoIds = body.linkedMemoIds ?? [];

    const restoredTag = await prisma.$transaction(async (tx) => {
      const existingTagById = await tx.tags.findUnique({
        where: { id: body.id },
      });

      let tag = existingTagById;

      if (!tag) {
        const existingTagByTitle = await tx.tags.findUnique({
          where: { title: body.title },
        });

        if (existingTagByTitle) {
          tag = existingTagByTitle;
        } else {
          tag = await tx.tags.create({
            data: {
              id: body.id,
              title: body.title,
            },
          });

          await syncSerialSequence(tx, "Tags");
        }
      }

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
    return handleRouteError(res, error, "Failed to restore tag.");
  }
});

export default restoreRouter;
