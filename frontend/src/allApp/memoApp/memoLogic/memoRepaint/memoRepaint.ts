import { onMounted } from 'vue';
import { useMemoCollection } from '../memoCollection/memoCollection';
import { useMemoSearch } from '../memoSearch/memoSearch';

export function useMemoRepaint() {
  const {
    memos,
    initializeMemos,
    handleItemsReplaced,
    handleMemoCreated,
    handleSortSaved,
    handleMemoUpdated,
    handleMemoDeleted,
    handleMemoTagsUpdated,
    handleTagDeleted
  } = useMemoCollection();
  const { keyword, searchType, sortOrder, selectedTags, displayedMemos, canSort } =
    useMemoSearch(memos);

  onMounted(() => {
    void initializeMemos();
  });

  return {
    keyword,
    searchType,
    sortOrder,
    selectedTags,
    displayedMemos,
    canSort,
    handleMemoCreated,
    handleTagDeleted,
    handleItemsReplaced,
    handleSortSaved,
    handleMemoUpdated,
    handleMemoDeleted,
    handleMemoTagsUpdated
  };
}
