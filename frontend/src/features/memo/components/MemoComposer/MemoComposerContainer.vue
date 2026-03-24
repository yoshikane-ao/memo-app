<script setup lang="ts">
import { useMemoStore } from "../../model/useMemoStore";
import MemoComposerForm from "./MemoComposerForm.vue";
import { useMemoComposerDraft } from "./useMemoComposerDraft";
import type { MemoComposerContainerEmits } from "./types";

const emit = defineEmits<MemoComposerContainerEmits>();

const memoStore = useMemoStore();
const {
  draft,
  selectedTagTitles,
  tagSelectionResetKey,
  isSubmitDisabled,
  updateTitle,
  updateContent,
  setSelectedTagTitles,
  resetDraft,
} = useMemoComposerDraft();

const handleSubmit = async () => {
  if (isSubmitDisabled.value) {
    return;
  }

  const createdMemo = await memoStore.createMemo({
    title: draft.title,
    content: draft.content,
    tags: selectedTagTitles.value,
  });

  if (!createdMemo) {
    window.alert("Failed to create memo.");
    return;
  }

  resetDraft();
  emit("memo-created", createdMemo.id);
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
    :tagSelectionResetKey="tagSelectionResetKey"
    @update:title="updateTitle"
    @update:content="updateContent"
    @update:selectedTitles="setSelectedTagTitles"
    @submit="handleSubmit"
    @tag-deleted="handleTagDeleted"
  />
</template>
