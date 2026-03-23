import type { MemoListItem, MemoTextField } from '../types/memo-domain.types';
import type { MemoDeletedPayload } from '../memoDelete/types';
import type { MemoUpdatedPayload } from '../memoUpdate/types';
import type { MemoTagsUpdatedPayload, TagDeletedPayload } from '../../tagLogic/Types';

export const replaceMemoItems = (items: MemoListItem[]) => {
  return [...items];
};

export const prependMemoItem = (items: MemoListItem[], item: MemoListItem) => {
  return [item, ...items];
};

export const applySortedMemos = (items: MemoListItem[]) => {
  return items.map((memo, index) => ({
    ...memo,
    orderIndex: index
  }));
};

export const applyMemoFieldUpdate = (
  items: MemoListItem[],
  memoId: number,
  field: MemoTextField,
  value: string
) => {
  return items.map((memo) => {
    if (memo.id !== memoId) {
      return memo;
    }

    return {
      ...memo,
      [field]: value
    };
  });
};

export const applyMemoUpdate = (items: MemoListItem[], payload: MemoUpdatedPayload) => {
  return items.map((memo) => {
    if (memo.id !== payload.memoId) {
      return memo;
    }

    return {
      ...memo,
      title: payload.title,
      content: payload.content,
      initialTitle: payload.title,
      initialContent: payload.content,
      width: payload.width ?? memo.width,
      height: payload.height ?? memo.height
    };
  });
};

export const removeMemoById = (items: MemoListItem[], memoId: MemoDeletedPayload) => {
  return items.filter((memo) => memo.id !== memoId);
};

export const applyMemoTagsUpdate = (items: MemoListItem[], payload: MemoTagsUpdatedPayload) => {
  return items.map((memo) => {
    if (memo.id !== payload.memoId) {
      return memo;
    }

    return {
      ...memo,
      memo_tags: payload.tags.map((tag) => ({
        memo_id: payload.memoId,
        tag_id: tag.id,
        tag
      }))
    };
  });
};

export const removeTagFromMemoItems = (items: MemoListItem[], tagId: TagDeletedPayload) => {
  return items.map((memo) => ({
    ...memo,
    memo_tags: memo.memo_tags.filter((memoTag) => memoTag.tag.id !== tagId)
  }));
};
