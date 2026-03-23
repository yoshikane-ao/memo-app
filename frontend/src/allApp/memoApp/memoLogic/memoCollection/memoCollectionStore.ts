import type { MemoTextField } from '../types/memo-domain.types';
import type { MemoDeletedPayload } from '../memoDelete/types';
import type { MemoUpdatedPayload } from '../memoUpdate/types';
import type { MemoTagsUpdatedPayload, TagDeletedPayload } from '../../tagLogic/Types';
import { memos } from './memoCollectionState';
import {
  applyMemoFieldUpdate,
  applyMemoTagsUpdate,
  applyMemoUpdate,
  applySortedMemos,
  prependMemoItem,
  removeMemoById,
  removeTagFromMemoItems,
  replaceMemoItems
} from './memoCollectionMutations';

export function useMemoCollectionStore() {
  const replaceMemos = (items: typeof memos.value) => {
    memos.value = replaceMemoItems(items);
  };

  const prependMemo = (item: (typeof memos.value)[number]) => {
    memos.value = prependMemoItem(memos.value, item);
  };

  const commitSortedMemos = (items: typeof memos.value) => {
    memos.value = applySortedMemos(items);
  };

  const updateMemoField = (memoId: number, field: MemoTextField, value: string) => {
    memos.value = applyMemoFieldUpdate(memos.value, memoId, field, value);
  };

  const commitMemoUpdate = (payload: MemoUpdatedPayload) => {
    memos.value = applyMemoUpdate(memos.value, payload);
  };

  const removeMemo = (memoId: MemoDeletedPayload) => {
    memos.value = removeMemoById(memos.value, memoId);
  };

  const commitMemoTags = (payload: MemoTagsUpdatedPayload) => {
    memos.value = applyMemoTagsUpdate(memos.value, payload);
  };

  const removeTagFromAllMemos = (tagId: TagDeletedPayload) => {
    memos.value = removeTagFromMemoItems(memos.value, tagId);
  };

  return {
    memos,
    replaceMemos,
    prependMemo,
    commitSortedMemos,
    updateMemoField,
    commitMemoUpdate,
    removeMemo,
    commitMemoTags,
    removeTagFromAllMemos
  };
}
