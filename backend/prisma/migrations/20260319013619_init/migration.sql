/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Tags` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Tags_title_key" ON "Tags"("title");

-- AddForeignKey
ALTER TABLE "memo_tags" ADD CONSTRAINT "memo_tags_memo_id_fkey" FOREIGN KEY ("memo_id") REFERENCES "Memos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memo_tags" ADD CONSTRAINT "memo_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
