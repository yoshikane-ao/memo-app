import { ref } from 'vue';
import axios from 'axios';
import type { TagItem } from '../Types';

const allTags = ref<TagItem[]>([]);

const replaceAllTags = (tags: TagItem[]) => {
  allTags.value = [...tags];
};

const addTag = (tag: TagItem) => {
  if (allTags.value.some((currentTag) => currentTag.id === tag.id)) {
    return;
  }

  allTags.value = [...allTags.value, tag];
};

const removeTag = (tagId: number) => {
  allTags.value = allTags.value.filter((tag) => tag.id !== tagId);
};

export function useTagCatalog() {
  const fetchAllTags = async () => {
    try {
      const response = await axios.get<{ items?: TagItem[] }>('http://localhost:3000/tags/list');
      replaceAllTags(response.data.items ?? []);
      return true;
    } catch {
      return false;
    }
  };

  return {
    allTags,
    fetchAllTags,
    replaceAllTags,
    addTag,
    removeTag
  };
}
