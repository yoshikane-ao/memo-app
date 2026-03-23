<script setup lang="ts">
import { watch } from 'vue';
import TagSearch from '../tagSearch/tagSearch.vue';
import TagBadgeList from '../tagBadgeList/tagBadgeList.vue';
import { useTagSelection } from './tagSelection';
import type { TagSelectionFieldEmits, TagSelectionFieldProps } from '../Types';

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
</script>

<template>
  <div class="tag-dropdown-wrapper">
    <button
      class="tag-add-btn"
      title="タグ設定"
      @click.stop="toggleTagSearch"
    >
      + タグ
    </button>

    <TagSearch
      v-if="showTagSearch"
      :linkedTagIds="linkedTagIds"
      @tag-added="addTag"
      @tag-removed="removeTag"
      @close="closeTagSearch"
    />

    <TagBadgeList
      :tags="selectedTags"
      @remove="removeTag"
    />
  </div>
</template>
