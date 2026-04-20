// 統合テスト用の prisma クライアントと、テスト間の DB 状態リセットヘルパ。
// db.ts の prisma インスタンスをそのまま使う（DATABASE_URL は globalSetup で注入済み）。
import { prisma } from '../../db';

export { prisma };

// 全テーブルを TRUNCATE して id 連番もリセット。test ごとの独立性を確保する。
export const resetDatabase = async () => {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "MemoHistories",
      "memo_tags",
      "quizTagsRelations",
      "quizChoice",
      "quizSet",
      "Memos",
      "Tags",
      "quizTag",
      "Quizs",
      "users"
    RESTART IDENTITY CASCADE
  `);
};

// 以降のテストで使うユーザーを seed する。id は RESTART IDENTITY 後の連番に乗る。
export const seedUser = async (email = 'tester@example.com') => {
  return prisma.user.create({
    data: {
      email,
      passwordHash: '!placeholder',
      displayName: 'Tester',
    },
  });
};
