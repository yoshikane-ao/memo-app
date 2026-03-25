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

export interface MemoTrashListContainerProps {
  items: Memo[];
}

export interface MemoTrashListProps {
  items: Memo[];
}

export interface MemoTrashCardProps {
  memo: Memo;
}

export interface MemoTrashCardActionsProps {
  isCopied: boolean;
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
  (e: "trash-requested", memoId: number): void;
  (e: "memo-tags-updated", payload: MemoTagsUpdatedPayload): void;
  (e: "tag-deleted", tagId: TagDeletedPayload): void;
};

export type MemoCardEmits = {
  (e: "save-requested", payload: SaveMemoPayload): void;
  (e: "trash-requested", memoId: number): void;
  (e: "memo-tags-updated", payload: MemoTagsUpdatedPayload): void;
  (e: "tag-deleted", tagId: TagDeletedPayload): void;
};

export type MemoCardActionsEmits = {
  (e: "copy-requested"): void;
  (e: "save-requested"): void;
  (e: "trash-requested"): void;
};

export type MemoCardTagsEmits = {
  (e: "memo-tags-updated", payload: MemoTagsUpdatedPayload): void;
  (e: "tag-deleted", tagId: TagDeletedPayload): void;
};

export type MemoTrashListEmits = {
  (e: "restore-requested", memoId: number): void;
  (e: "purge-requested", memoId: number): void;
};

export type MemoTrashCardEmits = {
  (e: "restore-requested", memoId: number): void;
  (e: "purge-requested", memoId: number): void;
};

export type MemoTrashCardActionsEmits = {
  (e: "copy-requested"): void;
  (e: "restore-requested"): void;
  (e: "purge-requested"): void;
};
