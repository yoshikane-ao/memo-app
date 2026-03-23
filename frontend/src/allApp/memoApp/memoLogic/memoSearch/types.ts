import type { TagDeletedPayload } from '../../tagLogic/Types';

export type MemoSearchType = 'all' | 'title' | 'content' | 'tag';
export type MemoSortOrder = 'custom' | 'newest' | 'oldest';

export interface MemoSearchProps {
  keyword?: string;
  searchType?: MemoSearchType;
  sortOrder?: MemoSortOrder;
  selectedTags?: number[];
}

export interface MemoSearchControlsProps {
  keyword: string;
  searchType: MemoSearchType;
  sortOrder: MemoSortOrder;
  selectedTags: number[];
}

export type MemoSearchEmits = {
  (e: 'update:keyword', value: string): void;
  (e: 'update:searchType', value: MemoSearchType): void;
  (e: 'update:sortOrder', value: MemoSortOrder): void;
  (e: 'update:selectedTags', value: number[]): void;
  (e: 'tag-deleted', tagId: TagDeletedPayload): void;
};

export type MemoSearchControlsEmits = MemoSearchEmits;
