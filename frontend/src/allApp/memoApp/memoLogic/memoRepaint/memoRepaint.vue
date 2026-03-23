<script setup lang="ts">
import MemoRegister from '../memoRegister/memoRegister.vue';
import MemoSearch from '../memoSearch/memoSearch.vue';
import MemoList from '../memoList/memoList.vue';
import { useMemoRepaint } from './memoRepaint';
import { useMemoRepaintBindings } from './useMemoRepaintBindings';

const {
  keyword,
  searchType,
  sortOrder,
  selectedTags,
  displayedMemos,
  canSort,
  handleMemoCreated,
  handleTagDeleted,
  handleItemsReplaced,
  handleSortSaved,
  handleMemoUpdated,
  handleMemoDeleted,
  handleMemoTagsUpdated
} = useMemoRepaint();

const {
  memoRegisterListeners,
  memoSearchProps,
  memoSearchListeners,
  memoListProps,
  memoListListeners
} = useMemoRepaintBindings({
  keyword,
  searchType,
  sortOrder,
  selectedTags,
  displayedMemos,
  canSort,
  handleMemoCreated,
  handleTagDeleted,
  handleItemsReplaced,
  handleSortSaved,
  handleMemoUpdated,
  handleMemoDeleted,
  handleMemoTagsUpdated
});
</script>

<template>
  <MemoRegister v-on="memoRegisterListeners" />
  <MemoSearch v-bind="memoSearchProps" v-on="memoSearchListeners" />
  <MemoList v-bind="memoListProps" v-on="memoListListeners" />
</template>
