<script setup lang="ts">
import MemoListContent from './memoListContent.vue';
import { useMemoListController } from './useMemoListController';
import type { MemoListEmits, MemoListProps } from './types';

const props = defineProps<MemoListProps>();
const emit = defineEmits<MemoListEmits>();
const {
  updateItems,
  handleSorted,
  handleUpdated,
  handleDeleted,
  handleMemoTagsUpdated,
  handleTagDeleted,
  handleMemoFieldUpdate
} = useMemoListController(props, emit);
</script>

<template>
  <MemoListContent
    :items="items"
    :canSort="canSort"
    @update:items="updateItems"
    @sort-saved="handleSorted"
    @title-input="handleMemoFieldUpdate($event.memoId, 'title', $event.value)"
    @content-input="handleMemoFieldUpdate($event.memoId, 'content', $event.value)"
    @memo-updated="handleUpdated"
    @memo-deleted="handleDeleted"
    @memo-tags-updated="handleMemoTagsUpdated"
    @tag-deleted="handleTagDeleted"
  />
</template>
