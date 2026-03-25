<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useMemoHistoryCommands } from "../../../memo/model/useMemoHistoryCommands";
import { getCommandErrorMessage } from "../../../memo/model/commandResult";
import { useMemoStore } from "../../../memo/model/useMemoStore";
import { useFeedbackStore } from "../../../../../../shared/feedback/useFeedbackStore";
import TagPickerField from "./TagPickerField.vue";
import { useTagStore } from "../../model/useTagStore";
import type {
  MemoTagSource,
  TagItem,
  TagSelectionSelectEmits,
  TagSelectionSelectProps,
} from "../../model/tag.types";

const props = withDefaults(defineProps<TagSelectionSelectProps>(), {
  resetKey: 0,
});
const emit = defineEmits<TagSelectionSelectEmits>();

const tagStore = useTagStore();
const memoStore = useMemoStore();
const commands = useMemoHistoryCommands();
const feedback = useFeedbackStore();
const isMounted = ref(false);
const isCreatingTag = ref(false);

const addSelectedTag = (tags: TagItem[], tag: TagItem) => {
  if (tags.some((currentTag) => currentTag.id === tag.id)) {
    return tags;
  }

  return [...tags, tag];
};

const removeSelectedTag = (tags: TagItem[], tagId: number) =>
  tags.filter((currentTag) => currentTag.id !== tagId);

const memoSources = computed<MemoTagSource[]>(() =>
  memoStore.items.map((memo) => ({
    memoId: memo.id,
    title: memo.title,
    content: memo.content,
    tags: memo.memo_tags.map((memoTag) => ({
      id: memoTag.tag.id,
      title: memoTag.tag.title,
    })),
  }))
);

onMounted(() => {
  isMounted.value = true;
  void tagStore.ensureLoaded();
  void memoStore.ensureLoaded();
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
