import { defineStore } from "pinia";
import { ref } from "vue";
import {
  createTag as createTagRequest,
  deleteTag as deleteTagRequest,
  fetchTagList,
  linkTagToMemo as linkTagToMemoRequest,
  unlinkTagFromMemo as unlinkTagFromMemoRequest,
} from "../api/tag.repository";
import type { CreateTagInput, TagItem } from "./tag.types";

const FETCH_ERROR = "Failed to fetch tags.";
const CREATE_ERROR = "Failed to create tag.";
const DELETE_ERROR = "Failed to delete tag.";
const LINK_ERROR = "Failed to link tag.";
const UNLINK_ERROR = "Failed to unlink tag.";

export const useTagStore = defineStore("tag", () => {
  const items = ref<TagItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const addLocalTag = (tag: TagItem) => {
    if (items.value.some((currentTag) => currentTag.id === tag.id)) {
      return;
    }

    items.value = [...items.value, tag];
  };

  const removeLocalTag = (tagId: number) => {
    items.value = items.value.filter((tag) => tag.id !== tagId);
  };

  const fetchAll = async () => {
    loading.value = true;
    error.value = null;

    try {
      items.value = await fetchTagList();
      return true;
    } catch (fetchError) {
      console.error(fetchError);
      error.value = FETCH_ERROR;
      return false;
    } finally {
      loading.value = false;
    }
  };

  const ensureLoaded = async () => {
    if (items.value.length > 0 || loading.value) {
      return true;
    }

    return fetchAll();
  };

  const createTag = async (input: CreateTagInput) => {
    error.value = null;

    try {
      const createdTag = await createTagRequest(input);
      addLocalTag(createdTag);
      return createdTag;
    } catch (createError) {
      console.error(createError);
      error.value = CREATE_ERROR;
      return null;
    }
  };

  const deleteTag = async (tagId: number) => {
    error.value = null;

    try {
      await deleteTagRequest(tagId);
      removeLocalTag(tagId);
      return true;
    } catch (deleteError) {
      console.error(deleteError);
      error.value = DELETE_ERROR;
      return false;
    }
  };

  const linkTagToMemo = async (memoId: number, tagId: number) => {
    error.value = null;

    try {
      await linkTagToMemoRequest(memoId, tagId);
      return true;
    } catch (linkError) {
      console.error(linkError);
      error.value = LINK_ERROR;
      return false;
    }
  };

  const unlinkTagFromMemo = async (memoId: number, tagId: number) => {
    error.value = null;

    try {
      await unlinkTagFromMemoRequest(memoId, tagId);
      return true;
    } catch (unlinkError) {
      console.error(unlinkError);
      error.value = UNLINK_ERROR;
      return false;
    }
  };

  return {
    items,
    loading,
    error,
    fetchAll,
    ensureLoaded,
    createTag,
    deleteTag,
    linkTagToMemo,
    unlinkTagFromMemo,
    addLocalTag,
    removeLocalTag,
  };
});
