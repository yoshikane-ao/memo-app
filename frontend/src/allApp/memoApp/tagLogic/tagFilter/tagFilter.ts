import { ref } from 'vue';

export function useTagFilter(initialSelectedTags: number[] = []) {
  const localSelectedTags = ref<number[]>([...initialSelectedTags]);
  const isDropdownOpen = ref(false);

  const toggleTag = (tagId: number) => {
    const index = localSelectedTags.value.indexOf(tagId);

    if (index === -1) {
      localSelectedTags.value.push(tagId);
      return;
    }

    localSelectedTags.value.splice(index, 1);
  };

  const replaceSelectedTags = (tagIds: number[]) => {
    localSelectedTags.value = [...tagIds];
  };

  return {
    localSelectedTags,
    isDropdownOpen,
    toggleTag,
    replaceSelectedTags
  };
}
