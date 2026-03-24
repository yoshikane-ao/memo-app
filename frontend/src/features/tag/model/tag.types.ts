export interface TagItem {
  id: number;
  title: string;
}

export interface CreateTagInput {
  title: string;
  memoId?: number;
}

export interface TagFilterSelectProps {
  selectedTags?: number[];
}

export interface TagSelectionSelectProps {
  resetKey?: number;
}

export interface TagRelationEditorProps {
  memoId: number;
  tags: TagItem[];
}

export interface MemoTagsUpdatedPayload {
  memoId: number;
  tags: TagItem[];
}

export type TagDeletedPayload = number;

export type TagFilterSelectEmits = {
  (e: "update:selectedTags", value: number[]): void;
  (e: "tag-deleted", tagId: TagDeletedPayload): void;
};

export type TagSelectionSelectEmits = {
  (e: "update:selectedTitles", value: string[]): void;
  (e: "tag-deleted", tagId: TagDeletedPayload): void;
};

export type TagRelationEditorEmits = {
  (e: "memo-tags-updated", payload: MemoTagsUpdatedPayload): void;
  (e: "tag-deleted", tagId: TagDeletedPayload): void;
};
