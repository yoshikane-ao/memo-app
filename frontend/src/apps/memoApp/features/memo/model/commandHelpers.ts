import type { HistoryCommandResult } from "../../../../../shared/history/history.types";
import type { CommandResult } from "./commandResult";
import type { Memo, TagSummary, UpdateMemoInput } from "./memo.types";
import type { TagItem } from "../../tag/model/tag.types";

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

export const toTagSummary = (tag: TagItem): TagSummary => ({
  id: tag.id,
  title: tag.title,
});

export const toUniqueTagSummaries = (tags: readonly TagItem[]): TagSummary[] => {
  const seenTagIds = new Set<number>();
  const nextTags: TagSummary[] = [];

  for (const tag of tags) {
    if (seenTagIds.has(tag.id)) {
      continue;
    }

    seenTagIds.add(tag.id);
    nextTags.push(toTagSummary(tag));
  }

  return nextTags;
};

export const toMemoUpdateInput = (memo: Memo): UpdateMemoInput => ({
  id: memo.id,
  title: memo.title,
  content: memo.content,
  width: memo.width,
  height: memo.height,
});

export const toValueCommandResult = <T>(
  result: HistoryCommandResult,
  value: T | null | undefined
): CommandResult<T> => {
  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason,
      error: result.error,
    };
  }

  if (value == null) {
    return {
      ok: false,
      reason: "error",
    };
  }

  return {
    ok: true,
    value,
  };
};

export const toVoidCommandResult = (result: HistoryCommandResult): CommandResult<void> =>
  result.ok
    ? {
        ok: true,
        value: undefined,
      }
    : {
        ok: false,
        reason: result.reason,
        error: result.error,
      };
