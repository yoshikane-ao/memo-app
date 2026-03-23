<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import TagBadgeList from '../tagBadgeList/tagBadgeList.vue';
import { useTagCatalog } from '../tagCatalog/tagCatalog';
import TagSearch from '../tagSearch/tagSearch.vue';
import type { TagItem } from '../Types';
import { useTagFilter } from './tagFilter';
import type { TagFilterFieldEmits, TagFilterFieldProps } from '../Types';

const props = defineProps<TagFilterFieldProps>();
const emit = defineEmits<TagFilterFieldEmits>();

const isSameTagIdList = (left: number[], right: number[]) => {
  return left.length === right.length && left.every((value, index) => value === right[index]);
};

const { allTags, fetchAllTags } = useTagCatalog();
const {
  localSelectedTags,
  isDropdownOpen,
  addTag,
  removeTag,
  replaceSelectedTags
} = useTagFilter(props.selectedTags ?? []);

const selectedTagItems = computed<TagItem[]>(() => {
  return localSelectedTags.value
    .map((tagId) => allTags.value.find((tag) => tag.id === tagId))
    .filter((tag): tag is TagItem => Boolean(tag));
});

const handleTagAdded = (tag: TagItem) => {
  addTag(tag.id);
};

const handleTagRemoved = (tag: TagItem) => {
  removeTag(tag.id);
};

const handleTagDeleted = (tagId: number) => {
  emit('tag-deleted', tagId);
};

onMounted(() => {
  void fetchAllTags();
});

watch(
  () => props.selectedTags,
  (value) => {
    replaceSelectedTags(value ?? []);
  }
);

watch(
  allTags,
  (tags) => {
    const validTagIds = tags.map((tag) => tag.id);
    replaceSelectedTags(localSelectedTags.value.filter((tagId) => validTagIds.includes(tagId)));
  },
  { deep: true }
);

watch(
  localSelectedTags,
  (value) => {
    if (isSameTagIdList(value, props.selectedTags ?? [])) {
      return;
    }

    emit('update:selectedTags', [...value]);
  },
  { deep: true }
);
</script>

<template>
  <div class="dropdown-container">
    <div class="tag-filter-trigger-row">
      <button type="button" class="dropdown-toggle" @click="isDropdownOpen = !isDropdownOpen">
        タグで絞り込む {{ localSelectedTags.length > 0 ? `(${localSelectedTags.length})` : '' }} ▼
      </button>

      <div v-if="selectedTagItems.length > 0" class="tag-filter-selected-preview">
        <TagBadgeList
          :tags="selectedTagItems"
          :removable="false"
        />
      </div>
    </div>

    <TagSearch
      v-if="isDropdownOpen"
      :linkedTagIds="localSelectedTags"
      @tag-added="handleTagAdded"
      @tag-removed="handleTagRemoved"
      @tag-deleted="handleTagDeleted($event.id)"
      @close="isDropdownOpen = false"
    />
  </div>
</template>
