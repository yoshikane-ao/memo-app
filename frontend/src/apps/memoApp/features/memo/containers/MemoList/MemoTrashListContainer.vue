<script setup lang="ts">
import MemoTrashList from "../../ui/MemoList/MemoTrashList.vue";
import type { MemoTrashListContainerProps } from "../../ui/MemoList/types";
import { useMemoHistoryCommands } from "../../application/useMemoCommands";
import { getCommandErrorMessage } from "../../../../../../shared/command/commandResult";
import { useFeedbackStore } from "../../../../../../shared/feedback/useFeedbackStore";

defineProps<MemoTrashListContainerProps>();
const commands = useMemoHistoryCommands();
const feedback = useFeedbackStore();

const handleRestoreRequested = async (memoId: number) => {
  const restored = await commands.restoreMemoFromTrash(memoId);

  if (!restored.ok && restored.reason === "error") {
    feedback.showError(getCommandErrorMessage(restored, "Failed to restore memo."));
  }
};

const handlePurgeRequested = async (memoId: number) => {
  const confirmed = confirm("このメモを完全に削除しますか？");
  if (!confirmed) {
    return;
  }

  const purged = await commands.purgeMemo(memoId);
  if (!purged.ok && purged.reason === "error") {
    feedback.showError(getCommandErrorMessage(purged, "Failed to permanently delete memo."));
  }
};

const handleCopyError = (message: string) => {
  feedback.showError(message);
};
</script>

<template>
  <MemoTrashList
    :items="items"
    @copy-error="handleCopyError"
    @restore-requested="handleRestoreRequested"
    @purge-requested="handlePurgeRequested"
  />
</template>
