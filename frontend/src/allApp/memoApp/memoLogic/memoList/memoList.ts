import { reactive } from 'vue';
import type { MemoListItem, MemoTextField, ResizeDirection } from '../Types';

export function useMemoListState() {
  const resizeWidths = reactive<Record<number, number>>({});
  const resizeHeights = reactive<Record<number, number>>({});

  const updateMemoField = (memo: MemoListItem, field: MemoTextField, event: Event) => {
    const target = event.target;
    if (target instanceof HTMLTextAreaElement) {
      memo[field] = target.value;
    }
  };

  const checkResize = (memoId: number, event: MouseEvent, direction: ResizeDirection) => {
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) {
      return;
    }

    const size = direction === 'width' ? target.style.width : target.style.height;
    if (!size) {
      return;
    }

    const parsedSize = Number.parseInt(size, 10);
    if (Number.isNaN(parsedSize)) {
      return;
    }

    if (direction === 'width') {
      resizeWidths[memoId] = parsedSize;
      return;
    }

    resizeHeights[memoId] = parsedSize;
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
    updateMemoField,
    checkResize,
    getTitleWidth,
    getContentHeight,
    getCurrentWidth,
    getCurrentHeight
  };
}
