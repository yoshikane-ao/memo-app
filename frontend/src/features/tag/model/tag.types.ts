export interface TagItem {
  id: number;
  title: string;
}

export interface CreateTagInput {
  title: string;
  memoId?: number;
}

export interface RestoreTagInput extends TagItem {
  linkedMemoIds?: number[];
}

export interface TagFilterSelectProps {
  selectedTags?: number[];
}

export interface TagSelectionSelectProps {
  selectedTags: TagItem[];
  resetKey?: number;
}

export interface MemoTagSource {
  memoId: number;
  title: string;
  content: string;
  tags: TagItem[];
}

export interface TagPickerFieldProps {
  selectedTags: TagItem[];
  availableTags: TagItem[];
  memoSources?: MemoTagSource[];
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
  (e: "update:selectedTags", value: TagItem[]): void;
  (e: "tag-deleted", tagId: TagDeletedPayload): void;
};

export type TagPickerFieldEmits = {
  (e: "toggle-tag", tag: TagItem): void;
  (e: "remove-tag", tag: TagItem): void;
  (e: "create-tag", title: string): void;
  (e: "delete-tag", tag: TagItem): void;
  (e: "apply-tags-from-memo", source: MemoTagSource): void;
};

export type TagRelationEditorEmits = {
  (e: "memo-tags-updated", payload: MemoTagsUpdatedPayload): void;
  (e: "tag-deleted", tagId: TagDeletedPayload): void;
};
