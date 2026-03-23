export type TagItem = {
  id: number;
  title: string;
};

export interface MemoTagsUpdatedPayload {
  memoId: number;
  tags: TagItem[];
}

export type TagDeletedPayload = number;

export interface TagFilterFieldProps {
  selectedTags?: number[];
}

export type TagFilterFieldEmits = {
  (e: 'update:selectedTags', value: number[]): void;
  (e: 'tag-deleted', tagId: TagDeletedPayload): void;
};

export interface TagRelationFieldProps {
  memoId: number;
  tags: TagItem[];
}

export type TagRelationFieldEmits = {
  (e: 'memo-tags-updated', payload: MemoTagsUpdatedPayload): void;
  (e: 'tag-deleted', tagId: TagDeletedPayload): void;
};

export interface TagSelectionFieldProps {
  resetKey?: number;
}

export type TagSelectionFieldEmits = {
  (e: 'update:selectedTitles', value: string[]): void;
  (e: 'tag-deleted', tagId: TagDeletedPayload): void;
};
