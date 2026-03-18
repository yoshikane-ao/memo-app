-- CreateTable
CREATE TABLE "MemoHistories" (
    "id" SERIAL NOT NULL,
    "memo_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoHistories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MemoHistories" ADD CONSTRAINT "MemoHistories_memo_id_fkey" FOREIGN KEY ("memo_id") REFERENCES "Memos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
