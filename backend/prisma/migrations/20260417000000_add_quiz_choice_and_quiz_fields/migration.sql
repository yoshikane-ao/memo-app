CREATE TABLE IF NOT EXISTS "Quizs" (
    "id" SERIAL PRIMARY KEY,
    "word" TEXT NOT NULL,
    "mean" TEXT NOT NULL,
    "questionText" TEXT,
    "hint" TEXT,
    "groupName" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Quizs" ADD COLUMN IF NOT EXISTS "questionText" TEXT;
ALTER TABLE "Quizs" ADD COLUMN IF NOT EXISTS "hint" TEXT;
ALTER TABLE "Quizs" ADD COLUMN IF NOT EXISTS "groupName" TEXT;
ALTER TABLE "Quizs" ADD COLUMN IF NOT EXISTS "isFavorite" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "quizTag" (
    "id" SERIAL PRIMARY KEY,
    "tagName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "quizTag_tagName_key" ON "quizTag"("tagName");

CREATE TABLE IF NOT EXISTS "quizTagsRelations" (
    "quiz_id" INTEGER NOT NULL,
    "quizTag_id" INTEGER NOT NULL,
    CONSTRAINT "quizTagsRelations_pkey" PRIMARY KEY ("quiz_id", "quizTag_id"),
    CONSTRAINT "quizTagsRelations_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quizs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quizTagsRelations_quizTag_id_fkey" FOREIGN KEY ("quizTag_id") REFERENCES "quizTag"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "quizSet" (
    "id" SERIAL PRIMARY KEY,
    "quiz_id" INTEGER NOT NULL,
    CONSTRAINT "quizSet_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quizs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "quizChoice" (
    "id" SERIAL PRIMARY KEY,
    "quiz_id" INTEGER NOT NULL,
    "choiceText" TEXT NOT NULL,
    CONSTRAINT "quizChoice_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quizs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "quizChoice_quiz_id_idx" ON "quizChoice"("quiz_id");
