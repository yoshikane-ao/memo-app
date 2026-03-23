import { ref } from 'vue';

export function useTagSearchState() {
  const openTagSearchMap = ref<Record<number, boolean>>({});

  const isTagSearchOpen = (memoId: number) => {
    return openTagSearchMap.value[memoId] ?? false;
  };

  const toggleTagSearch = (memoId: number) => {
    openTagSearchMap.value[memoId] = !isTagSearchOpen(memoId);
  };

  const closeTagSearch = (memoId: number) => {
    openTagSearchMap.value[memoId] = false;
  };

  return {
    isTagSearchOpen,
    toggleTagSearch,
    closeTagSearch
  };
}
