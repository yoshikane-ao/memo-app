import { ref } from 'vue';
import axios from 'axios';
import { useMemoSearch } from '../memoSearch/memoSearch';
import type { MemoApiItem, MemoListItem } from '../Types';

const toMemoListItem = (item: MemoApiItem): MemoListItem => ({
  ...item,
  initialTitle: item.title,
  initialContent: item.content
});

export function useMemoRepaint() {
  const memos = ref<MemoListItem[]>([]);
  const { keyword, searchType, sortOrder, selectedTags, displayedMemos, canSort } =
    useMemoSearch(memos);

  const fetchMemos = async () => {
    try {
      const response = await axios.get<{ items: MemoApiItem[] }>('http://localhost:3000/memos/list');
      memos.value = response.data.items.map(toMemoListItem);
    } catch (error) {
      console.error('メモ一覧の取得に失敗しました:', error);
    }
  };

  const repaintMemos = async () => {
    await fetchMemos();
  };

  const replaceMemos = (items: MemoListItem[]) => {
    memos.value = items;
  };

  return {
    keyword,
    searchType,
    sortOrder,
    selectedTags,
    displayedMemos,
    canSort,
    repaintMemos,
    replaceMemos
  };
}
