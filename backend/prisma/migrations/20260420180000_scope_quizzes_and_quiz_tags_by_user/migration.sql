-- Phase 2b: Quizs / quizTag に user_id FK を追加し、既存データを
-- 「legacy」システムユーザーに紐付ける。quizTag の UNIQUE 制約は
-- (tagName) から (user_id, tagName) へ移行する。
-- expand → backfill → contract の 3 ステップを単一マイグレーション
-- 内で順に実行することで、本番相当のデプロイでもダウンタイムを
-- 最小化できる構成を採る。

-- システムユーザー（既存データの引き取り先）。20260420170000 で
-- すでに作成済みだが、quiz 単独で本マイグレーションを適用できるよう
-- 冪等に挿入する。
INSERT INTO users (email, password_hash, display_name, created_at, updated_at)
SELECT 'legacy@system.local', '!disabled', 'Legacy Data', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'legacy@system.local');

-- Quizs に user_id を追加
ALTER TABLE "Quizs" ADD COLUMN IF NOT EXISTS "user_id" INTEGER;
UPDATE "Quizs"
   SET "user_id" = (SELECT id FROM users WHERE email = 'legacy@system.local')
 WHERE "user_id" IS NULL;
ALTER TABLE "Quizs" ALTER COLUMN "user_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Quizs_user_id_fkey'
  ) THEN
    ALTER TABLE "Quizs"
      ADD CONSTRAINT "Quizs_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS "Quizs_user_id_idx" ON "Quizs"("user_id");

-- quizTag に user_id を追加
ALTER TABLE "quizTag" ADD COLUMN IF NOT EXISTS "user_id" INTEGER;
UPDATE "quizTag"
   SET "user_id" = (SELECT id FROM users WHERE email = 'legacy@system.local')
 WHERE "user_id" IS NULL;
ALTER TABLE "quizTag" ALTER COLUMN "user_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quizTag_user_id_fkey'
  ) THEN
    ALTER TABLE "quizTag"
      ADD CONSTRAINT "quizTag_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS "quizTag_user_id_idx" ON "quizTag"("user_id");

-- quizTag の UNIQUE 制約を (tagName) → (user_id, tagName) に置き換える。
-- Prisma が @unique で生成する名前は "quizTag_tagName_key"。
ALTER TABLE "quizTag" DROP CONSTRAINT IF EXISTS "quizTag_tagName_key";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quizTag_user_id_tagName_key'
  ) THEN
    ALTER TABLE "quizTag" ADD CONSTRAINT "quizTag_user_id_tagName_key" UNIQUE ("user_id", "tagName");
  END IF;
END$$;
