<script setup lang="ts">
import "../styles/index.css";
import FeedbackBanner from "../../../shared/feedback/FeedbackBanner.vue";
import {
  MemoComposerContainer,
  MemoListContainer,
  MemoScopeTabs,
  MemoToolbar,
} from "../features/memo";
import { useMemoPageSetup } from "./useMemoPageSetup";

const { keyword, searchType, sortOrder, selectedTags, displayedMemos, canReorder } =
  useMemoPageSetup();
</script>

<template>
  <section class="memo-app-page">
    <FeedbackBanner />
    <MemoComposerContainer />
    <MemoScopeTabs scope="active" />
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
