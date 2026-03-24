<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import TagBadgeList from "../TagBadgeList.vue";
import TagSearchPopover from "../TagSearchPopover.vue";
import { useTagStore } from "../../model/useTagStore";
import type { TagItem, TagSelectionSelectEmits, TagSelectionSelectProps } from "../../model/tag.types";

const props = withDefaults(defineProps<TagSelectionSelectProps>(), {
  resetKey: 0,
});
const emit = defineEmits<TagSelectionSelectEmits>();

const tagStore = useTagStore();
const showTagSearch = ref(false);
const selectedTags = ref<TagItem[]>([]);

const addTag = (tag: TagItem) => {
  if (!selectedTags.value.some((currentTag) => currentTag.id === tag.id)) {
    selectedTags.value = [...selectedTags.value, tag];
  }
};

const removeTag = (tag: TagItem) => {
  selectedTags.value = selectedTags.value.filter((currentTag) => currentTag.id !== tag.id);
};

const closeTagSearch = () => {
  showTagSearch.value = false;
};

const resetSelection = () => {
  selectedTags.value = [];
  showTagSearch.value = false;
};

onMounted(() => {
  void tagStore.ensureLoaded();
});

watch(
  selectedTags,
  (value) => {
    emit(
      "update:selectedTitles",
      value.map((tag) => tag.title)
    );
  },
  { deep: true, immediate: true }
);

watch(
  () => props.resetKey,
  () => {
    resetSelection();
  }
);

watch(
  () => tagStore.items,
  (tags) => {
    const validTagIds = tags.map((tag) => tag.id);
    selectedTags.value = selectedTags.value.filter((tag) => validTagIds.includes(tag.id));
  },
  { deep: true }
);
</script>

<template>
  <div class="tag-selection-field">
    <div class="tag-dropdown-wrapper">
      <button class="tag-add-btn" title="Add tag" @click.stop="showTagSearch = !showTagSearch">
        + Tag
      </button>

      <TagSearchPopover
        v-if="showTagSearch"
        :linkedTagIds="selectedTags.map((tag) => tag.id)"
        @tag-added="addTag"
        @tag-removed="removeTag"
        @tag-deleted="
          removeTag($event);
          emit('tag-deleted', $event.id);
        "
        @close="closeTagSearch"
      />
    </div>

    <div v-if="selectedTags.length > 0" class="selected-tags-preview">
      <TagBadgeList :tags="selectedTags" @remove="removeTag" />
    </div>
  </div>
</template>
