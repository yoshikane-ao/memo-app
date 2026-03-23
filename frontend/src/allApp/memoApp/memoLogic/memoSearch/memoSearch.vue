<script setup lang="ts">
import { ref, watch } from 'vue';
import TagFilterField from '../../tagLogic/tagFilter/tagFilterField.vue';
import type {
  MemoSearchEmits,
  MemoSearchProps,
  MemoSearchType,
  MemoSortOrder
} from '../Types';

const props = defineProps<MemoSearchProps>();
const emit = defineEmits<MemoSearchEmits>();

const localKeyword = ref(props.keyword || '');
const localSearchType = ref<MemoSearchType>(props.searchType || 'all');
const localSortOrder = ref<MemoSortOrder>(props.sortOrder || 'custom');

watch(localKeyword, (value) => emit('update:keyword', value));
watch(localSearchType, (value) => emit('update:searchType', value));
watch(localSortOrder, (value) => emit('update:sortOrder', value));
</script>

<template>
  <div class="view-control-container">
    <input
      id="search-input"
      v-model="localKeyword"
      type="text"
      placeholder="メモを探す"
      spellcheck="false"
      class="search-input-compact"
    />

    <select v-model="localSearchType" class="sort-select">
      <option value="all">全て</option>
      <option value="title">タイトルのみ</option>
      <option value="content">本文のみ</option>
      <option value="tag">タグのみ</option>
    </select>

    <select v-model="localSortOrder" class="sort-select">
      <option value="custom">自分で並べた順</option>
      <option value="newest">新しい順</option>
      <option value="oldest">古い順</option>
    </select>

    <TagFilterField
      :selectedTags="selectedTags"
      @update:selectedTags="emit('update:selectedTags', $event)"
    />
  </div>
</template>
