import axios from 'axios';
import type { MemoApiItem, MemoListItem } from '../types/memo-domain.types';

export const toMemoListItem = (item: MemoApiItem): MemoListItem => ({
  ...item,
  initialTitle: item.title,
  initialContent: item.content
});

export const fetchMemoList = async () => {
  const response = await axios.get<{ items: MemoApiItem[] }>('http://localhost:3000/memos/list');
  return response.data.items.map(toMemoListItem);
};
