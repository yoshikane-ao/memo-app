export const memoViewNavigation = {
  active: "memo-active",
  trash: "memo-trash",
} as const;

export type MemoViewNavigationTarget =
  (typeof memoViewNavigation)[keyof typeof memoViewNavigation];
