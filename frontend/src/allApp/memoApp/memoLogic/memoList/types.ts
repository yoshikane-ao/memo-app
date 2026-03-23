import type { MemoListItem } from '../types/memo-domain.types';
import type { MemoDeletedPayload } from '../memoDelete/types';
import type { MemoUpdatedPayload } from '../memoUpdate/types';
import type { MemoTagsUpdatedPayload, TagDeletedPayload, TagItem } from '../../tagLogic/Types';

export interface MemoListProps {
  items: MemoListItem[];
  canSort: boolean;
}

export interface MemoListViewProps {
  items: MemoListItem[];
  canSort: boolean;
}

export interface MemoListContentProps {
  items: MemoListItem[];
  canSort: boolean;
}

export interface MemoListRowsProps {
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

export interface MemoRowActionsProps {
  memo: MemoListItem;
  currentWidth?: number;
  currentHeight?: number;
}

export interface MemoRowTagsProps {
  memoId: number;
  tags: TagItem[];
}

export interface MemoFieldInputPayload {
  memoId: number;
  value: string;
}

export type MemoListEmits = {
  (e: 'update:items', items: MemoListItem[]): void;
  (e: 'sort-saved', items: MemoListItem[]): void;
  (e: 'memo-updated', payload: MemoUpdatedPayload): void;
  (e: 'memo-deleted', memoId: MemoDeletedPayload): void;
  (e: 'memo-tags-updated', payload: MemoTagsUpdatedPayload): void;
  (e: 'tag-deleted', tagId: TagDeletedPayload): void;
};

export type MemoListViewEmits = {
  (e: 'update:items', items: MemoListItem[]): void;
  (e: 'sort-saved', items: MemoListItem[]): void;
};

export type MemoListContentEmits = {
  (e: 'update:items', items: MemoListItem[]): void;
  (e: 'sort-saved', items: MemoListItem[]): void;
  (e: 'title-input', payload: MemoFieldInputPayload): void;
  (e: 'content-input', payload: MemoFieldInputPayload): void;
  (e: 'memo-updated', payload: MemoUpdatedPayload): void;
  (e: 'memo-deleted', memoId: MemoDeletedPayload): void;
  (e: 'memo-tags-updated', payload: MemoTagsUpdatedPayload): void;
  (e: 'tag-deleted', tagId: TagDeletedPayload): void;
};

export type MemoListRowsEmits = {
  (e: 'update:items', items: MemoListItem[]): void;
  (e: 'sort-saved', items: MemoListItem[]): void;
  (e: 'title-input', payload: MemoFieldInputPayload): void;
  (e: 'content-input', payload: MemoFieldInputPayload): void;
};

export type MemoRowViewEmits = {
  (e: 'title-input', value: string): void;
  (e: 'content-input', value: string): void;
};

export type MemoRowActionsEmits = {
  (e: 'memo-updated', payload: MemoUpdatedPayload): void;
  (e: 'memo-deleted', memoId: MemoDeletedPayload): void;
};

export type MemoRowTagsEmits = {
  (e: 'memo-tags-updated', payload: MemoTagsUpdatedPayload): void;
  (e: 'tag-deleted', tagId: TagDeletedPayload): void;
};
