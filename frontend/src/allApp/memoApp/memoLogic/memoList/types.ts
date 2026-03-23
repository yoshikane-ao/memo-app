import type { MemoListItem } from '../types/memo-domain.types';
import type { MemoDeletedPayload } from '../memoDelete/types';
import type { MemoUpdatedPayload } from '../memoUpdate/types';

export interface MemoListProps {
  items: MemoListItem[];
  canSort: boolean;
}

export interface MemoListViewProps {
  items: MemoListItem[];
  canSort: boolean;
}

export interface MemoRowViewProps {
  memo: MemoListItem;
  titleWidth?: string;
  contentHeight?: string;
  currentWidth?: number;
  currentHeight?: number;
  syncTitleLayout: (memoId: number, textarea: HTMLTextAreaElement) => void;
  syncContentLayout: (memoId: number, textarea: HTMLTextAreaElement) => void;
}

export type MemoListEmits = {
  (e: 'update:items', items: MemoListItem[]): void;
  (e: 'changed'): void;
  (e: 'sort-saved', items: MemoListItem[]): void;
  (e: 'memo-updated', payload: MemoUpdatedPayload): void;
  (e: 'memo-deleted', memoId: MemoDeletedPayload): void;
};

export type MemoListViewEmits = {
  (e: 'update:items', items: MemoListItem[]): void;
  (e: 'sort-saved', items: MemoListItem[]): void;
};

export type MemoRowViewEmits = {
  (e: 'title-input', value: string): void;
  (e: 'content-input', value: string): void;
  (e: 'changed'): void;
  (e: 'memo-updated', payload: MemoUpdatedPayload): void;
  (e: 'memo-deleted', memoId: MemoDeletedPayload): void;
};
