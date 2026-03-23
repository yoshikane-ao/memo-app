<script setup lang="ts">
import { onMounted, watch } from 'vue';
import TagSearch from '../tagSearch/tagSearch.vue';
import TagBadgeList from '../tagBadgeList/tagBadgeList.vue';
import { useTagCatalog } from '../tagCatalog/tagCatalog';
import { useTagSelection } from './tagSelection';
import type { TagDeletedPayload, TagItem, TagSelectionFieldEmits, TagSelectionFieldProps } from '../Types';

const props = defineProps<TagSelectionFieldProps>();
const emit = defineEmits<TagSelectionFieldEmits>();

const {
  showTagSearch,
  selectedTags,
  linkedTagIds,
  addTag,
  removeTag,
  toggleTagSearch,
  closeTagSearch,
  resetTagSelection
} = useTagSelection();
const { allTags, fetchAllTags } = useTagCatalog();

watch(
  selectedTags,
  (value) => {
    emit(
      'update:selectedTitles',
      value.map((tag) => tag.title)
    );
  },
  { deep: true, immediate: true }
);

watch(
  () => props.resetKey,
  () => {
    resetTagSelection();
  }
);

watch(
  allTags,
  (tags) => {
    const validTagIds = tags.map((tag) => tag.id);
    selectedTags.value
      .filter((tag) => !validTagIds.includes(tag.id))
      .forEach((tag) => removeTag(tag));
  },
  { deep: true }
);

onMounted(() => {
  void fetchAllTags();
});

const handleTagDeleted = (tag: TagItem) => {
  emit('tag-deleted', tag.id as TagDeletedPayload);
};
</script>

<template>
  <div class="tag-selection-field">
    <div class="tag-dropdown-wrapper">
      <button
        class="tag-add-btn"
        title="Add tag"
        @click.stop="toggleTagSearch"
      >
        + タグ
      </button>

      <TagSearch
        v-if="showTagSearch"
        :linkedTagIds="linkedTagIds"
        @tag-added="addTag"
        @tag-removed="removeTag"
        @tag-deleted="handleTagDeleted"
        @close="closeTagSearch"
      />
    </div>

    <div v-if="selectedTags.length > 0" class="selected-tags-preview">
      <TagBadgeList
        :tags="selectedTags"
        @remove="removeTag"
      />
    </div>
  </div>
</template>
