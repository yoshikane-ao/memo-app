<script setup lang="ts">
import MemoList from "./MemoList.vue";
import type {
  MemoListContainerEmits,
  MemoListContainerProps,
  SaveMemoPayload,
} from "./types";
import { useMemoHistoryCommands } from "../../model/useMemoHistoryCommands";
import { useFeedbackStore } from "../../../../shared/feedback/useFeedbackStore";

const props = defineProps<MemoListContainerProps>();
const emit = defineEmits<MemoListContainerEmits>();
const commands = useMemoHistoryCommands();
const feedback = useFeedbackStore();

const handleReorderRequested = async (items: MemoListContainerProps["items"]) => {
  if (!props.canReorder) {
    return;
  }

  const isSaved = await commands.reorderMemos(items);
  if (!isSaved.ok && isSaved.reason === "error") {
    feedback.showError("Failed to save sort order.");
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

  if (!isSaved.ok && isSaved.reason === "error") {
    feedback.showError("Failed to update memo.");
  }
};

const handleDeleteRequested = async (memoId: number) => {
  const confirmed = confirm("Delete this memo?");
  if (!confirmed) {
    return;
  }

  const isDeleted = await commands.deleteMemo(memoId);
  if (!isDeleted.ok && isDeleted.reason === "error") {
    feedback.showError("Failed to delete memo.");
  }
};
</script>

<template>
  <MemoList
    :items="items"
    :canReorder="canReorder"
    @reorder-requested="handleReorderRequested"
    @save-requested="handleSaveRequested"
    @delete-requested="handleDeleteRequested"
    @tag-deleted="emit('tag-deleted', $event)"
  />
</template>
