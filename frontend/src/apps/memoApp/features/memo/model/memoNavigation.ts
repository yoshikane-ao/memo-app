export const memoHistoryNavigation = {
  active: "memo-active",
  trash: "memo-trash",
} as const;

export type MemoHistoryNavigationTarget =
  (typeof memoHistoryNavigation)[keyof typeof memoHistoryNavigation];
