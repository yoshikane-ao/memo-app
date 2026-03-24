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

export const useMemoStore = defineStore("memo", () => {
  const items = ref<Memo[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

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
    items.value = [...nextItems];
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

  const fetchAll = async () => {
    loading.value = true;
    error.value = null;

    try {
      items.value = await fetchMemoList();
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
      items.value = [createdMemo, ...items.value];
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
      items.value = items.value.map((memo) =>
        memo.id === input.id
          ? {
              ...memo,
              title: input.title,
              content: input.content,
              width: input.width ?? memo.width,
              height: input.height ?? memo.height,
            }
          : memo
      );
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
      items.value = items.value.filter((memo) => memo.id !== memoId);
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
      items.value = nextItems.map((memo, index) => ({
        ...memo,
        orderIndex: index,
      }));
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
    replaceVisibleItems,
    removeDeletedTagReference,
    replaceMemoTags,
  };
});
