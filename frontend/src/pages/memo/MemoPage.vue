<script setup lang="ts">
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import "../../styles/memo-app.css";
import FeedbackBanner from "../../shared/feedback/FeedbackBanner.vue";
import {
  MemoComposerContainer,
  MemoListContainer,
  MemoToolbar,
  useMemoStore,
} from "../../features/memo";
import { useMemoListView } from "./useMemoListView";
import { useCopyShortcuts } from "../../shared/copy/useCopyShortcuts";
import { useHistoryManager } from "../../shared/history/useHistoryManager";
import { useHistoryShortcuts } from "../../shared/history/useHistoryShortcuts";

const memoStore = useMemoStore();
const history = useHistoryManager();
const { items } = storeToRefs(memoStore);
const { keyword, searchType, sortOrder, selectedTags, displayedMemos, canReorder } =
  useMemoListView(items);

useHistoryShortcuts();
useCopyShortcuts();

onMounted(() => {
  history.clear();
  void memoStore.fetchAll();
});
</script>

<template>
  <FeedbackBanner />
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
</template>
