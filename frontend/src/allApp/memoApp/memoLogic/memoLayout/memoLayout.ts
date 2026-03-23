import { reactive } from 'vue';
import type { MemoListItem } from '../types/memo-domain.types';

const MIN_TITLE_WIDTH = 80;
const MAX_TITLE_WIDTH = 500;
const MIN_CONTENT_HEIGHT = 32;

export const applyAutoTitleWidth = (textarea: HTMLTextAreaElement) => {
  textarea.style.width = '0px';
  const nextWidth = Math.min(Math.max(textarea.scrollWidth + 4, MIN_TITLE_WIDTH), MAX_TITLE_WIDTH);
  textarea.style.width = `${nextWidth}px`;
  return nextWidth;
};

export const applyAutoContentHeight = (textarea: HTMLTextAreaElement) => {
  textarea.style.height = '0px';
  const nextHeight = Math.max(textarea.scrollHeight, MIN_CONTENT_HEIGHT);
  textarea.style.height = `${nextHeight}px`;
  return nextHeight;
};

export function useMemoLayoutState() {
  const resizeWidths = reactive<Record<number, number>>({});
  const resizeHeights = reactive<Record<number, number>>({});

  const syncTitleLayout = (memoId: number, textarea: HTMLTextAreaElement) => {
    resizeWidths[memoId] = applyAutoTitleWidth(textarea);
  };

  const syncContentLayout = (memoId: number, textarea: HTMLTextAreaElement) => {
    resizeHeights[memoId] = applyAutoContentHeight(textarea);
  };

  const getTitleWidth = (memo: MemoListItem) => {
    const width = resizeWidths[memo.id] ?? memo.width;
    return width == null ? undefined : `${width}px`;
  };

  const getContentHeight = (memo: MemoListItem) => {
    const height = resizeHeights[memo.id] ?? memo.height;
    return height == null ? undefined : `${height}px`;
  };

  const getCurrentWidth = (memo: MemoListItem) => resizeWidths[memo.id] ?? memo.width ?? undefined;

  const getCurrentHeight = (memo: MemoListItem) =>
    resizeHeights[memo.id] ?? memo.height ?? undefined;

  return {
    syncTitleLayout,
    syncContentLayout,
    getTitleWidth,
    getContentHeight,
    getCurrentWidth,
    getCurrentHeight
  };
}
