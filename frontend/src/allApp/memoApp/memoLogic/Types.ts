import type { TagItem } from '../tagLogic/Types';

export type MemoSearchType = 'all' | 'title' | 'content' | 'tag';
export type MemoSortOrder = 'custom' | 'newest' | 'oldest';
export type MemoTextField = 'title' | 'content';

export interface MemoIdProps {
  memoId: number;
}

export interface MemoCopyProps {
  text: string;
}

export interface MemoDraft {
  title: string;
  content: string;
}

export interface MemoRegisterFormProps extends MemoDraft {
  isRegisterDisabled: boolean;
  tagSelectionResetKey: number;
}

export interface MemoRegisterInput extends MemoDraft {
  tags?: string[];
}

export interface MemoUpdateInput {
  id: number;
  title: string;
  content: string;
  width?: number;
  height?: number;
}

export interface MemoUpdateProps extends MemoIdProps {
  title: string;
  content: string;
  initialTitle: string;
  initialContent: string;
  currentWidth?: number;
  initialWidth?: number | null;
  currentHeight?: number;
  initialHeight?: number | null;
}

export interface MemoSearchProps {
  keyword?: string;
  searchType?: MemoSearchType;
  sortOrder?: MemoSortOrder;
  selectedTags?: number[];
}

export interface MemoTagRelation {
  memo_id: number;
  tag_id: number;
  tag: TagItem;
}

export interface MemoApiItem {
  id: number;
  orderIndex: number;
  width: number | null;
  height: number | null;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  memo_tags: MemoTagRelation[];
}

export interface MemoListItem extends MemoApiItem {
  initialTitle: string;
  initialContent: string;
}

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

export interface MemoSortProps {
  items: MemoListItem[];
  disabled?: boolean;
}

export interface MemoLayoutSlotProps {
  syncTitleLayout: (memoId: number, textarea: HTMLTextAreaElement) => void;
  syncContentLayout: (memoId: number, textarea: HTMLTextAreaElement) => void;
  getTitleWidth: (memo: MemoListItem) => string | undefined;
  getContentHeight: (memo: MemoListItem) => string | undefined;
  getCurrentWidth: (memo: MemoListItem) => number | undefined;
  getCurrentHeight: (memo: MemoListItem) => number | undefined;
}

export interface MemoSortPayloadItem {
  id: number;
  orderIndex: number;
}

export type MemoDeleteEmits = {
  (e: 'deleted'): void;
};

export type MemoUpdateEmits = {
  (e: 'updated'): void;
};

export type MemoRegisterEmits = {
  (e: 'created'): void;
};

export type MemoRegisterFormEmits = {
  (e: 'update:title', value: string): void;
  (e: 'update:content', value: string): void;
  (e: 'update:selectedTitles', value: string[]): void;
  (e: 'submit'): void;
};

export type MemoListEmits = {
  (e: 'update:items', items: MemoListItem[]): void;
  (e: 'changed'): void;
  (e: 'sorted'): void;
};

export type MemoRowViewEmits = {
  (e: 'title-input', event: Event): void;
  (e: 'content-input', event: Event): void;
  (e: 'changed'): void;
};

export type MemoListViewEmits = {
  (e: 'update:items', items: MemoListItem[]): void;
  (e: 'sorted'): void;
};

export type MemoSortEmits = {
  (e: 'update:items', items: MemoListItem[]): void;
  (e: 'sorted'): void;
};

export type MemoSearchEmits = {
  (e: 'update:keyword', value: string): void;
  (e: 'update:searchType', value: MemoSearchType): void;
  (e: 'update:sortOrder', value: MemoSortOrder): void;
  (e: 'update:selectedTags', value: number[]): void;
};
