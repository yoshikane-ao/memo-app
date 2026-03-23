import type { MemoListItem } from '../types/memo-domain.types';

export interface MemoLayoutSlotProps {
  syncTitleLayout: (memoId: number, textarea: HTMLTextAreaElement) => void;
  syncContentLayout: (memoId: number, textarea: HTMLTextAreaElement) => void;
  getTitleWidth: (memo: MemoListItem) => string | undefined;
  getContentHeight: (memo: MemoListItem) => string | undefined;
  getCurrentWidth: (memo: MemoListItem) => number | undefined;
  getCurrentHeight: (memo: MemoListItem) => number | undefined;
}
