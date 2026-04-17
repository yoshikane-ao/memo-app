<script setup lang="ts">
import "../styles/index.css";
import FeedbackBanner from "../../../shared/feedback/FeedbackBanner.vue";
import {
  MemoComposerContainer,
  MemoListContainer,
  MemoScopeTabs,
  MemoToolbar,
  useMemoHistoryCommands,
} from "../features/memo";
import { useMemoViewStore, type MemoViewScope } from "../features/view";
import { useMemoPageSetup } from "./useMemoPageSetup";

const commands = useMemoHistoryCommands();
const viewStore = useMemoViewStore();
const { keyword, searchType, sortOrder, selectedTags, displayedMemos, canReorder } =
  useMemoPageSetup();

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
    <MemoComposerContainer />
    <MemoToolbar
      :keyword="keyword"
      :searchType="searchType"
      :sortOrder="sortOrder"
      :selectedTags="selectedTags"
      @update:keyword="keyword = $event"
      @update:searchType="searchType = $event"
      @update:sortOrder="sortOrder = $event"
      @update:selectedTags="selectedTags = $event"
    />
    <MemoListContainer :items="displayedMemos" :canReorder="canReorder" />
  </section>
</template>
