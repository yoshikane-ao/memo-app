<script setup lang="ts">
import { computed } from 'vue';
import TagFilterField from '../../tagLogic/tagFilter/tagFilterField.vue';
import type {
  MemoSearchEmits,
  MemoSearchProps,
  MemoSearchType,
  MemoSortOrder
} from './types';

const props = defineProps<MemoSearchProps>();
const emit = defineEmits<MemoSearchEmits>();

const isSameTagIdList = (left: number[], right: number[]) => {
  return left.length === right.length && left.every((value, index) => value === right[index]);
};

const keywordModel = computed({
  get: () => props.keyword ?? '',
  set: (value: string) => emit('update:keyword', value)
});

const searchTypeModel = computed<MemoSearchType>({
  get: () => props.searchType ?? 'all',
  set: (value) => emit('update:searchType', value)
});

const sortOrderModel = computed<MemoSortOrder>({
  get: () => props.sortOrder ?? 'custom',
  set: (value) => emit('update:sortOrder', value)
});

const selectedTagsModel = computed<number[]>({
  get: () => props.selectedTags ?? [],
  set: (value) => {
    if (isSameTagIdList(value, props.selectedTags ?? [])) {
      return;
    }

    emit('update:selectedTags', [...value]);
  }
});
</script>

<template>
  <div class="view-control-container">
    <input
      id="search-input"
      v-model="keywordModel"
      type="text"
      placeholder="メモを検索"
      spellcheck="false"
      class="search-input-compact"
    />

    <div class="filter-select-wrap">
      <select v-model="searchTypeModel" class="filter-select">
        <option value="all">全て</option>
        <option value="title">タイトルのみ</option>
        <option value="content">本文のみ</option>
        <option value="tag">タグのみ</option>
      </select>
    </div>

    <div class="filter-select-wrap">
      <select v-model="sortOrderModel" class="filter-select">
        <option value="custom">自分で並べた順</option>
        <option value="newest">新しい順</option>
        <option value="oldest">古い順</option>
      </select>
    </div>

    <TagFilterField v-model:selectedTags="selectedTagsModel" />
  </div>
</template>
