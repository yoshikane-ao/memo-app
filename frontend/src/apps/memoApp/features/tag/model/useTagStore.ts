import { defineStore } from "pinia";
import { ref } from "vue";
import { fetchTagList } from "../api/tag.repository";
import type { TagItem } from "./tag.types";

const FETCH_ERROR = "Failed to fetch tags.";

const cloneTag = (tag: TagItem): TagItem => ({
  ...tag,
});

export const useTagStore = defineStore("tag", () => {
  const items = ref<TagItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const setItems = (nextItems: TagItem[]) => {
    items.value = [...nextItems.map(cloneTag)].sort((left, right) => left.id - right.id);
  };

  const addLocalTag = (tag: TagItem) => {
    const nextTag = cloneTag(tag);
    const existingIndex = items.value.findIndex((currentTag) => currentTag.id === nextTag.id);

    if (existingIndex === -1) {
      setItems([...items.value, nextTag]);
      return;
    }

    const nextItems = [...items.value];
    nextItems.splice(existingIndex, 1, nextTag);
    setItems(nextItems);
  };

  const removeLocalTag = (tagId: number) => {
    items.value = items.value.filter((tag) => tag.id !== tagId);
  };

  const fetchAll = async () => {
    loading.value = true;
    error.value = null;

    try {
      setItems(await fetchTagList());
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

  return {
    items,
    loading,
    error,
    fetchAll,
    ensureLoaded,
    setItems,
    addLocalTag,
    removeLocalTag,
  };
});
