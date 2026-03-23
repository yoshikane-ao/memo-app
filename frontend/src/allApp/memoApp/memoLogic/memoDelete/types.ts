export type MemoDeletedPayload = number;

export type MemoDeleteEmits = {
  (e: 'memo-deleted', memoId: MemoDeletedPayload): void;
};
