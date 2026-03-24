<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useMemoHistoryCommands } from "../../../memo/model/useMemoHistoryCommands";
import { useFeedbackStore } from "../../../../shared/feedback/useFeedbackStore";
import TagPickerField from "./TagPickerField.vue";
import { useTagStore } from "../../model/useTagStore";
import type { TagItem, TagSelectionSelectEmits, TagSelectionSelectProps } from "../../model/tag.types";

const props = withDefaults(defineProps<TagSelectionSelectProps>(), {
  resetKey: 0,
});
const emit = defineEmits<TagSelectionSelectEmits>();

const tagStore = useTagStore();
const commands = useMemoHistoryCommands();
const feedback = useFeedbackStore();
const isMounted = ref(false);

const addSelectedTag = (tags: TagItem[], tag: TagItem) => {
  if (tags.some((currentTag) => currentTag.id === tag.id)) {
    return tags;
  }

  return [...tags, tag];
};

const removeSelectedTag = (tags: TagItem[], tagId: number) =>
  tags.filter((currentTag) => currentTag.id !== tagId);

onMounted(() => {
  isMounted.value = true;
  void tagStore.ensureLoaded();
});

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
  const createdTag = await commands.createTag({ title });

  if (!createdTag.ok) {
    if (createdTag.reason === "error") {
      feedback.showError("Failed to create tag.");
    }
    return;
  }

  emit("update:selectedTags", addSelectedTag(props.selectedTags, createdTag.value));
};

const handleDeleteTag = async (tag: TagItem) => {
  const confirmed = window.confirm(`Delete #${tag.title} from the system?`);

  if (!confirmed) {
    return;
  }

  const success = await commands.deleteTag(tag.id);

  if (!success.ok) {
    if (success.reason === "error") {
      feedback.showError("Failed to delete tag.");
    }
    return;
  }

  emit("update:selectedTags", removeSelectedTag(props.selectedTags, tag.id));
  emit("tag-deleted", tag.id);
};

watch(
  () => tagStore.items,
  (tags) => {
    const validTagIds = tags.map((tag) => tag.id);
    const filteredTags = props.selectedTags.filter((tag) => validTagIds.includes(tag.id));

    if (!isMounted.value || filteredTags.length === props.selectedTags.length) {
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
    :resetKey="resetKey"
    @toggle-tag="handleToggleTag"
    @remove-tag="handleRemoveTag"
    @create-tag="void handleCreateTag($event)"
    @delete-tag="void handleDeleteTag($event)"
  />
</template>
