type TagRecord = {
  id: number;
  title: string;
};

type MemoRecord = {
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

type MemoTagRecord = {
  memo_id: number;
  tag_id: number;
};

const Module = require("node:module") as {
  _load: (request: string, parent: NodeModule | undefined, isMain: boolean) => unknown;
  _resolveFilename: (
    request: string,
    parent?: NodeModule,
    isMain?: boolean,
    options?: unknown
  ) => string;
};

const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = Number(process.env.PORT ?? "4310");
const dbModulePath = require.resolve("../db");

const tags: TagRecord[] = [];
const memos: MemoRecord[] = [
  {
    id: 1,
    orderIndex: 0,
    width: 180,
    height: 48,
    title: "Seed memo",
    content: "Existing memo from the browser smoke test.",
    deletedAt: null,
    createdAt: new Date("2026-03-20T10:00:00.000Z"),
    updatedAt: new Date("2026-03-20T10:00:00.000Z"),
  },
];
const memoTags: MemoTagRecord[] = [];

let nextMemoId = 2;
let nextTagId = 1;

const compareValue = (left: number | string | Date | null, right: number | string | Date | null) => {
  if (left === right) {
    return 0;
  }

  if (left == null) {
    return -1;
  }

  if (right == null) {
    return 1;
  }

  const leftValue = left instanceof Date ? left.valueOf() : left;
  const rightValue = right instanceof Date ? right.valueOf() : right;

  if (leftValue < rightValue) {
    return -1;
  }

  return 1;
};

const cloneMemo = (memo: MemoRecord) => ({
  ...memo,
  memo_tags: memoTags
    .filter((relation) => relation.memo_id === memo.id)
    .map((relation) => ({
      memo_id: relation.memo_id,
      tag_id: relation.tag_id,
      tag: { ...tags.find((tag) => tag.id === relation.tag_id)! },
    })),
});

const findTagByWhere = (where: { id?: number; title?: string }) => {
  if (where.id != null) {
    return tags.find((tag) => tag.id === where.id) ?? null;
  }

  if (where.title != null) {
    return tags.find((tag) => tag.title === where.title) ?? null;
  }

  return null;
};

const ensureTag = (title: string) => {
  const existing = tags.find((tag) => tag.title === title);
  if (existing) {
    return existing;
  }

  const created = {
    id: nextTagId++,
    title,
  };
  tags.push(created);
  return created;
};

type MemoWhereInput = {
  AND?: unknown[];
  OR?: unknown[];
  title?: { contains?: string };
  content?: { contains?: string };
  deletedAt?: Date | null | { not?: null };
  memo_tags?: { some?: { tag?: { title?: { contains?: string } } } };
};

const hasDeletedAtNotFilter = (
  deletedAt: MemoWhereInput["deletedAt"]
): deletedAt is { not?: null } =>
  deletedAt != null && typeof deletedAt === "object" && "not" in deletedAt;

const applyMemoWhere = (items: MemoRecord[], where: unknown): MemoRecord[] => {
  if (!where || typeof where !== "object") {
    return items;
  }

  const record = where as MemoWhereInput;

  if (Array.isArray(record.AND)) {
    return record.AND.reduce<MemoRecord[]>(
      (currentItems, condition) => applyMemoWhere(currentItems, condition),
      items
    );
  }

  if (Array.isArray(record.OR)) {
    return items.filter((memo) =>
      record.OR!.some((condition) => applyMemoWhere([memo], condition).length > 0)
    );
  }

  if (record.deletedAt === null) {
    return items.filter((memo) => memo.deletedAt === null);
  }

  const deletedAtFilter = record.deletedAt;
  if (hasDeletedAtNotFilter(deletedAtFilter)) {
    return items.filter((memo) => memo.deletedAt !== deletedAtFilter.not);
  }

  if (record.title?.contains != null) {
    return items.filter((memo) => memo.title.includes(record.title!.contains!));
  }

  if (record.content?.contains != null) {
    return items.filter((memo) => memo.content.includes(record.content!.contains!));
  }

  const tagContains = record.memo_tags?.some?.tag?.title?.contains;
  if (tagContains != null) {
    return items.filter((memo) =>
      memoTags.some((relation) => {
        if (relation.memo_id !== memo.id) {
          return false;
        }

        return tags.some((tag) => tag.id === relation.tag_id && tag.title.includes(tagContains));
      })
    );
  }

  return items;
};

const sortMemos = (items: MemoRecord[], orderBy: unknown) => {
  const orderRules = Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : [];

  return [...items].sort((left, right) => {
    for (const rule of orderRules) {
      if (!rule || typeof rule !== "object") {
        continue;
      }

      const [field, direction] = Object.entries(rule)[0] ?? [];
      if (!field || (direction !== "asc" && direction !== "desc")) {
        continue;
      }

      const comparison = compareValue(
        left[field as keyof MemoRecord] as number | string | Date | null,
        right[field as keyof MemoRecord] as number | string | Date | null
      );

      if (comparison !== 0) {
        return direction === "asc" ? comparison : comparison * -1;
      }
    }

    return 0;
  });
};

const fakePrisma = {
  memos: {
    findMany: async (args?: { where?: unknown; orderBy?: unknown }) => {
      const filtered = applyMemoWhere(memos, args?.where);
      return sortMemos(filtered, args?.orderBy).map(cloneMemo);
    },
    findUnique: async (args: { where: { id: number } }) => {
      const memo = memos.find((entry) => entry.id === args.where.id);
      return memo ? cloneMemo(memo) : null;
    },
    create: async (args: {
      data: {
        title: string;
        content: string;
        id?: number;
        orderIndex?: number;
        width?: number | null;
        height?: number | null;
        deletedAt?: Date | null;
        createdAt?: Date;
        updatedAt?: Date;
        memo_tags?: {
          create?: Array<{
            tag: {
              connect?: { id: number };
              connectOrCreate?: { where: { title: string }; create: { title: string } };
            };
          }>;
        };
      };
    }) => {
      const createdMemo: MemoRecord = {
        id: args.data.id ?? nextMemoId++,
        orderIndex:
          args.data.orderIndex ?? (memos.length === 0 ? 0 : Math.max(...memos.map((memo) => memo.orderIndex)) + 1),
        width: args.data.width ?? null,
        height: args.data.height ?? null,
        title: args.data.title,
        content: args.data.content,
        deletedAt: args.data.deletedAt ?? null,
        createdAt: args.data.createdAt ?? new Date(),
        updatedAt: args.data.updatedAt ?? new Date(),
      };

      memos.push(createdMemo);

      for (const relation of args.data.memo_tags?.create ?? []) {
        const connectedTagId =
          relation.tag.connect?.id ??
          ensureTag(
            relation.tag.connectOrCreate?.where.title ?? relation.tag.connectOrCreate?.create.title ?? ""
          ).id;

        memoTags.push({
          memo_id: createdMemo.id,
          tag_id: connectedTagId,
        });
      }

      return cloneMemo(createdMemo);
    },
    update: async (args: {
      where: { id: number };
      data: Partial<
        Pick<MemoRecord, "title" | "content" | "width" | "height" | "orderIndex" | "deletedAt">
      >;
    }) => {
      const memo = memos.find((entry) => entry.id === args.where.id);

      if (!memo) {
        throw { code: "P2025" };
      }

      Object.assign(memo, args.data, {
        updatedAt: new Date(),
      });

      return cloneMemo(memo);
    },
    delete: async (args: { where: { id: number } }) => {
      const index = memos.findIndex((entry) => entry.id === args.where.id);

      if (index === -1) {
        throw { code: "P2025" };
      }

      const deletedMemo = memos.splice(index, 1)[0]!;

      for (let i = memoTags.length - 1; i >= 0; i -= 1) {
        if (memoTags[i]!.memo_id === deletedMemo.id) {
          memoTags.splice(i, 1);
        }
      }

      return cloneMemo(deletedMemo);
    },
  },
  tags: {
    findMany: async () => [...tags].sort((left, right) => left.id - right.id).map((tag) => ({ ...tag })),
    findUnique: async (args: { where: { id?: number; title?: string } }) => {
      const tag = findTagByWhere(args.where);
      return tag ? { ...tag } : null;
    },
    create: async (args: { data: { id?: number; title: string } }) => {
      const created = {
        id: args.data.id ?? nextTagId++,
        title: args.data.title,
      };
      tags.push(created);
      return { ...created };
    },
    delete: async (args: { where: { id: number } }) => {
      const index = tags.findIndex((tag) => tag.id === args.where.id);

      if (index === -1) {
        throw { code: "P2025" };
      }

      const deletedTag = tags.splice(index, 1)[0]!;
      return { ...deletedTag };
    },
  },
  memo_tags: {
    createMany: async (args: { data: Array<MemoTagRecord>; skipDuplicates?: boolean }) => {
      let count = 0;

      for (const relation of args.data) {
        const exists = memoTags.some(
          (current) => current.memo_id === relation.memo_id && current.tag_id === relation.tag_id
        );

        if (exists && args.skipDuplicates) {
          continue;
        }

        memoTags.push({ ...relation });
        count += 1;
      }

      return { count };
    },
    deleteMany: async (args: { where: Partial<MemoTagRecord> }) => {
      let count = 0;

      for (let index = memoTags.length - 1; index >= 0; index -= 1) {
        const relation = memoTags[index]!;
        const matchesMemoId = args.where.memo_id == null || args.where.memo_id === relation.memo_id;
        const matchesTagId = args.where.tag_id == null || args.where.tag_id === relation.tag_id;

        if (matchesMemoId && matchesTagId) {
          memoTags.splice(index, 1);
          count += 1;
        }
      }

      return { count };
    },
    findMany: async (args: { where?: { memo_id?: { in?: number[] }; tag_id?: number }; select?: { memo_id?: boolean } }) => {
      const filtered = memoTags.filter((relation) => {
        const memoIdMatches =
          args.where?.memo_id?.in == null || args.where.memo_id.in.includes(relation.memo_id);
        const tagIdMatches = args.where?.tag_id == null || args.where.tag_id === relation.tag_id;
        return memoIdMatches && tagIdMatches;
      });

      if (args.select?.memo_id) {
        return filtered.map((relation) => ({ memo_id: relation.memo_id }));
      }

      return filtered.map((relation) => ({ ...relation }));
    },
  },
  memoHistories: {
    create: async () => ({ id: 1 }),
  },
  $transaction: async (input: unknown) => {
    if (typeof input === "function") {
      return input(fakePrisma);
    }

    if (Array.isArray(input)) {
      return Promise.all(input);
    }

    return input;
  },
};

const originalLoad = Module._load;

Module._load = function patchedLoad(request, parent, isMain) {
  const resolved = Module._resolveFilename(request, parent, isMain);
  if (resolved === dbModulePath) {
    return { prisma: fakePrisma };
  }

  return originalLoad.call(this, request, parent, isMain);
};

const { buildApp } = require("../app") as {
  buildApp: () => {
    listen: (
      port: number,
      host: string,
      callback: () => void
    ) => { close: (callback: () => void) => void };
    get: (path: string, handler: unknown) => void;
  };
};

Module._load = originalLoad;

const app = buildApp();
const server = app.listen(PORT, HOST, () => {
  console.log(`E2E API server listening on http://${HOST}:${PORT}`);
});

const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
