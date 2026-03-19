-- CreateTable
CREATE TABLE "memo_tags" (
    "memo_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "memo_tags_pkey" PRIMARY KEY ("memo_id","tag_id")
);
