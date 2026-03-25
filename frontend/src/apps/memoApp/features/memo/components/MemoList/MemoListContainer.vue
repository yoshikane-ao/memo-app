<script setup lang="ts">
import { useRouter } from "vue-router";
import MemoList from "./MemoList.vue";
import type {
  MemoListContainerEmits,
  MemoListContainerProps,
  SaveMemoPayload,
} from "./types";
import { useMemoHistoryCommands } from "../../model/useMemoHistoryCommands";
import { getCommandErrorMessage } from "../../model/commandResult";
import { memoPaths } from "../../../../routes";
import { useFeedbackStore } from "../../../../../../shared/feedback/useFeedbackStore";

const props = defineProps<MemoListContainerProps>();
const emit = defineEmits<MemoListContainerEmits>();
const commands = useMemoHistoryCommands();
const feedback = useFeedbackStore();
const router = useRouter();

const handleReorderRequested = async (items: MemoListContainerProps["items"]) => {
  if (!props.canReorder) {
    return;
  }

  const isSaved = await commands.reorderMemos(items);
  if (!isSaved.ok && isSaved.reason === "error") {
    feedback.showError(getCommandErrorMessage(isSaved, "Failed to save sort order."));
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
    feedback.showError(getCommandErrorMessage(isSaved, "Failed to update memo."));
  }
};

const handleTrashRequested = async (memoId: number) => {
  const confirmed = confirm("Move this memo to trash?");
  if (!confirmed) {
    return;
  }

  const isMoved = await commands.moveMemoToTrash(memoId);
  if (!isMoved.ok && isMoved.reason === "error") {
    feedback.showError(getCommandErrorMessage(isMoved, "Failed to move memo to trash."));
    return;
  }

  await router.push(memoPaths.trash);
};
</script>

<template>
  <MemoList
    :items="items"
    :canReorder="canReorder"
    @reorder-requested="handleReorderRequested"
    @save-requested="handleSaveRequested"
    @trash-requested="handleTrashRequested"
    @tag-deleted="emit('tag-deleted', $event)"
  />
</template>
