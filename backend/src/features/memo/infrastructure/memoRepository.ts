import type { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../../db';
import { RecordNotFoundError } from '../../../shared/errors';
import type {
  CreateMemoInput,
  MemoDeletionState,
  MemoRecord,
  MemoRepository,
  MemoScope,
  MemoSearchScope,
  MemoSearchType,
  MemoWithTags,
  ReorderMemoItem,
  UpdateMemoLayoutInput,
  UpdateMemoInput,
} from '../application/memoPorts';
import type { TagRecord } from '../application/tagPorts';

const memoWithTagsInclude = {
  memo_tags: {
    include: { tag: true },
  },
} satisfies Prisma.MemosInclude;

type PrismaMemoWithTags = Prisma.MemosGetPayload<{
  include: typeof memoWithTagsInclude;
}>;

type MemoRecordSource = {
  id: number;
  orderIndex: number;
  width: number | null;
  height: number | null;
  title: string;
  content: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const toTagRecord = (tag: { id: number; title: string }): TagRecord => ({
  id: tag.id,
  title: tag.title,
});

const toMemoRecord = (memo: MemoRecordSource): MemoRecord => ({
  id: memo.id,
  orderIndex: memo.orderIndex,
  width: memo.width,
  height: memo.height,
  title: memo.title,
  content: memo.content,
  deletedAt: memo.deletedAt,
  createdAt: memo.createdAt,
  updatedAt: memo.updatedAt,
});

const toMemoWithTags = (memo: PrismaMemoWithTags): MemoWithTags => ({
  ...toMemoRecord(memo),
  memo_tags: memo.memo_tags.map((memoTag) => ({
    memo_id: memoTag.memo_id,
    tag_id: memoTag.tag_id,
    tag: toTagRecord(memoTag.tag),
  })),
});

const buildMemoListWhere = (userId: number, scope: MemoScope): Prisma.MemosWhereInput => {
  const base: Prisma.MemosWhereInput = { userId };
  switch (scope) {
    case 'trash':
      return { ...base, deletedAt: { not: null } };
    case 'all':
      return base;
    default:
      return { ...base, deletedAt: null };
  }
};

const getMemoListOrderBy = (scope: MemoScope): Prisma.MemosOrderByWithRelationInput[] => {
  if (scope === 'trash') {
    return [{ deletedAt: 'desc' }, { id: 'desc' }];
  }

  return [{ orderIndex: 'asc' }, { id: 'desc' }];
};

const buildSearchWhere = (query: string, type: MemoSearchType): Prisma.MemosWhereInput => {
  const searchCondition = { contains: query };

  switch (type) {
    case 'title':
      return { title: searchCondition };
    case 'content':
      return { content: searchCondition };
    case 'tag':
      return {
        memo_tags: {
          some: {
            tag: {
              title: searchCondition,
            },
          },
        },
      };
    default:
      return {
        OR: [
          { title: searchCondition },
          { content: searchCondition },
          { memo_tags: { some: { tag: { title: searchCondition } } } },
        ],
      };
  }
};

const buildSearchScopeWhere = (scope: MemoSearchScope): Prisma.MemosWhereInput => {
  switch (scope) {
    case 'trash':
      return { deletedAt: { not: null } };
    case 'all':
      return {};
    default:
      return { deletedAt: null };
  }
};

export const createMemoRepository = (): MemoRepository => ({
  async list(userId: number, scope: MemoScope) {
    const memos = await prisma.memos.findMany({
      where: buildMemoListWhere(userId, scope),
      orderBy: getMemoListOrderBy(scope),
      include: memoWithTagsInclude,
    });

    return memos.map(toMemoWithTags);
  },

  async search(userId: number, query: string, type: MemoSearchType, scope: MemoSearchScope) {
    const memos = await prisma.memos.findMany({
      where: {
        AND: [{ userId }, buildSearchScopeWhere(scope), buildSearchWhere(query, type)],
      },
      orderBy: { id: 'asc' },
      include: memoWithTagsInclude,
    });

    return memos.map(toMemoWithTags);
  },

  async create(input: CreateMemoInput) {
    const memo = await prisma.memos.create({
      data: {
        userId: input.userId,
        title: input.title,
        content: input.content,
        memo_tags:
          input.tags && input.tags.length > 0
            ? {
                create: input.tags.map((tagName) => ({
                  tag: {
                    connectOrCreate: {
                      where: { userId_title: { userId: input.userId, title: tagName } },
                      create: { userId: input.userId, title: tagName },
                    },
                  },
                })),
              }
            : undefined,
      },
      include: memoWithTagsInclude,
    });

    return toMemoWithTags(memo);
  },

  async updateWithHistory(input: UpdateMemoInput) {
    const updateData: Prisma.MemosUpdateInput = {
      title: input.title,
      content: input.content,
    };

    if (input.width !== undefined) {
      updateData.width = input.width;
    }

    if (input.height !== undefined) {
      updateData.height = input.height;
    }

    return prisma.$transaction(async (tx) => {
      const result = await tx.memos.updateMany({
        where: { id: input.id, userId: input.userId },
        data: updateData,
      });

      if (result.count === 0) {
        throw new RecordNotFoundError();
      }

      await tx.memoHistories.create({
        data: { title: input.title, content: input.content, memoId: input.id },
      });

      const memo = await tx.memos.findFirstOrThrow({
        where: { id: input.id, userId: input.userId },
      });
      return toMemoRecord(memo);
    });
  },

  async moveToTrash(userId: number, id: number) {
    const result = await prisma.memos.updateMany({
      where: { id, userId },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      throw new RecordNotFoundError();
    }

    const memo = await prisma.memos.findFirstOrThrow({
      where: { id, userId },
      include: memoWithTagsInclude,
    });
    return toMemoWithTags(memo);
  },

  async restore(userId: number, id: number) {
    const result = await prisma.memos.updateMany({
      where: { id, userId },
      data: { deletedAt: null },
    });

    if (result.count === 0) {
      throw new RecordNotFoundError();
    }

    const memo = await prisma.memos.findFirstOrThrow({
      where: { id, userId },
      include: memoWithTagsInclude,
    });
    return toMemoWithTags(memo);
  },

  deleteManyTrashed(userId: number) {
    return prisma.memos
      .deleteMany({
        where: {
          userId,
          deletedAt: { not: null },
        },
      })
      .then((result) => result.count);
  },

  async findById(userId: number, id: number) {
    const memo = await prisma.memos.findFirst({
      where: { id, userId },
      select: { id: true, deletedAt: true },
    });

    const deletionState: MemoDeletionState | null = memo
      ? {
          id: memo.id,
          deletedAt: memo.deletedAt,
        }
      : null;

    return deletionState;
  },

  async purge(userId: number, id: number) {
    const memo = await prisma.memos.findFirst({
      where: { id, userId },
      include: memoWithTagsInclude,
    });
    if (!memo) {
      throw new RecordNotFoundError();
    }
    await prisma.memos.delete({ where: { id } });
    return toMemoWithTags(memo);
  },

  reorder(userId: number, items: ReorderMemoItem[]) {
    return prisma
      .$transaction(
        items.map((item) =>
          prisma.memos.updateMany({
            where: { id: item.id, userId },
            data: { orderIndex: item.orderIndex },
          }),
        ),
      )
      .then(() => undefined);
  },

  async updateLayout(input: UpdateMemoLayoutInput) {
    const result = await prisma.memos.updateMany({
      where: { id: input.memoId, userId: input.userId },
      data: {
        width: input.width ?? null,
        height: input.height ?? null,
      },
    });

    if (result.count === 0) {
      throw new RecordNotFoundError();
    }

    const memo = await prisma.memos.findFirstOrThrow({
      where: { id: input.memoId, userId: input.userId },
    });
    return toMemoRecord(memo);
  },
});
