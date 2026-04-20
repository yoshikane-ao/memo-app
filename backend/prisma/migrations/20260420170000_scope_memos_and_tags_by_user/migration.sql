-- Phase 3.1 Session 2: Memos / Tags に userId FK を追加し、既存データを
-- 「legacy」システムユーザーに紐付ける。Tags の UNIQUE 制約は
-- (title) から (user_id, title) へ移行する。Quiz 系は Session 2b で対応。

-- システムユーザー（既存データの引き取り先）。冪等に挿入する。
INSERT INTO users (email, password_hash, display_name, created_at, updated_at)
SELECT 'legacy@system.local', '!disabled', 'Legacy Data', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'legacy@system.local');

-- Memos に user_id を追加
ALTER TABLE "Memos" ADD COLUMN IF NOT EXISTS "user_id" INTEGER;
UPDATE "Memos"
   SET "user_id" = (SELECT id FROM users WHERE email = 'legacy@system.local')
 WHERE "user_id" IS NULL;
ALTER TABLE "Memos" ALTER COLUMN "user_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Memos_user_id_fkey'
  ) THEN
    ALTER TABLE "Memos"
      ADD CONSTRAINT "Memos_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS "Memos_user_id_idx" ON "Memos"("user_id");

-- Tags に user_id を追加
ALTER TABLE "Tags" ADD COLUMN IF NOT EXISTS "user_id" INTEGER;
UPDATE "Tags"
   SET "user_id" = (SELECT id FROM users WHERE email = 'legacy@system.local')
 WHERE "user_id" IS NULL;
ALTER TABLE "Tags" ALTER COLUMN "user_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Tags_user_id_fkey'
  ) THEN
    ALTER TABLE "Tags"
      ADD CONSTRAINT "Tags_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS "Tags_user_id_idx" ON "Tags"("user_id");

-- Tags の UNIQUE 制約を (title) → (user_id, title) に置き換える。
-- Prisma が @unique で生成する名前は "Tags_title_key"。
ALTER TABLE "Tags" DROP CONSTRAINT IF EXISTS "Tags_title_key";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Tags_user_id_title_key'
  ) THEN
    ALTER TABLE "Tags" ADD CONSTRAINT "Tags_user_id_title_key" UNIQUE ("user_id", "title");
  END IF;
END$$;
