<script setup lang="ts">
import "../styles/index.css";
import FeedbackBanner from "../../../shared/feedback/FeedbackBanner.vue";
import {
  MemoScopeTabs,
  MemoToolbar,
  MemoTrashActionsContainer,
  MemoTrashListContainer,
} from "../features/memo";
import { useMemoHistoryCommands } from "../features/memo/model/useMemoHistoryCommands";
import type { MemoViewScope } from "../features/view/model/memoView.types";
import { useMemoPageSetup } from "./useMemoPageSetup";

const commands = useMemoHistoryCommands();
const { keyword, searchType, sortOrder, selectedTags, displayedMemos } = useMemoPageSetup({
  scope: "trash",
  listView: {
    allowManualReorder: false,
    defaultSortOrder: "newest",
    sortTimestamp: "deletedAt",
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
      scope="trash"
      :disabled="commands.isHistoryBusy.value"
      @scope-change="handleScopeChange"
    />
    <MemoTrashActionsContainer />
    <MemoToolbar
      :keyword="keyword"
      :searchType="searchType"
      :sortOrder="sortOrder"
      :selectedTags="selectedTags"
      :showSortOrder="false"
      @update:keyword="keyword = $event"
      @update:searchType="searchType = $event"
      @update:sortOrder="sortOrder = $event"
      @update:selectedTags="selectedTags = $event"
    />
    <MemoTrashListContainer :items="displayedMemos" />
  </section>
</template>
