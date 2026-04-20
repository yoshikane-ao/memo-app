import { prisma } from '../../../db';
import { syncSerialSequence } from '../../../shared/db/syncSerialSequence';
import { RecordNotFoundError } from '../../../shared/errors';
import type { RestoreTagInput, TagRecord, TagRepository } from '../application/tagPorts';

const toTagRecord = (tag: { id: number; title: string }): TagRecord => ({
  id: tag.id,
  title: tag.title,
});

// memo 所有者と tag 所有者が一致するかを tx 内で検証する。
const assertMemoOwnership = async (
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: number,
  memoId: number,
) => {
  const memo = await tx.memos.findFirst({
    where: { id: memoId, userId },
    select: { id: true },
  });
  if (!memo) {
    throw new RecordNotFoundError();
  }
};

const assertTagOwnership = async (
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: number,
  tagId: number,
) => {
  const tag = await tx.tags.findFirst({
    where: { id: tagId, userId },
    select: { id: true },
  });
  if (!tag) {
    throw new RecordNotFoundError();
  }
};

export const createTagRepository = (): TagRepository => ({
  async list(userId: number) {
    const tags = await prisma.tags.findMany({
      where: { userId },
      orderBy: { id: 'asc' },
    });

    return tags.map(toTagRecord);
  },

  linkToMemo(userId: number, memoId: number, tagId: number) {
    return prisma
      .$transaction(async (tx) => {
        await assertMemoOwnership(tx, userId, memoId);
        await assertTagOwnership(tx, userId, tagId);
        await tx.memo_tags.createMany({
          data: [{ memo_id: memoId, tag_id: tagId }],
          skipDuplicates: true,
        });
      })
      .then(() => undefined);
  },

  async findByTitle(userId: number, title: string) {
    const tag = await prisma.tags.findUnique({
      where: { userId_title: { userId, title } },
    });

    return tag ? toTagRecord(tag) : null;
  },

  async create(userId: number, title: string) {
    const tag = await prisma.tags.create({
      data: { userId, title },
    });

    return toTagRecord(tag);
  },

  unlinkFromMemo(userId: number, memoId: number, tagId: number) {
    return prisma
      .$transaction(async (tx) => {
        await assertMemoOwnership(tx, userId, memoId);
        await assertTagOwnership(tx, userId, tagId);
        await tx.memo_tags.deleteMany({
          where: { memo_id: memoId, tag_id: tagId },
        });
      })
      .then(() => undefined);
  },

  deleteSystem(userId: number, tagId: number) {
    return prisma.$transaction(async (tx) => {
      await assertTagOwnership(tx, userId, tagId);
      await tx.memo_tags.deleteMany({ where: { tag_id: tagId } });
      await tx.tags.delete({ where: { id: tagId } });
    });
  },

  async restore(input: RestoreTagInput) {
    const tag = await prisma.$transaction(async (tx) => {
      const existingTagById = await tx.tags.findFirst({
        where: { id: input.id, userId: input.userId },
      });

      let tag = existingTagById;

      if (!tag) {
        const existingTagByTitle = await tx.tags.findUnique({
          where: { userId_title: { userId: input.userId, title: input.title } },
        });

        if (existingTagByTitle) {
          tag = existingTagByTitle;
        } else {
          tag = await tx.tags.create({
            data: {
              id: input.id,
              userId: input.userId,
              title: input.title,
            },
          });

          await syncSerialSequence(tx, 'Tags');
        }
      }

      if (input.linkedMemoIds.length > 0) {
        const existingMemos = await tx.memos.findMany({
          where: {
            id: { in: input.linkedMemoIds },
            userId: input.userId,
          },
          select: { id: true },
        });

        const existingMemoIds = existingMemos.map((memo) => memo.id);

        if (existingMemoIds.length > 0) {
          const existingLinks = await tx.memo_tags.findMany({
            where: {
              memo_id: { in: existingMemoIds },
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
