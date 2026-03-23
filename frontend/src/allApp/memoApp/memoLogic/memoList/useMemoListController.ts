import { useMemoCollection } from '../memoCollection/memoCollection';
import type { MemoDeletedPayload } from '../memoDelete/types';
import type { MemoUpdatedPayload } from '../memoUpdate/types';
import type { MemoTagsUpdatedPayload, TagDeletedPayload } from '../../tagLogic/Types';
import type { MemoListEmits, MemoListProps } from './types';

export function useMemoListController(props: MemoListProps, emit: MemoListEmits) {
  const { updateMemoField } = useMemoCollection();

  const updateItems = (items: MemoListProps['items']) => {
    if (!props.canSort) {
      return;
    }

    emit('update:items', items);
  };

  const handleSorted = (items: MemoListProps['items']) => {
    if (!props.canSort) {
      return;
    }

    emit('sort-saved', items);
  };

  const handleUpdated = (payload: MemoUpdatedPayload) => {
    emit('memo-updated', payload);
  };

  const handleDeleted = (memoId: MemoDeletedPayload) => {
    emit('memo-deleted', memoId);
  };

  const handleMemoTagsUpdated = (payload: MemoTagsUpdatedPayload) => {
    emit('memo-tags-updated', payload);
  };

  const handleTagDeleted = (tagId: TagDeletedPayload) => {
    emit('tag-deleted', tagId);
  };

  const handleMemoFieldUpdate = (memoId: number, field: 'title' | 'content', value: string) => {
    updateMemoField(memoId, field, value);
  };

  return {
    updateItems,
    handleSorted,
    handleUpdated,
    handleDeleted,
    handleMemoTagsUpdated,
    handleTagDeleted,
    handleMemoFieldUpdate
  };
}
