import { ref } from 'vue';
import axios from 'axios';
import type { MemoApiItem, MemoListItem, MemoTextField } from '../types/memo-domain.types';
import type { MemoDeletedPayload } from '../memoDelete/types';
import type { MemoUpdatedPayload } from '../memoUpdate/types';

const toMemoListItem = (item: MemoApiItem): MemoListItem => ({
  ...item,
  initialTitle: item.title,
  initialContent: item.content
});

const memos = ref<MemoListItem[]>([]);

export function useMemoCollection() {
  const fetchMemos = async () => {
    try {
      const response = await axios.get<{ items: MemoApiItem[] }>('http://localhost:3000/memos/list');
      memos.value = response.data.items.map(toMemoListItem);
      return true;
    } catch (error) {
      console.error('Failed to fetch memos:', error);
      return false;
    }
  };

  const replaceMemos = (items: MemoListItem[]) => {
    memos.value = [...items];
  };

  const commitSortedMemos = (items: MemoListItem[]) => {
    memos.value = items.map((memo, index) => ({
      ...memo,
      orderIndex: index
    }));
  };

  const updateMemoField = (memoId: number, field: MemoTextField, value: string) => {
    memos.value = memos.value.map((memo) => {
      if (memo.id !== memoId) {
        return memo;
      }

      return {
        ...memo,
        [field]: value
      };
    });
  };

  const commitMemoUpdate = (payload: MemoUpdatedPayload) => {
    memos.value = memos.value.map((memo) => {
      if (memo.id !== payload.memoId) {
        return memo;
      }

      return {
        ...memo,
        title: payload.title,
        content: payload.content,
        initialTitle: payload.title,
        initialContent: payload.content,
        width: payload.width ?? memo.width,
        height: payload.height ?? memo.height
      };
    });
  };

  const removeMemo = (memoId: MemoDeletedPayload) => {
    memos.value = memos.value.filter((memo) => memo.id !== memoId);
  };

  return {
    memos,
    fetchMemos,
    replaceMemos,
    commitSortedMemos,
    updateMemoField,
    commitMemoUpdate,
    removeMemo
  };
}
