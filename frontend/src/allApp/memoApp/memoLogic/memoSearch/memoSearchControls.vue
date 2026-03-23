<script setup lang="ts">
import TagFilterField from '../../tagLogic/tagFilter/tagFilterField.vue';
import type {
  MemoSearchControlsEmits,
  MemoSearchControlsProps,
  MemoSearchType,
  MemoSortOrder
} from './types';

defineProps<MemoSearchControlsProps>();
const emit = defineEmits<MemoSearchControlsEmits>();

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
      id="search-input"
      :value="keyword"
      type="text"
      placeholder="メモを検索"
      spellcheck="false"
      class="search-input-compact"
      @input="handleKeywordInput"
    />

    <div class="filter-select-wrap">
      <select :value="searchType" class="filter-select" @change="handleSearchTypeChange">
        <option value="all">全て</option>
        <option value="title">タイトルのみ</option>
        <option value="content">本文のみ</option>
        <option value="tag">タグのみ</option>
      </select>
    </div>

    <div class="filter-select-wrap">
      <select :value="sortOrder" class="filter-select" @change="handleSortOrderChange">
        <option value="custom">自分で並べた順</option>
        <option value="newest">新しい順</option>
        <option value="oldest">古い順</option>
      </select>
    </div>

    <TagFilterField
      :selectedTags="selectedTags"
      @update:selectedTags="emit('update:selectedTags', $event)"
      @tag-deleted="emit('tag-deleted', $event)"
    />
  </div>
</template>
