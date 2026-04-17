import type { TagItem } from "../../../tag";

export interface MemoComposerDraft {
  title: string;
  content: string;
}

export interface MemoComposerFieldsProps extends MemoComposerDraft {}

export interface MemoComposerFormProps extends MemoComposerDraft {
  isSubmitDisabled: boolean;
  selectedTags: TagItem[];
  tagSelectionResetKey: number;
  keepTags: boolean;
}

export type MemoComposerContainerEmits = {
  (e: "memo-created", memoId: number): void;
  (e: "tag-deleted", tagId: number): void;
};

export type MemoComposerFieldsEmits = {
  (e: "update:title", value: string): void;
  (e: "update:content", value: string): void;
  (e: "submit-requested"): void;
};

export type MemoComposerFormEmits = {
  (e: "update:title", value: string): void;
  (e: "update:content", value: string): void;
  (e: "update:selectedTags", value: TagItem[]): void;
  (e: "update:keepTags", value: boolean): void;
  (e: "submit"): void;
  (e: "tag-deleted", tagId: number): void;
};
