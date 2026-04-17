<script setup lang="ts">
import { watch } from "vue";
import MemoComposerForm from "../../ui/MemoComposer/MemoComposerForm.vue";
import type { MemoComposerContainerEmits } from "../../ui/MemoComposer/types";
import { useMemoComposerDraft } from "./useMemoComposerDraft";
import { useMemoHistoryCommands } from "../../application/useMemoCommands";
import { useMemoComposerDefaultsStore } from "../../model/useMemoComposerDefaultsStore";
import { getCommandErrorMessage } from "../../../../../../shared/command/commandResult";
import { useFeedbackStore } from "../../../../../../shared/feedback/useFeedbackStore";
import { useTagStore, type TagItem } from "../../../tag";

const emit = defineEmits<MemoComposerContainerEmits>();

const commands = useMemoHistoryCommands();
const feedback = useFeedbackStore();
const tagStore = useTagStore();
const defaults = useMemoComposerDefaultsStore();

const getTagTitles = (tags: TagItem[]) => tags.map((tag) => tag.title);

const resolveFixedTags = () => {
  const tagMap = new Map(tagStore.items.map((tag) => [tag.title, tag]));

  return defaults.fixedTagTitles.flatMap((title) => {
    const tag = tagMap.get(title);
    return tag ? [{ ...tag }] : [];
  });
};

const {
  draft,
  selectedTags,
  tagSelectionResetKey,
  isSubmitDisabled,
  updateTitle,
  updateContent,
  setSelectedTags,
  resetDraft,
} = useMemoComposerDraft({
  initialSelectedTags: resolveFixedTags(),
});

const syncFixedTags = (tags: TagItem[]) => {
  if (!defaults.keepTags) {
    return;
  }

  defaults.setFixedTagTitles(getTagTitles(tags));
};

const handleSelectedTagsUpdate = (tags: TagItem[]) => {
  setSelectedTags(tags);
  syncFixedTags(tags);
};

const handleKeepTagsUpdate = (enabled: boolean) => {
  defaults.setKeepTags(enabled, getTagTitles(selectedTags.value));

  if (!enabled) {
    return;
  }

  handleSelectedTagsUpdate(resolveFixedTags());
};

watch(
  () => tagStore.items,
  () => {
    if (!defaults.keepTags) {
      return;
    }

    const resolvedFixedTags = resolveFixedTags();
    const currentTitles = getTagTitles(selectedTags.value);

    if (currentTitles.length === 0 && resolvedFixedTags.length > 0) {
      setSelectedTags(resolvedFixedTags);
    }
  },
  { deep: true, immediate: true }
);

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

  resetDraft(defaults.keepTags ? selectedTags.value : []);
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
    :keepTags="defaults.keepTags"
    @update:title="updateTitle"
    @update:content="updateContent"
    @update:selectedTags="handleSelectedTagsUpdate"
    @update:keepTags="handleKeepTagsUpdate"
    @submit="handleSubmit"
    @tag-deleted="handleTagDeleted"
  />
</template>
