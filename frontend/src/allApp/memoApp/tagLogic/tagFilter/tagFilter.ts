import { ref } from 'vue';

const isSameTagIdList = (left: number[], right: number[]) => {
  return left.length === right.length && left.every((value, index) => value === right[index]);
};

export function useTagFilter(initialSelectedTags: number[] = []) {
  const localSelectedTags = ref<number[]>([...initialSelectedTags]);
  const isDropdownOpen = ref(false);

  const addTag = (tagId: number) => {
    if (!localSelectedTags.value.includes(tagId)) {
      localSelectedTags.value.push(tagId);
    }
  };

  const removeTag = (tagId: number) => {
    localSelectedTags.value = localSelectedTags.value.filter((currentTagId) => currentTagId !== tagId);
  };

  const toggleTag = (tagId: number) => {
    const index = localSelectedTags.value.indexOf(tagId);

    if (index === -1) {
      addTag(tagId);
      return;
    }

    removeTag(tagId);
  };

  const replaceSelectedTags = (tagIds: number[]) => {
    if (isSameTagIdList(localSelectedTags.value, tagIds)) {
      return;
    }

    localSelectedTags.value = [...tagIds];
  };

  return {
    localSelectedTags,
    isDropdownOpen,
    addTag,
    removeTag,
    toggleTag,
    replaceSelectedTags
  };
}
