import type { Memo, TagSummary, UpdateMemoInput } from "./memo.types";

export const cloneTagSummary = (tag: TagSummary): TagSummary => ({
  ...tag,
});

export const cloneMemo = (memo: Memo): Memo => ({
  ...memo,
  memo_tags: memo.memo_tags.map((memoTag) => ({
    ...memoTag,
    tag: cloneTagSummary(memoTag.tag),
  })),
});

export const toMemoUpdateInput = (memo: Memo): UpdateMemoInput => ({
  id: memo.id,
  title: memo.title,
  content: memo.content,
  width: memo.width,
  height: memo.height,
});
