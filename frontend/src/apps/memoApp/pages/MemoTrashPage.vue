<script setup lang="ts">
import "../styles/index.css";
import FeedbackBanner from "../../../shared/feedback/FeedbackBanner.vue";
import { MemoScopeTabs, MemoToolbar, MemoTrashListContainer } from "../features/memo";
import { useMemoPageSetup } from "./useMemoPageSetup";

const { keyword, searchType, sortOrder, selectedTags, displayedMemos } = useMemoPageSetup({
  scope: "trash",
  listView: {
    allowManualReorder: false,
    defaultSortOrder: "newest",
    sortTimestamp: "deletedAt",
  },
});
</script>

<template>
  <section class="memo-app-page">
    <FeedbackBanner />
    <MemoScopeTabs scope="trash" />
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
