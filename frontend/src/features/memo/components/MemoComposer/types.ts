export interface MemoComposerDraft {
  title: string;
  content: string;
}

export interface MemoComposerFieldsProps extends MemoComposerDraft {}

export interface MemoComposerFormProps extends MemoComposerDraft {
  isSubmitDisabled: boolean;
  tagSelectionResetKey: number;
}

export type MemoComposerContainerEmits = {
  (e: "memo-created", memoId: number): void;
  (e: "tag-deleted", tagId: number): void;
};

export type MemoComposerFieldsEmits = {
  (e: "update:title", value: string): void;
  (e: "update:content", value: string): void;
};

export type MemoComposerFormEmits = {
  (e: "update:title", value: string): void;
  (e: "update:content", value: string): void;
  (e: "update:selectedTitles", value: string[]): void;
  (e: "submit"): void;
  (e: "tag-deleted", tagId: number): void;
};
