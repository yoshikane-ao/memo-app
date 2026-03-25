import { defineStore } from "pinia";
import { ref } from "vue";
import { fetchMemoList } from "../api/memo.repository";
import type { Memo, MemoCollectionScope, TagSummary } from "./memo.types";

const FETCH_ERROR = "Failed to fetch memos.";

const cloneTagSummary = (tag: TagSummary): TagSummary => ({
  ...tag,
});

const cloneMemo = (memo: Memo): Memo => ({
  ...memo,
  memo_tags: memo.memo_tags.map((memoTag) => ({
    ...memoTag,
    tag: cloneTagSummary(memoTag.tag),
  })),
});

const sortMemos = (memos: Memo[], scope: MemoCollectionScope) =>
  [...memos].sort((left, right) => {
    if (scope === "trash") {
      return Date.parse(right.deletedAt ?? right.updatedAt) - Date.parse(left.deletedAt ?? left.updatedAt);
    }

    if (left.orderIndex !== right.orderIndex) {
      return left.orderIndex - right.orderIndex;
    }

    return right.id - left.id;
  });

export const useMemoStore = defineStore("memo", () => {
  const items = ref<Memo[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const loadedScope = ref<MemoCollectionScope>("active");

  const setItems = (nextItems: Memo[], scope: MemoCollectionScope = loadedScope.value) => {
    loadedScope.value = scope;
    items.value = sortMemos(nextItems.map(cloneMemo), scope);
  };

  const upsertLocalMemo = (memo: Memo) => {
    const nextMemo = cloneMemo(memo);
    const existingIndex = items.value.findIndex((currentMemo) => currentMemo.id === nextMemo.id);

    if (existingIndex === -1) {
      setItems([nextMemo, ...items.value]);
      return;
    }

    const nextItems = [...items.value];
    nextItems.splice(existingIndex, 1, nextMemo);
    setItems(nextItems);
  };

  const removeLocalMemo = (memoId: number) => {
    items.value = items.value.filter((memo) => memo.id !== memoId);
  };

  const removeDeletedTagReference = (tagId: number) => {
    items.value = items.value.map((memo) => ({
      ...memo,
      memo_tags: memo.memo_tags.filter((memoTag) => memoTag.tag.id !== tagId),
    }));
  };

  const replaceMemoTags = (memoId: number, tags: TagSummary[]) => {
    items.value = items.value.map((memo) =>
      memo.id === memoId
        ? {
            ...memo,
            memo_tags: tags.map((tag) => ({
              memo_id: memoId,
              tag_id: tag.id,
              tag,
            })),
          }
        : memo
    );
  };

  const addLocalTagToMemo = (memoId: number, tag: TagSummary) => {
    const targetMemo = items.value.find((memo) => memo.id === memoId);
    if (!targetMemo || targetMemo.memo_tags.some((memoTag) => memoTag.tag.id === tag.id)) {
      return;
    }

    replaceMemoTags(memoId, [...targetMemo.memo_tags.map((memoTag) => cloneTagSummary(memoTag.tag)), tag]);
  };

  const fetchAll = async (scope: MemoCollectionScope = "active") => {
    if (loadedScope.value !== scope) {
      setItems([], scope);
    }

    loading.value = true;
    error.value = null;

    try {
      setItems(await fetchMemoList(scope), scope);
      return true;
    } catch (fetchError) {
      console.error(fetchError);
      error.value = FETCH_ERROR;
      return false;
    } finally {
      loading.value = false;
    }
  };

  const ensureLoaded = async (scope: MemoCollectionScope = "active") => {
    if ((items.value.length > 0 && loadedScope.value === scope) || loading.value) {
      return true;
    }

    return fetchAll(scope);
  };

  return {
    items,
    loading,
    error,
    loadedScope,
    fetchAll,
    ensureLoaded,
    setItems,
    upsertLocalMemo,
    removeLocalMemo,
    removeDeletedTagReference,
    replaceMemoTags,
    addLocalTagToMemo,
  };
});
