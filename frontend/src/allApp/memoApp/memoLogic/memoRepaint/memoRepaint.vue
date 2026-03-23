<script setup lang="ts">
import { onMounted } from 'vue';
import MemoRegister from '../memoRegister/memoRegister.vue';
import MemoSearch from '../memoSearch/memoSearch.vue';
import MemoList from '../memoList/memoList.vue';
import { useMemoRepaint } from './memoRepaint';

const {
  keyword,
  searchType,
  sortOrder,
  selectedTags,
  displayedMemos,
  canSort,
  repaintMemos,
  replaceMemos
} = useMemoRepaint();

onMounted(() => {
  void repaintMemos();
});
</script>

<template>
  <MemoRegister @created="repaintMemos" />
  <MemoSearch
    v-model:keyword="keyword"
    v-model:searchType="searchType"
    v-model:sortOrder="sortOrder"
    v-model:selectedTags="selectedTags"
  />
  <MemoList
    :items="displayedMemos"
    :canSort="canSort"
    @update:items="replaceMemos"
    @sorted="repaintMemos"
    @changed="repaintMemos"
  />
</template>
