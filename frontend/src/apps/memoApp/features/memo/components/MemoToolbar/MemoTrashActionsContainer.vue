<script setup lang="ts">
import { computed, ref } from "vue";
import MemoTrashActionsBar from "./MemoTrashActionsBar.vue";
import { useMemoHistoryCommands } from "../../model/useMemoHistoryCommands";
import { useMemoStore } from "../../model/useMemoStore";
import { getCommandErrorMessage } from "../../model/commandResult";
import { useFeedbackStore } from "../../../../../../shared/feedback/useFeedbackStore";

const commands = useMemoHistoryCommands();
const memoStore = useMemoStore();
const feedback = useFeedbackStore();
const isBusy = ref(false);
const trashCount = computed(() => memoStore.trashItems.length);

const handlePurgeAllRequested = async () => {
  if (isBusy.value || trashCount.value === 0) {
    return;
  }

  const confirmed = window.confirm("Delete all trashed memos forever?");
  if (!confirmed) {
    return;
  }

  isBusy.value = true;

  try {
    const purged = await commands.purgeAllTrash();
    if (!purged.ok && purged.reason === "error") {
      feedback.showError(getCommandErrorMessage(purged, "Failed to permanently delete trash."));
      return;
    }

    if (!purged.ok) {
      return;
    }

    const deletedCount = purged.value;
    feedback.showInfo(`Deleted ${deletedCount} trashed memo${deletedCount === 1 ? "" : "s"}.`);
  } finally {
    isBusy.value = false;
  }
};
</script>

<template>
  <MemoTrashActionsBar
    :trashCount="trashCount"
    :isBusy="isBusy"
    @purge-all-requested="void handlePurgeAllRequested()"
  />
</template>
