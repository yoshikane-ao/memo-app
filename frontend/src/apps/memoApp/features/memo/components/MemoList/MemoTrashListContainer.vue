<script setup lang="ts">
import MemoTrashList from "./MemoTrashList.vue";
import type { MemoTrashListContainerProps } from "./types";
import { useMemoHistoryCommands } from "../../model/useMemoHistoryCommands";
import { getCommandErrorMessage } from "../../model/commandResult";
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
  const confirmed = confirm("Delete this memo forever?");
  if (!confirmed) {
    return;
  }

  const purged = await commands.purgeMemo(memoId);
  if (!purged.ok && purged.reason === "error") {
    feedback.showError(getCommandErrorMessage(purged, "Failed to permanently delete memo."));
  }
};
</script>

<template>
  <MemoTrashList
    :items="items"
    @restore-requested="handleRestoreRequested"
    @purge-requested="handlePurgeRequested"
  />
</template>
