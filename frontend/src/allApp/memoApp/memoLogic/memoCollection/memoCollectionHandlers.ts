import type { MemoApiItem, MemoListItem } from '../types/memo-domain.types';
import type { MemoDeletedPayload } from '../memoDelete/types';
import type { MemoUpdatedPayload } from '../memoUpdate/types';
import type { MemoTagsUpdatedPayload, TagDeletedPayload } from '../../tagLogic/Types';
import { toMemoListItem } from './memoCollectionApi';

interface MemoCollectionHandlerDeps {
  replaceMemos: (items: MemoListItem[]) => void;
  prependMemo: (item: MemoListItem) => void;
  commitSortedMemos: (items: MemoListItem[]) => void;
  commitMemoUpdate: (payload: MemoUpdatedPayload) => void;
  removeMemo: (memoId: MemoDeletedPayload) => void;
  commitMemoTags: (payload: MemoTagsUpdatedPayload) => void;
  removeTagFromAllMemos: (tagId: TagDeletedPayload) => void;
}

export function useMemoCollectionHandlers({
  replaceMemos,
  prependMemo,
  commitSortedMemos,
  commitMemoUpdate,
  removeMemo,
  commitMemoTags,
  removeTagFromAllMemos
}: MemoCollectionHandlerDeps) {
  const handleItemsReplaced = (items: MemoListItem[]) => {
    replaceMemos(items);
  };

  const handleMemoCreated = (item: MemoApiItem) => {
    prependMemo(toMemoListItem(item));
  };

  const handleSortSaved = (items: MemoListItem[]) => {
    commitSortedMemos(items);
  };

  const handleMemoUpdated = (payload: MemoUpdatedPayload) => {
    commitMemoUpdate(payload);
  };

  const handleMemoDeleted = (memoId: MemoDeletedPayload) => {
    removeMemo(memoId);
  };

  const handleMemoTagsUpdated = (payload: MemoTagsUpdatedPayload) => {
    commitMemoTags(payload);
  };

  const handleTagDeleted = (tagId: TagDeletedPayload) => {
    removeTagFromAllMemos(tagId);
  };

  return {
    handleItemsReplaced,
    handleMemoCreated,
    handleSortSaved,
    handleMemoUpdated,
    handleMemoDeleted,
    handleMemoTagsUpdated,
    handleTagDeleted
  };
}
