import { computed } from "vue";
import { useMemoStore } from "../../memo";
import type { MemoTagSource } from "../types";

type UseMemoTagSourcesOptions = {
  excludeMemoId?: () => number | undefined;
};

export const useMemoTagSources = (options: UseMemoTagSourcesOptions = {}) => {
  const memoStore = useMemoStore();

  return computed<MemoTagSource[]>(() => {
    const excludedMemoId = options.excludeMemoId?.();

    return memoStore.items
      .filter((memo) => excludedMemoId == null || memo.id !== excludedMemoId)
      .map((memo) => ({
        memoId: memo.id,
        title: memo.title,
        content: memo.content,
        tags: memo.memo_tags.map((memoTag) => ({
          id: memoTag.tag.id,
          title: memoTag.tag.title,
        })),
      }));
  });
};
