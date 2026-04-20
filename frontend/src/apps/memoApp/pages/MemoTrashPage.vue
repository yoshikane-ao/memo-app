<script setup lang="ts">
import '../styles/index.css';
import FeedbackBanner from '../../../shared/feedback/FeedbackBanner.vue';
import {
  MemoScopeTabs,
  MemoToolbar,
  MemoTrashActionsContainer,
  MemoTrashListContainer,
  useMemoHistoryCommands,
} from '../features/memo';
import { useMemoViewStore, type MemoViewScope } from '../features/view';
import { useMemoPageSetup } from './useMemoPageSetup';

const commands = useMemoHistoryCommands();
const viewStore = useMemoViewStore();
const { keyword, searchType, sortOrder, selectedTags, displayedMemos } = useMemoPageSetup({
  scope: 'trash',
  listView: {
    allowManualReorder: false,
    defaultSortOrder: 'newest',
    sortTimestamp: 'deletedAt',
  },
});

const handleScopeChange = (scope: MemoViewScope) => {
  void commands.switchMemoScope(scope);
};
</script>

<template>
  <section class="memo-app-page">
    <FeedbackBanner />
    <MemoScopeTabs
      :scope="viewStore.currentScope"
      :disabled="commands.isHistoryBusy.value"
      @scope-change="handleScopeChange"
    />
    <MemoTrashActionsContainer />
    <MemoToolbar
      :keyword="keyword"
      :search-type="searchType"
      :sort-order="sortOrder"
      :selected-tags="selectedTags"
      :show-sort-order="false"
      @update:keyword="keyword = $event"
      @update:search-type="searchType = $event"
      @update:sort-order="sortOrder = $event"
      @update:selected-tags="selectedTags = $event"
    />
    <MemoTrashListContainer :items="displayedMemos" />
  </section>
</template>
