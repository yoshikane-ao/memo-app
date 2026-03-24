<script setup lang="ts">
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import "../../styles/memo-app.css";
import {
  MemoComposerContainer,
  MemoListContainer,
  MemoToolbar,
  useMemoStore,
} from "../../features/memo";
import type { TagDeletedPayload } from "../../features/tag";
import { useMemoListView } from "./useMemoListView";

const memoStore = useMemoStore();
const { items } = storeToRefs(memoStore);
const { keyword, searchType, sortOrder, selectedTags, displayedMemos, canReorder } =
  useMemoListView(items);

const handleTagDeleted = (tagId: TagDeletedPayload) => {
  memoStore.removeDeletedTagReference(tagId);
};

onMounted(() => {
  void memoStore.fetchAll();
});
</script>

<template>
  <MemoComposerContainer @tag-deleted="handleTagDeleted" />
  <MemoToolbar
    :keyword="keyword"
    :searchType="searchType"
    :sortOrder="sortOrder"
    :selectedTags="selectedTags"
    @update:keyword="keyword = $event"
    @update:searchType="searchType = $event"
    @update:sortOrder="sortOrder = $event"
    @update:selectedTags="selectedTags = $event"
    @tag-deleted="handleTagDeleted"
  />
  <MemoListContainer
    :items="displayedMemos"
    :canReorder="canReorder"
    @tag-deleted="handleTagDeleted"
  />
</template>
