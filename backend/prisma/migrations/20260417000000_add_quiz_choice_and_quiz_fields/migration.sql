ALTER TABLE "Quizs"
ADD COLUMN IF NOT EXISTS "questionText" TEXT;

ALTER TABLE "Quizs"
ADD COLUMN IF NOT EXISTS "hint" TEXT;

ALTER TABLE "Quizs"
ADD COLUMN IF NOT EXISTS "groupName" TEXT;

ALTER TABLE "Quizs"
ADD COLUMN IF NOT EXISTS "isFavorite" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "quizChoice" (
    "id" SERIAL PRIMARY KEY,
    "quiz_id" INTEGER NOT NULL,
    "choiceText" TEXT NOT NULL,
    CONSTRAINT "quizChoice_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quizs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "quizChoice_quiz_id_idx" ON "quizChoice"("quiz_id");
