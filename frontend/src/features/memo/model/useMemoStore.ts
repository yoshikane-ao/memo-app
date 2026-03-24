import { defineStore } from "pinia";
import { ref } from "vue";
import {
  createMemo as createMemoRequest,
  deleteMemo as deleteMemoRequest,
  fetchMemoList,
  reorderMemos as reorderMemosRequest,
  updateMemo as updateMemoRequest,
} from "../api/memo.repository";
import type { CreateMemoInput, Memo, TagSummary, UpdateMemoInput } from "./memo.types";

const FETCH_ERROR = "Failed to fetch memos.";
const CREATE_ERROR = "Failed to create memo.";
const UPDATE_ERROR = "Failed to update memo.";
const DELETE_ERROR = "Failed to delete memo.";
const REORDER_ERROR = "Failed to reorder memos.";

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

const sortMemos = (memos: Memo[]) =>
  [...memos].sort((left, right) => {
    if (left.orderIndex !== right.orderIndex) {
      return left.orderIndex - right.orderIndex;
    }

    return right.id - left.id;
  });

export const useMemoStore = defineStore("memo", () => {
  const items = ref<Memo[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const setItems = (nextItems: Memo[]) => {
    items.value = sortMemos(nextItems.map(cloneMemo));
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

  const updateMemoField = (memoId: number, field: "title" | "content", value: string) => {
    items.value = items.value.map((memo) =>
      memo.id === memoId
        ? {
            ...memo,
            [field]: value,
          }
        : memo
    );
  };

  const replaceVisibleItems = (nextItems: Memo[]) => {
    setItems(nextItems);
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

  const fetchAll = async () => {
    loading.value = true;
    error.value = null;

    try {
      setItems(await fetchMemoList());
    } catch (fetchError) {
      console.error(fetchError);
      error.value = FETCH_ERROR;
    } finally {
      loading.value = false;
    }
  };

  const createMemo = async (input: CreateMemoInput) => {
    error.value = null;

    try {
      const createdMemo = await createMemoRequest(input);
      upsertLocalMemo(createdMemo);
      return createdMemo;
    } catch (createError) {
      console.error(createError);
      error.value = CREATE_ERROR;
      return null;
    }
  };

  const updateMemo = async (input: UpdateMemoInput) => {
    error.value = null;

    try {
      await updateMemoRequest(input);
      const currentMemo = items.value.find((memo) => memo.id === input.id);
      if (currentMemo) {
        upsertLocalMemo({
          ...currentMemo,
          title: input.title,
          content: input.content,
          width: input.width === undefined ? currentMemo.width : input.width,
          height: input.height === undefined ? currentMemo.height : input.height,
        });
      }
      return true;
    } catch (updateError) {
      console.error(updateError);
      error.value = UPDATE_ERROR;
      return false;
    }
  };

  const deleteMemo = async (memoId: number) => {
    error.value = null;

    try {
      await deleteMemoRequest(memoId);
      removeLocalMemo(memoId);
      return true;
    } catch (deleteError) {
      console.error(deleteError);
      error.value = DELETE_ERROR;
      return false;
    }
  };

  const reorderMemos = async (nextItems: Memo[]) => {
    error.value = null;

    try {
      await reorderMemosRequest(
        nextItems.map((memo, index) => ({
          id: memo.id,
          orderIndex: index,
        }))
      );
      setItems(
        nextItems.map((memo, index) => ({
          ...memo,
          orderIndex: index,
        }))
      );
      return true;
    } catch (reorderError) {
      console.error(reorderError);
      error.value = REORDER_ERROR;
      return false;
    }
  };

  return {
    items,
    loading,
    error,
    fetchAll,
    createMemo,
    updateMemo,
    deleteMemo,
    reorderMemos,
    updateMemoField,
    setItems,
    upsertLocalMemo,
    removeLocalMemo,
    replaceVisibleItems,
    removeDeletedTagReference,
    replaceMemoTags,
    addLocalTagToMemo,
  };
});
