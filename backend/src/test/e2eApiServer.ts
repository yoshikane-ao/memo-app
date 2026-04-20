// Playwright から起動される E2E 用の API サーバー。
// 実 DB を立てずに in-memory の fakePrisma を `../db` に差し込み、
// 本物の app.ts / authRouter / memoRouter を動かす。
// 認証導入後は demo ユーザーで seed するため、先に process.env を仕込む。

import { RecordNotFoundError } from '../shared/errors';

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'demo12345';

process.env.DEMO_EMAIL ??= DEMO_EMAIL;
process.env.DEMO_PASSWORD ??= DEMO_PASSWORD;
process.env.DEMO_DISPLAY_NAME ??= 'デモユーザー';
process.env.COOKIE_SECURE ??= 'false';
process.env.LOG_LEVEL ??= 'warn';

type UserRecord = {
  id: number;
  email: string;
  passwordHash: string;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type TagRecord = {
  id: number;
  userId: number;
  title: string;
};

type MemoRecord = {
  id: number;
  userId: number;
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

const Module = require('node:module') as {
  _load: (request: string, parent: NodeModule | undefined, isMain: boolean) => unknown;
  _resolveFilename: (
    request: string,
    parent?: NodeModule,
    isMain?: boolean,
    options?: unknown,
  ) => string;
};

const HOST = process.env.HOST ?? '127.0.0.1';
const PORT = Number(process.env.PORT ?? '4310');
const dbModulePath = require.resolve('../db');

const users: UserRecord[] = [];
const tags: TagRecord[] = [];
// 既存データを引き取るデモユーザーの ID。ensureDemoUser が最初に走るため 1 になる前提。
const DEMO_USER_ID = 1;
const memos: MemoRecord[] = [
  {
    id: 1,
    userId: DEMO_USER_ID,
    orderIndex: 0,
    width: 180,
    height: 48,
    title: 'Seed memo',
    content: 'Existing memo from the browser smoke test.',
    deletedAt: null,
    createdAt: new Date('2026-03-20T10:00:00.000Z'),
    updatedAt: new Date('2026-03-20T10:00:00.000Z'),
  },
];
const memoTags: MemoTagRecord[] = [];

let nextUserId = 1;
let nextMemoId = 2;
let nextTagId = 1;

const compareValue = (
  left: number | string | Date | null,
  right: number | string | Date | null,
) => {
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

const findTagByWhere = (where: Record<string, unknown>) => {
  if (where.id != null) {
    return tags.find((tag) => tag.id === where.id) ?? null;
  }

  if (where.userId_title && typeof where.userId_title === 'object') {
    const composite = where.userId_title as { userId: number; title: string };
    return (
      tags.find((tag) => tag.userId === composite.userId && tag.title === composite.title) ?? null
    );
  }

  return null;
};

const ensureTag = (userId: number, title: string) => {
  const existing = tags.find((tag) => tag.userId === userId && tag.title === title);
  if (existing) {
    return existing;
  }

  const created: TagRecord = {
    id: nextTagId++,
    userId,
    title,
  };
  tags.push(created);
  return created;
};

type MemoWhereInput = {
  AND?: unknown[];
  OR?: unknown[];
  id?: number;
  userId?: number;
  title?: { contains?: string };
  content?: { contains?: string };
  deletedAt?: Date | null | { not?: null };
  memo_tags?: { some?: { tag?: { title?: { contains?: string } } } };
};

const hasDeletedAtNotFilter = (
  deletedAt: MemoWhereInput['deletedAt'],
): deletedAt is { not?: null } =>
  deletedAt != null && typeof deletedAt === 'object' && 'not' in deletedAt;

// 単一 memo レコードが where 条件を満たすか判定する。複数フィールドは AND として扱う。
const matchesMemoWhere = (memo: MemoRecord, where: unknown): boolean => {
  if (!where || typeof where !== 'object') {
    return true;
  }

  const record = where as MemoWhereInput;

  if (Array.isArray(record.AND)) {
    if (!record.AND.every((condition) => matchesMemoWhere(memo, condition))) {
      return false;
    }
  }

  if (Array.isArray(record.OR)) {
    if (!record.OR.some((condition) => matchesMemoWhere(memo, condition))) {
      return false;
    }
  }

  if (record.id != null && memo.id !== record.id) {
    return false;
  }

  if (record.userId != null && memo.userId !== record.userId) {
    return false;
  }

  if (record.deletedAt === null && memo.deletedAt !== null) {
    return false;
  }

  if (hasDeletedAtNotFilter(record.deletedAt) && memo.deletedAt === record.deletedAt.not) {
    return false;
  }

  if (record.title?.contains != null && !memo.title.includes(record.title.contains)) {
    return false;
  }

  if (record.content?.contains != null && !memo.content.includes(record.content.contains)) {
    return false;
  }

  const tagContains = record.memo_tags?.some?.tag?.title?.contains;
  if (tagContains != null) {
    const hasMatchingTag = memoTags.some((relation) => {
      if (relation.memo_id !== memo.id) {
        return false;
      }
      return tags.some((tag) => tag.id === relation.tag_id && tag.title.includes(tagContains));
    });
    if (!hasMatchingTag) {
      return false;
    }
  }

  return true;
};

const applyMemoWhere = (items: MemoRecord[], where: unknown): MemoRecord[] =>
  items.filter((memo) => matchesMemoWhere(memo, where));

const sortMemos = (items: MemoRecord[], orderBy: unknown) => {
  const orderRules = Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : [];

  return [...items].sort((left, right) => {
    for (const rule of orderRules) {
      if (!rule || typeof rule !== 'object') {
        continue;
      }

      const [field, direction] = Object.entries(rule)[0] ?? [];
      if (!field || (direction !== 'asc' && direction !== 'desc')) {
        continue;
      }

      const comparison = compareValue(
        left[field as keyof MemoRecord] as number | string | Date | null,
        right[field as keyof MemoRecord] as number | string | Date | null,
      );

      if (comparison !== 0) {
        return direction === 'asc' ? comparison : comparison * -1;
      }
    }

    return 0;
  });
};

type MemoCreateTagNested = {
  tag: {
    connect?: { id: number };
    connectOrCreate?: {
      where: { userId_title?: { userId: number; title: string }; title?: string };
      create: { userId?: number; title: string };
    };
  };
};

const resolveTagForMemo = (userId: number, relation: MemoCreateTagNested) => {
  if (relation.tag.connect?.id != null) {
    return relation.tag.connect.id;
  }

  const connectOrCreate = relation.tag.connectOrCreate;
  if (!connectOrCreate) {
    return null;
  }

  const title =
    connectOrCreate.where.userId_title?.title ??
    connectOrCreate.where.title ??
    connectOrCreate.create.title;
  const ownerId =
    connectOrCreate.create.userId ?? connectOrCreate.where.userId_title?.userId ?? userId;

  return ensureTag(ownerId, title).id;
};

const fakePrisma: Record<string, unknown> = {
  user: {
    findUnique: async (args: { where: { id?: number; email?: string } }) => {
      const where = args.where;
      const user =
        where.id != null
          ? users.find((entry) => entry.id === where.id)
          : where.email != null
            ? users.find((entry) => entry.email === where.email)
            : undefined;
      return user ? { ...user } : null;
    },
    create: async (args: {
      data: { email: string; passwordHash: string; displayName: string | null };
    }) => {
      const now = new Date();
      const created: UserRecord = {
        id: nextUserId++,
        email: args.data.email,
        passwordHash: args.data.passwordHash,
        displayName: args.data.displayName,
        createdAt: now,
        updatedAt: now,
      };
      users.push(created);
      return { ...created };
    },
  },
  memos: {
    findMany: async (args?: { where?: unknown; orderBy?: unknown }) => {
      const filtered = applyMemoWhere(memos, args?.where);
      return sortMemos(filtered, args?.orderBy).map(cloneMemo);
    },
    findUnique: async (args: { where: { id: number } }) => {
      const memo = memos.find((entry) => entry.id === args.where.id);
      return memo ? cloneMemo(memo) : null;
    },
    findUniqueOrThrow: async (args: { where: { id: number } }) => {
      const memo = memos.find((entry) => entry.id === args.where.id);
      if (!memo) {
        throw new RecordNotFoundError();
      }
      return cloneMemo(memo);
    },
    findFirst: async (args: { where?: unknown }) => {
      const memo = memos.find((entry) => matchesMemoWhere(entry, args.where));
      return memo ? cloneMemo(memo) : null;
    },
    create: async (args: {
      data: {
        userId: number;
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
          create?: MemoCreateTagNested[];
        };
      };
    }) => {
      const now = new Date();
      const createdMemo: MemoRecord = {
        id: args.data.id ?? nextMemoId++,
        userId: args.data.userId,
        orderIndex:
          args.data.orderIndex ??
          (memos.length === 0 ? 0 : Math.max(...memos.map((memo) => memo.orderIndex)) + 1),
        width: args.data.width ?? null,
        height: args.data.height ?? null,
        title: args.data.title,
        content: args.data.content,
        deletedAt: args.data.deletedAt ?? null,
        createdAt: args.data.createdAt ?? now,
        updatedAt: args.data.updatedAt ?? now,
      };

      memos.push(createdMemo);

      for (const relation of args.data.memo_tags?.create ?? []) {
        const tagId = resolveTagForMemo(createdMemo.userId, relation);
        if (tagId != null) {
          memoTags.push({ memo_id: createdMemo.id, tag_id: tagId });
        }
      }

      return cloneMemo(createdMemo);
    },
    update: async (args: {
      where: { id: number };
      data: Partial<
        Pick<MemoRecord, 'title' | 'content' | 'width' | 'height' | 'orderIndex' | 'deletedAt'>
      >;
    }) => {
      const memo = memos.find((entry) => entry.id === args.where.id);

      if (!memo) {
        throw new RecordNotFoundError();
      }

      Object.assign(memo, args.data, { updatedAt: new Date() });
      return cloneMemo(memo);
    },
    updateMany: async (args: {
      where?: unknown;
      data: Partial<
        Pick<MemoRecord, 'title' | 'content' | 'width' | 'height' | 'orderIndex' | 'deletedAt'>
      >;
    }) => {
      let count = 0;
      for (const memo of memos) {
        if (matchesMemoWhere(memo, args.where)) {
          Object.assign(memo, args.data, { updatedAt: new Date() });
          count += 1;
        }
      }
      return { count };
    },
    delete: async (args: { where: { id: number } }) => {
      const index = memos.findIndex((entry) => entry.id === args.where.id);
      if (index === -1) {
        throw new RecordNotFoundError();
      }

      const deletedMemo = memos.splice(index, 1)[0]!;

      for (let i = memoTags.length - 1; i >= 0; i -= 1) {
        if (memoTags[i]!.memo_id === deletedMemo.id) {
          memoTags.splice(i, 1);
        }
      }

      return cloneMemo(deletedMemo);
    },
    deleteMany: async (args: { where?: unknown }) => {
      let count = 0;
      for (let i = memos.length - 1; i >= 0; i -= 1) {
        if (matchesMemoWhere(memos[i]!, args.where)) {
          const deletedMemo = memos.splice(i, 1)[0]!;
          for (let j = memoTags.length - 1; j >= 0; j -= 1) {
            if (memoTags[j]!.memo_id === deletedMemo.id) {
              memoTags.splice(j, 1);
            }
          }
          count += 1;
        }
      }
      return { count };
    },
  },
  tags: {
    findMany: async (args?: { where?: { userId?: number } }) => {
      const filtered =
        args?.where?.userId != null
          ? tags.filter((tag) => tag.userId === args.where!.userId)
          : tags;
      return [...filtered].sort((left, right) => left.id - right.id).map((tag) => ({ ...tag }));
    },
    findUnique: async (args: { where: Record<string, unknown> }) => {
      const tag = findTagByWhere(args.where);
      return tag ? { ...tag } : null;
    },
    findFirst: async (args: { where?: { id?: number; userId?: number } }) => {
      const tag = tags.find((entry) => {
        if (args.where?.id != null && entry.id !== args.where.id) return false;
        if (args.where?.userId != null && entry.userId !== args.where.userId) return false;
        return true;
      });
      return tag ? { ...tag } : null;
    },
    create: async (args: { data: { id?: number; userId: number; title: string } }) => {
      const created: TagRecord = {
        id: args.data.id ?? nextTagId++,
        userId: args.data.userId,
        title: args.data.title,
      };
      tags.push(created);
      return { ...created };
    },
    delete: async (args: { where: { id: number } }) => {
      const index = tags.findIndex((tag) => tag.id === args.where.id);
      if (index === -1) {
        throw new RecordNotFoundError();
      }
      const deletedTag = tags.splice(index, 1)[0]!;
      return { ...deletedTag };
    },
  },
  memo_tags: {
    createMany: async (args: { data: MemoTagRecord[]; skipDuplicates?: boolean }) => {
      let count = 0;
      for (const relation of args.data) {
        const exists = memoTags.some(
          (current) => current.memo_id === relation.memo_id && current.tag_id === relation.tag_id,
        );
        if (exists && args.skipDuplicates) continue;
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
    findMany: async (args: {
      where?: { memo_id?: { in?: number[] }; tag_id?: number };
      select?: { memo_id?: boolean };
    }) => {
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
  $queryRaw: async () => [{ '?column?': 1 }],
  $transaction: async (input: unknown) => {
    if (typeof input === 'function') {
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

const { buildApp } = require('../app') as {
  buildApp: () => {
    listen: (
      port: number,
      host: string,
      callback: () => void,
    ) => { close: (callback: () => void) => void };
  };
};
const { ensureDemoUser } = require('../features/auth') as {
  ensureDemoUser: () => Promise<void>;
};

Module._load = originalLoad;

async function bootstrap() {
  await ensureDemoUser();

  const app = buildApp();
  const server = app.listen(PORT, HOST, () => {
    console.log(`E2E API server listening on http://${HOST}:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error('E2E API server failed to start:', error);
  process.exit(1);
});
