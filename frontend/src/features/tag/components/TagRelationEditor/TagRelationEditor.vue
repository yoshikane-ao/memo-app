<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type {
  MemoTagSource,
  MemoTagsUpdatedPayload,
  TagItem,
  TagRelationEditorEmits,
  TagRelationEditorProps,
} from "../../model/tag.types";
import { useMemoHistoryCommands } from "../../../memo/model/useMemoHistoryCommands";
import { useMemoStore } from "../../../memo/model/useMemoStore";
import { useFeedbackStore } from "../../../../shared/feedback/useFeedbackStore";
import { useTagStore } from "../../model/useTagStore";
import TagPickerField from "../TagSelection/TagPickerField.vue";

const props = defineProps<TagRelationEditorProps>();
const emit = defineEmits<TagRelationEditorEmits>();

const commands = useMemoHistoryCommands();
const memoStore = useMemoStore();
const feedback = useFeedbackStore();
const tagStore = useTagStore();
const localTags = ref<TagItem[]>([...props.tags]);

const memoSources = computed<MemoTagSource[]>(() =>
  memoStore.items
    .filter((memo) => memo.id !== props.memoId)
    .map((memo) => ({
      memoId: memo.id,
      title: memo.title,
      content: memo.content,
      tags: memo.memo_tags.map((memoTag) => ({
        id: memoTag.tag.id,
        title: memoTag.tag.title,
      })),
    }))
);

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

const handleApplyTagsFromMemo = async (source: MemoTagSource) => {
  const success = await commands.replaceMemoTags(props.memoId, source.tags);

  if (!success.ok) {
    if (success.reason === "error") {
      feedback.showError("Failed to apply tags from memo.");
    }
    return;
  }

  const nextTags = source.tags.map((tag) => ({
    id: tag.id,
    title: tag.title,
  }));
  localTags.value = nextTags;
  emitMemoTagsUpdated(nextTags);
};

onMounted(() => {
  void tagStore.ensureLoaded();
  void memoStore.ensureLoaded();
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
      :memoSources="memoSources"
      @toggle-tag="void handleTagToggle($event)"
      @remove-tag="void handleTagRemove($event)"
      @create-tag="void handleCreateTag($event)"
      @delete-tag="void handleTagDeleted($event)"
      @apply-tags-from-memo="void handleApplyTagsFromMemo($event)"
    />
  </div>
</template>
