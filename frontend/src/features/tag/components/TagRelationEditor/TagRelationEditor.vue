<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type {
  MemoTagsUpdatedPayload,
  TagItem,
  TagRelationEditorEmits,
  TagRelationEditorProps,
} from "../../model/tag.types";
import { useMemoHistoryCommands } from "../../../memo/model/useMemoHistoryCommands";
import { useFeedbackStore } from "../../../../shared/feedback/useFeedbackStore";
import { useTagStore } from "../../model/useTagStore";
import TagPickerField from "../TagSelection/TagPickerField.vue";

const props = defineProps<TagRelationEditorProps>();
const emit = defineEmits<TagRelationEditorEmits>();

const commands = useMemoHistoryCommands();
const feedback = useFeedbackStore();
const tagStore = useTagStore();
const localTags = ref<TagItem[]>([...props.tags]);

const emitMemoTagsUpdated = (tags: TagItem[] = localTags.value) => {
  const payload: MemoTagsUpdatedPayload = {
    memoId: props.memoId,
    tags: [...tags],
  };
  emit("memo-tags-updated", payload);
};

const addLocalTag = (tag: TagItem) => {
  if (!localTags.value.some((currentTag) => currentTag.id === tag.id)) {
    localTags.value = [...localTags.value, tag];
  }
};

const handleTagToggle = async (tag: TagItem) => {
  const isSelected = localTags.value.some((currentTag) => currentTag.id === tag.id);
  const success = isSelected
    ? await commands.removeTagFromMemo(props.memoId, tag)
    : await commands.addTagToMemo(props.memoId, tag);

  if (!success.ok) {
    if (success.reason === "error") {
      feedback.showError(isSelected ? "Failed to remove tag." : "Failed to add tag.");
    }
    return;
  }

  const nextTags = isSelected
    ? localTags.value.filter((currentTag) => currentTag.id !== tag.id)
    : [...localTags.value, tag];

  localTags.value = nextTags;
  emitMemoTagsUpdated(nextTags);
};

const handleTagRemove = async (tag: TagItem) => {
  if (!localTags.value.some((currentTag) => currentTag.id === tag.id)) {
    return;
  }

  await handleTagToggle(tag);
};

const handleCreateTag = async (title: string) => {
  const createdTag = await commands.createTag({
    memoId: props.memoId,
    title,
  });

  if (!createdTag.ok) {
    if (createdTag.reason === "error") {
      feedback.showError("Failed to create tag.");
    }
    return;
  }

  addLocalTag(createdTag.value);
  emitMemoTagsUpdated();
};

const handleTagDeleted = async (tag: TagItem) => {
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

  const nextTags = localTags.value.filter((currentTag) => currentTag.id !== tag.id);
  localTags.value = nextTags;
  emitMemoTagsUpdated(nextTags);
  emit("tag-deleted", tag.id);
};

onMounted(() => {
  void tagStore.ensureLoaded();
});

watch(
  () => props.tags,
  (value) => {
    localTags.value = [...value];
  },
  { deep: true }
);
</script>

<template>
  <div class="tag-row">
    <TagPickerField
      :selectedTags="localTags"
      :availableTags="tagStore.items"
      @toggle-tag="void handleTagToggle($event)"
      @remove-tag="void handleTagRemove($event)"
      @create-tag="void handleCreateTag($event)"
      @delete-tag="void handleTagDeleted($event)"
    />
  </div>
</template>
