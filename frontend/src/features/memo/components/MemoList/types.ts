import type { Memo } from "../../model/memo.types";
import type { MemoTagsUpdatedPayload, TagDeletedPayload } from "../../../tag";

export interface MemoListContainerProps {
  items: Memo[];
  canReorder: boolean;
}

export interface MemoListProps {
  items: Memo[];
  canReorder: boolean;
}

export interface MemoCardProps {
  memo: Memo;
}

export interface MemoCardActionsProps {
  memoId: number;
  isSaveDisabled: boolean;
  isCopied: boolean;
}

export interface MemoCardTagsProps {
  memoId: number;
  tags: Memo["memo_tags"];
}

export interface SaveMemoPayload {
  memoId: number;
  title: string;
  content: string;
  width?: number;
  height?: number;
}

export type MemoListContainerEmits = {
  (e: "tag-deleted", tagId: TagDeletedPayload): void;
};

export type MemoListEmits = {
  (e: "reorder-requested", items: Memo[]): void;
  (e: "save-requested", payload: SaveMemoPayload): void;
  (e: "delete-requested", memoId: number): void;
  (e: "memo-tags-updated", payload: MemoTagsUpdatedPayload): void;
  (e: "tag-deleted", tagId: TagDeletedPayload): void;
};

export type MemoCardEmits = {
  (e: "save-requested", payload: SaveMemoPayload): void;
  (e: "delete-requested", memoId: number): void;
  (e: "memo-tags-updated", payload: MemoTagsUpdatedPayload): void;
  (e: "tag-deleted", tagId: TagDeletedPayload): void;
};

export type MemoCardActionsEmits = {
  (e: "copy-requested"): void;
  (e: "save-requested"): void;
  (e: "delete-requested"): void;
};

export type MemoCardTagsEmits = {
  (e: "memo-tags-updated", payload: MemoTagsUpdatedPayload): void;
  (e: "tag-deleted", tagId: TagDeletedPayload): void;
};
