import { ref } from 'vue';
import type { MemoSearchType, MemoSortOrder } from './types';

export function useMemoSearchState() {
  const keyword = ref('');
  const searchType = ref<MemoSearchType>('all');
  const sortOrder = ref<MemoSortOrder>('custom');
  const selectedTags = ref<number[]>([]);

  return {
    keyword,
    searchType,
    sortOrder,
    selectedTags
  };
}
