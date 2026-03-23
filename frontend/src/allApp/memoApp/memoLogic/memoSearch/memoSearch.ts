import type { Ref } from 'vue';
import type { MemoListItem } from '../types/memo-domain.types';
import { useMemoSearchResults } from './memoSearchResults';
import { useMemoSearchState } from './memoSearchState';

export function useMemoSearch(memos: Ref<MemoListItem[]>) {
  const { keyword, searchType, sortOrder, selectedTags } = useMemoSearchState();
  const { displayedMemos, canSort } = useMemoSearchResults({
    memos,
    keyword,
    searchType,
    sortOrder,
    selectedTags
  });

  return {
    keyword,
    searchType,
    sortOrder,
    selectedTags,
    displayedMemos,
    canSort
  };
}
