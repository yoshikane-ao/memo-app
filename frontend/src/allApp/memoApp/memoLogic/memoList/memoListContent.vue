<script setup lang="ts">
import MemoListRows from './memoListRows.vue';
import MemoRowActions from './memoRowActions.vue';
import MemoRowTags from './memoRowTags.vue';
import type { MemoListContentEmits, MemoListContentProps } from './types';

defineProps<MemoListContentProps>();
const emit = defineEmits<MemoListContentEmits>();
</script>

<template>
  <MemoListRows
    :items="items"
    :canSort="canSort"
    @update:items="emit('update:items', $event)"
    @sort-saved="emit('sort-saved', $event)"
    @title-input="emit('title-input', $event)"
    @content-input="emit('content-input', $event)"
  >
    <template #tags="{ memo }">
      <MemoRowTags
        :memoId="memo.id"
        :tags="memo.memo_tags.map(({ tag }) => tag)"
        @memo-tags-updated="emit('memo-tags-updated', $event)"
        @tag-deleted="emit('tag-deleted', $event)"
      />
    </template>

    <template #actions="{ memo, currentWidth, currentHeight }">
      <MemoRowActions
        :memo="memo"
        :currentWidth="currentWidth"
        :currentHeight="currentHeight"
        @memo-updated="emit('memo-updated', $event)"
        @memo-deleted="emit('memo-deleted', $event)"
      />
    </template>
  </MemoListRows>
</template>
