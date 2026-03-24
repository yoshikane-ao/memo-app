<script setup lang="ts">
import { computed, ref, watch } from "vue";
import TagBadgeList from "../TagBadgeList.vue";
import TagSearchPopover from "../TagSearchPopover.vue";
import { useTagStore } from "../../model/useTagStore";
import type {
  MemoTagsUpdatedPayload,
  TagItem,
  TagRelationEditorEmits,
  TagRelationEditorProps,
} from "../../model/tag.types";

const props = defineProps<TagRelationEditorProps>();
const emit = defineEmits<TagRelationEditorEmits>();

const tagStore = useTagStore();
const showTagSearch = ref(false);
const localTags = ref<TagItem[]>([...props.tags]);

const linkedTagIds = computed(() => localTags.value.map((tag) => tag.id));

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

const removeLocalTag = (tag: TagItem) => {
  localTags.value = localTags.value.filter((currentTag) => currentTag.id !== tag.id);
};

const handleTagRemove = async (tag: TagItem) => {
  const success = await tagStore.unlinkTagFromMemo(props.memoId, tag.id);

  if (!success) {
    window.alert("Failed to remove tag.");
    return;
  }

  const nextTags = localTags.value.filter((currentTag) => currentTag.id !== tag.id);
  localTags.value = nextTags;
  emitMemoTagsUpdated(nextTags);
};

const handleTagAdded = (tag: TagItem) => {
  addLocalTag(tag);
  emitMemoTagsUpdated();
};

const handleTagRemoved = (tag: TagItem) => {
  removeLocalTag(tag);
  emitMemoTagsUpdated();
};

const handleTagDeleted = (tag: TagItem) => {
  removeLocalTag(tag);
  emit("tag-deleted", tag.id);
};

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
    <TagBadgeList :tags="localTags" @remove="handleTagRemove" />

    <button class="tag-add-btn" @click.stop="showTagSearch = !showTagSearch">+ Tag</button>

    <TagSearchPopover
      v-if="showTagSearch"
      :memoId="memoId"
      :linkedTagIds="linkedTagIds"
      @tag-added="handleTagAdded"
      @tag-removed="handleTagRemoved"
      @tag-deleted="handleTagDeleted"
      @close="showTagSearch = false"
    />
  </div>
</template>
