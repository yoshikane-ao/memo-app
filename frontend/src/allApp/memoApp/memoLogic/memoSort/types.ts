import type { MemoListItem } from '../types/memo-domain.types';

export interface MemoSortProps {
  items: MemoListItem[];
  disabled?: boolean;
}

export interface MemoSortPayloadItem {
  id: number;
  orderIndex: number;
}

export type MemoSortEmits = {
  (e: 'update:items', items: MemoListItem[]): void;
  (e: 'sort-saved', items: MemoListItem[]): void;
};
