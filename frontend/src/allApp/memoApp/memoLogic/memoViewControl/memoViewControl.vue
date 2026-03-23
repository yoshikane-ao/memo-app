<script setup lang="ts">
import { ref, watch } from 'vue';
import TagFilterField from '../../tagLogic/tagFilter/tagFilterField.vue';
import type {
  MemoSearchType,
  MemoSortOrder,
  MemoViewControlEmits,
  MemoViewControlProps
} from '../Types';

const props = defineProps<MemoViewControlProps>();
const emit = defineEmits<MemoViewControlEmits>();

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
      placeholder="検索"
      spellcheck="false"
      class="search-input-compact"
    />

    <select v-model="localSearchType" class="sort-select">
      <option value="all">全て</option>
      <option value="title">タイトル</option>
      <option value="content">内容</option>
      <option value="tag">タグ</option>
    </select>

    <TagFilterField
      :selectedTags="selectedTags"
      @update:selectedTags="emit('update:selectedTags', $event)"
    />
  </div>
</template>
