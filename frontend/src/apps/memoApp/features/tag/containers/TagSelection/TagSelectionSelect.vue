<script setup lang="ts">
import { ref, watch } from "vue";
import { getCommandErrorMessage } from "../../../../../../shared/command/commandResult";
import { useFeedbackStore } from "../../../../../../shared/feedback/useFeedbackStore";
import { useMemoTagSources } from "../../application/useMemoTagSources";
import { useTagCommands } from "../../application/useTagCommands";
import TagPickerField from "../../ui/TagSelection/TagPickerField.vue";
import { useTagStore } from "../../model/useTagStore";
import type {
  MemoTagSource,
  TagItem,
  TagSelectionSelectEmits,
  TagSelectionSelectProps,
} from "../../types";

const props = withDefaults(defineProps<TagSelectionSelectProps>(), {
  resetKey: 0,
});
const emit = defineEmits<TagSelectionSelectEmits>();

const tagStore = useTagStore();
const commands = useTagCommands();
const feedback = useFeedbackStore();
const isCreatingTag = ref(false);

const addSelectedTag = (tags: TagItem[], tag: TagItem) => {
  if (tags.some((currentTag) => currentTag.id === tag.id)) {
    return tags;
  }

  return [...tags, tag];
};

const removeSelectedTag = (tags: TagItem[], tagId: number) =>
  tags.filter((currentTag) => currentTag.id !== tagId);

const memoSources = useMemoTagSources();

const handleToggleTag = (tag: TagItem) => {
  const nextTags = props.selectedTags.some((currentTag) => currentTag.id === tag.id)
    ? removeSelectedTag(props.selectedTags, tag.id)
    : addSelectedTag(props.selectedTags, tag);

  emit("update:selectedTags", nextTags);
};

const handleRemoveTag = (tag: TagItem) => {
  emit("update:selectedTags", removeSelectedTag(props.selectedTags, tag.id));
};

const handleCreateTag = async (title: string) => {
  if (isCreatingTag.value) {
    return;
  }

  isCreatingTag.value = true;

  try {
    const createdTag = await commands.createTag({ title });

    if (!createdTag.ok) {
      if (createdTag.reason === "error") {
        feedback.showError(getCommandErrorMessage(createdTag, "Failed to create tag."));
      }
      return;
    }

    emit("update:selectedTags", addSelectedTag(props.selectedTags, createdTag.value));
  } finally {
    isCreatingTag.value = false;
  }
};

const handleDeleteTag = async (tag: TagItem) => {
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

  emit("update:selectedTags", removeSelectedTag(props.selectedTags, tag.id));
  emit("tag-deleted", tag.id);
};

const handleApplyTagsFromMemo = (source: MemoTagSource) => {
  emit(
    "update:selectedTags",
    source.tags.map((tag) => ({
      id: tag.id,
      title: tag.title,
    }))
  );
};

watch(
  () => tagStore.items,
  (tags) => {
    const validTagIds = tags.map((tag) => tag.id);
    const filteredTags = props.selectedTags.filter((tag) => validTagIds.includes(tag.id));

    if (filteredTags.length === props.selectedTags.length) {
      return;
    }

    emit("update:selectedTags", filteredTags);
  },
  { deep: true }
);
</script>

<template>
  <TagPickerField
    :selectedTags="selectedTags"
    :availableTags="tagStore.items"
    :memoSources="memoSources"
    :resetKey="resetKey"
    :isCreating="isCreatingTag"
    @toggle-tag="handleToggleTag"
    @remove-tag="handleRemoveTag"
    @create-tag="void handleCreateTag($event)"
    @delete-tag="void handleDeleteTag($event)"
    @apply-tags-from-memo="handleApplyTagsFromMemo"
  />
</template>
