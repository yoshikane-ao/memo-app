<script setup lang="ts">
import MemoList from '../../ui/MemoList/MemoList.vue';
import type {
  MemoListContainerEmits,
  MemoListContainerProps,
  SaveMemoPayload,
} from '../../ui/MemoList/types';
import { useMemoHistoryCommands } from '../../application/useMemoCommands';
import { getCommandErrorMessage } from '../../../../../../shared/command/commandResult';
import { useFeedbackStore } from '../../../../../../shared/feedback/useFeedbackStore';

const props = defineProps<MemoListContainerProps>();
const emit = defineEmits<MemoListContainerEmits>();
const commands = useMemoHistoryCommands();
const feedback = useFeedbackStore();

const handleReorderRequested = async (items: MemoListContainerProps['items']) => {
  if (!props.canReorder) {
    return;
  }

  const isSaved = await commands.reorderMemos(items);
  if (!isSaved.ok && isSaved.reason === 'error') {
    feedback.showError(getCommandErrorMessage(isSaved, 'Failed to save sort order.'));
  }
};

const handleSaveRequested = async (payload: SaveMemoPayload) => {
  const isSaved = await commands.updateMemo({
    id: payload.memoId,
    title: payload.title,
    content: payload.content,
    width: payload.width,
    height: payload.height,
  });

  if (!isSaved.ok && isSaved.reason === 'error') {
    feedback.showError(getCommandErrorMessage(isSaved, 'Failed to update memo.'));
  }
};

const handleTrashRequested = async (memoId: number) => {
  const confirmed = confirm('このメモをごみ箱に移動しますか？');
  if (!confirmed) {
    return;
  }

  const isMoved = await commands.moveMemoToTrash(memoId);
  if (!isMoved.ok && isMoved.reason === 'error') {
    feedback.showError(getCommandErrorMessage(isMoved, 'Failed to move memo to trash.'));
    return;
  }
};

const handleCopyError = (message: string) => {
  feedback.showError(message);
};
</script>

<template>
  <MemoList
    :items="items"
    :can-reorder="canReorder"
    @copy-error="handleCopyError"
    @reorder-requested="handleReorderRequested"
    @save-requested="handleSaveRequested"
    @trash-requested="handleTrashRequested"
    @tag-deleted="emit('tag-deleted', $event)"
  />
</template>
