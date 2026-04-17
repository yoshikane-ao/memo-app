import { prisma } from "../../../db";
import { syncSerialSequence } from "../../../shared/db/syncSerialSequence";
import type { RestoreTagInput, TagRecord, TagRepository } from "../application/tagPorts";

const toTagRecord = (tag: { id: number; title: string }): TagRecord => ({
  id: tag.id,
  title: tag.title,
});

export const createTagRepository = (): TagRepository => ({
  async list() {
    const tags = await prisma.tags.findMany({
      orderBy: { id: "asc" },
    });

    return tags.map(toTagRecord);
  },

  linkToMemo(memoId: number, tagId: number) {
    return prisma.memo_tags
      .createMany({
      data: [{ memo_id: memoId, tag_id: tagId }],
      skipDuplicates: true,
    })
      .then(() => undefined);
  },

  async findByTitle(title: string) {
    const tag = await prisma.tags.findUnique({
      where: { title },
    });

    return tag ? toTagRecord(tag) : null;
  },

  async create(title: string) {
    const tag = await prisma.tags.create({
      data: { title },
    });

    return toTagRecord(tag);
  },

  unlinkFromMemo(memoId: number, tagId: number) {
    return prisma.memo_tags
      .deleteMany({
      where: { memo_id: memoId, tag_id: tagId },
    })
      .then(() => undefined);
  },

  deleteSystem(tagId: number) {
    return prisma.$transaction(async (tx) => {
      await tx.memo_tags.deleteMany({ where: { tag_id: tagId } });
      await tx.tags.delete({ where: { id: tagId } });
    });
  },

  async restore(input: RestoreTagInput) {
    const tag = await prisma.$transaction(async (tx) => {
      const existingTagById = await tx.tags.findUnique({
        where: { id: input.id },
      });

      let tag = existingTagById;

      if (!tag) {
        const existingTagByTitle = await tx.tags.findUnique({
          where: { title: input.title },
        });

        if (existingTagByTitle) {
          tag = existingTagByTitle;
        } else {
          tag = await tx.tags.create({
            data: {
              id: input.id,
              title: input.title,
            },
          });

          await syncSerialSequence(tx, "Tags");
        }
      }

      if (input.linkedMemoIds.length > 0) {
        const existingMemos = await tx.memos.findMany({
          where: {
            id: {
              in: input.linkedMemoIds,
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

      return toTagRecord(tag);
    });

    return tag;
  },
});
