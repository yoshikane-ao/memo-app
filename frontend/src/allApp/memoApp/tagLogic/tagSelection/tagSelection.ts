import { computed, ref } from 'vue';
import type { TagItem } from '../Types';

export function useTagSelection(initialTags: TagItem[] = []) {
  const showTagSearch = ref(false);
  const selectedTags = ref<TagItem[]>([...initialTags]);

  const linkedTagIds = computed(() => selectedTags.value.map((tag) => tag.id));

  const addTag = (tag: TagItem) => {
    if (!selectedTags.value.find((currentTag) => currentTag.id === tag.id)) {
      selectedTags.value.push(tag);
    }
  };

  const removeTag = (tag: TagItem) => {
    selectedTags.value = selectedTags.value.filter((currentTag) => currentTag.id !== tag.id);
  };

  const toggleTagSearch = () => {
    showTagSearch.value = !showTagSearch.value;
  };

  const closeTagSearch = () => {
    showTagSearch.value = false;
  };

  const resetTagSelection = () => {
    selectedTags.value = [];
    showTagSearch.value = false;
  };

  return {
    showTagSearch,
    selectedTags,
    linkedTagIds,
    addTag,
    removeTag,
    toggleTagSearch,
    closeTagSearch,
    resetTagSelection
  };
}
