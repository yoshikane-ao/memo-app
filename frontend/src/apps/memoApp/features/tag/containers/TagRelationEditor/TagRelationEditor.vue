<script setup lang="ts">
import { computed, ref } from "vue";
import { getCommandErrorMessage } from "../../../../../../shared/command/commandResult";
import { useFeedbackStore } from "../../../../../../shared/feedback/useFeedbackStore";
import { useMemoTagSources } from "../../application/useMemoTagSources";
import { useTagCommands } from "../../application/useTagCommands";
import type {
  MemoTagSource,
  MemoTagsUpdatedPayload,
  TagItem,
  TagRelationEditorEmits,
  TagRelationEditorProps,
} from "../../types";
import { useTagStore } from "../../model/useTagStore";
import TagPickerField from "../../ui/TagSelection/TagPickerField.vue";

const props = defineProps<TagRelationEditorProps>();
const emit = defineEmits<TagRelationEditorEmits>();

const commands = useTagCommands();
const feedback = useFeedbackStore();
const tagStore = useTagStore();
const isCreatingTag = ref(false);

const toUniqueTags = (tags: readonly TagItem[]) => {
  const seenTagIds = new Set<number>();
  const nextTags: TagItem[] = [];

  for (const tag of tags) {
    if (seenTagIds.has(tag.id)) {
      continue;
    }

    seenTagIds.add(tag.id);
    nextTags.push({
      id: tag.id,
      title: tag.title,
    });
  }

  return nextTags;
};

const selectedTags = computed(() => toUniqueTags(props.tags));

const memoSources = useMemoTagSources({
  excludeMemoId: () => props.memoId,
});

const emitMemoTagsUpdated = (tags: TagItem[] = selectedTags.value) => {
  const payload: MemoTagsUpdatedPayload = {
    memoId: props.memoId,
    tags: toUniqueTags(tags),
  };
  emit("memo-tags-updated", payload);
};

const handleTagToggle = async (tag: TagItem) => {
  const isSelected = selectedTags.value.some((currentTag) => currentTag.id === tag.id);
  const success = isSelected
    ? await commands.removeTagFromMemo(props.memoId, tag)
    : await commands.addTagToMemo(props.memoId, tag);

  if (!success.ok) {
    if (success.reason === "error") {
      feedback.showError(
        getCommandErrorMessage(success, isSelected ? "Failed to remove tag." : "Failed to add tag.")
      );
    }
    return;
  }

  const nextTags = isSelected
    ? selectedTags.value.filter((currentTag) => currentTag.id !== tag.id)
    : [...selectedTags.value, tag];
  emitMemoTagsUpdated(nextTags);
};

const handleTagRemove = async (tag: TagItem) => {
  if (!selectedTags.value.some((currentTag) => currentTag.id === tag.id)) {
    return;
  }

  await handleTagToggle(tag);
};

const handleCreateTag = async (title: string) => {
  if (isCreatingTag.value) {
    return;
  }

  isCreatingTag.value = true;

  try {
    const createdTag = await commands.createTag({
      memoId: props.memoId,
      title,
    });

    if (!createdTag.ok) {
      if (createdTag.reason === "error") {
        feedback.showError(getCommandErrorMessage(createdTag, "Failed to create tag."));
      }
      return;
    }

    emitMemoTagsUpdated([...selectedTags.value, createdTag.value]);
  } finally {
    isCreatingTag.value = false;
  }
};

const handleTagDeleted = async (tag: TagItem) => {
  const confirmed = window.confirm(`Delete #${tag.title} from the system?`);

  if (!confirmed) {
    return;
  }

  const success = await commands.deleteTag(tag.id);

  if (!success.ok) {
    if (success.reason === "error") {
      feedback.showError(getCommandErrorMessage(success, "Failed to delete tag."));
    }
    return;
  }

  const nextTags = selectedTags.value.filter((currentTag) => currentTag.id !== tag.id);
  emitMemoTagsUpdated(nextTags);
  emit("tag-deleted", tag.id);
};

const handleApplyTagsFromMemo = async (source: MemoTagSource) => {
  const success = await commands.replaceMemoTags(props.memoId, source.tags);

  if (!success.ok) {
    if (success.reason === "error") {
      feedback.showError(getCommandErrorMessage(success, "Failed to apply tags from memo."));
    }
    return;
  }

  const nextTags = source.tags.map((tag) => ({
    id: tag.id,
    title: tag.title,
  }));
  emitMemoTagsUpdated(nextTags);
};
</script>

<template>
  <div class="tag-row">
    <TagPickerField
      :selectedTags="selectedTags"
      :availableTags="tagStore.items"
      :memoSources="memoSources"
      :isCreating="isCreatingTag"
      @toggle-tag="void handleTagToggle($event)"
      @remove-tag="void handleTagRemove($event)"
      @create-tag="void handleCreateTag($event)"
      @delete-tag="void handleTagDeleted($event)"
      @apply-tags-from-memo="void handleApplyTagsFromMemo($event)"
    />
  </div>
</template>
