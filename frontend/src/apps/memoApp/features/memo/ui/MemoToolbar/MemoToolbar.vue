<script setup lang="ts">
import { TagFilterSelect } from '../../../tag';
import type { MemoSortOrder, MemoSearchType, MemoToolbarEmits, MemoToolbarProps } from './types';

withDefaults(defineProps<MemoToolbarProps>(), {
  showSortOrder: true,
});
const emit = defineEmits<MemoToolbarEmits>();

const handleKeywordInput = (event: Event) => {
  const target = event.target;

  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  emit('update:keyword', target.value);
};

const handleSearchTypeChange = (event: Event) => {
  const target = event.target;

  if (!(target instanceof HTMLSelectElement)) {
    return;
  }

  emit('update:searchType', target.value as MemoSearchType);
};

const handleSortOrderChange = (event: Event) => {
  const target = event.target;

  if (!(target instanceof HTMLSelectElement)) {
    return;
  }

  emit('update:sortOrder', target.value as MemoSortOrder);
};
</script>

<template>
  <div class="view-control-container">
    <input
      id="memo-search-input"
      :value="keyword"
      type="text"
      placeholder="Search memos"
      spellcheck="false"
      class="search-input-compact"
      @input="handleKeywordInput"
    />

    <div class="filter-select-wrap">
      <select :value="searchType" class="filter-select" @change="handleSearchTypeChange">
        <option value="all">All</option>
        <option value="title">Title</option>
        <option value="content">Content</option>
        <option value="tag">Tag</option>
      </select>
    </div>

    <div v-if="showSortOrder" class="filter-select-wrap">
      <select :value="sortOrder" class="filter-select" @change="handleSortOrderChange">
        <option value="custom">Manual</option>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>
    </div>

    <TagFilterSelect
      :selected-tags="selectedTags"
      @update:selected-tags="emit('update:selectedTags', $event)"
      @tag-deleted="emit('tag-deleted', $event)"
    />
  </div>
</template>
