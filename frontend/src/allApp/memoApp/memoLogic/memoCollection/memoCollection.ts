import { fetchMemoList } from './memoCollectionApi';
import { useMemoCollectionHandlers } from './memoCollectionHandlers';
import { useMemoCollectionStore } from './memoCollectionStore';

export function useMemoCollection() {
  const {
    memos,
    replaceMemos,
    prependMemo,
    commitSortedMemos,
    updateMemoField,
    commitMemoUpdate,
    removeMemo,
    commitMemoTags,
    removeTagFromAllMemos
  } = useMemoCollectionStore();

  const initializeMemos = async () => {
    try {
      replaceMemos(await fetchMemoList());
      return true;
    } catch (error) {
      console.error('Failed to fetch memos:', error);
      return false;
    }
  };
  const handlers = useMemoCollectionHandlers({
    replaceMemos,
    prependMemo,
    commitSortedMemos,
    commitMemoUpdate,
    removeMemo,
    commitMemoTags,
    removeTagFromAllMemos
  });

  return {
    memos,
    initializeMemos,
    updateMemoField,
    ...handlers
  };
}
