<script setup lang="ts">
import MemoComposerForm from "./MemoComposerForm.vue";
import { useMemoComposerDraft } from "./useMemoComposerDraft";
import type { MemoComposerContainerEmits } from "./types";
import { useMemoHistoryCommands } from "../../model/useMemoHistoryCommands";
import { getCommandErrorMessage } from "../../model/commandResult";
import { useFeedbackStore } from "../../../../../../shared/feedback/useFeedbackStore";

const emit = defineEmits<MemoComposerContainerEmits>();

const commands = useMemoHistoryCommands();
const feedback = useFeedbackStore();
const {
  draft,
  selectedTags,
  tagSelectionResetKey,
  isSubmitDisabled,
  updateTitle,
  updateContent,
  setSelectedTags,
  resetDraft,
} = useMemoComposerDraft();

const handleSubmit = async () => {
  if (isSubmitDisabled.value) {
    return;
  }

  const createdMemo = await commands.createMemo({
    title: draft.title,
    content: draft.content,
    tags: selectedTags.value.map((tag) => tag.title),
  });

  if (!createdMemo.ok) {
    if (createdMemo.reason === "error") {
      feedback.showError(getCommandErrorMessage(createdMemo, "Failed to create memo."));
    }
    return;
  }

  resetDraft();
  emit("memo-created", createdMemo.value.id);
};

const handleTagDeleted = (tagId: number) => {
  emit("tag-deleted", tagId);
};
</script>

<template>
  <MemoComposerForm
    :title="draft.title"
    :content="draft.content"
    :isSubmitDisabled="isSubmitDisabled"
    :selectedTags="selectedTags"
    :tagSelectionResetKey="tagSelectionResetKey"
    @update:title="updateTitle"
    @update:content="updateContent"
    @update:selectedTags="setSelectedTags"
    @submit="handleSubmit"
    @tag-deleted="handleTagDeleted"
  />
</template>
