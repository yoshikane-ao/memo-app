import axios from 'axios';
import type { MemoListItem } from '../types/memo-domain.types';
import type { MemoSortPayloadItem } from './types';

export const saveSortOrder = async (memos: MemoListItem[]) => {
  const items: MemoSortPayloadItem[] = memos.map((memo, index) => ({
    id: memo.id,
    orderIndex: index
  }));

  try {
    await axios.put('http://localhost:3000/memos/sort', { items });
    return true;
  } catch (error) {
    console.error('Failed to save sort order:', error);
    return false;
  }
};
