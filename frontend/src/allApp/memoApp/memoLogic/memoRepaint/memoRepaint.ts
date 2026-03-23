import { useMemoCollection } from '../memoCollection/memoCollection';
import { useMemoSearch } from '../memoSearch/memoSearch';

export function useMemoRepaint() {
  const { memos, fetchMemos, replaceMemos, commitSortedMemos, commitMemoUpdate, removeMemo } =
    useMemoCollection();
  const { keyword, searchType, sortOrder, selectedTags, displayedMemos, canSort } =
    useMemoSearch(memos);

  const repaintMemos = async () => {
    await fetchMemos();
  };

  return {
    keyword,
    searchType,
    sortOrder,
    selectedTags,
    displayedMemos,
    canSort,
    repaintMemos,
    replaceMemos,
    commitSortedMemos,
    commitMemoUpdate,
    removeMemo
  };
}
