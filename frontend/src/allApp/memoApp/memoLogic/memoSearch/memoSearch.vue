<script setup lang="ts">
import MemoSearchControls from './memoSearchControls.vue';
import type { MemoSearchEmits, MemoSearchProps } from './types';

defineProps<MemoSearchProps>();
const emit = defineEmits<MemoSearchEmits>();
</script>

<template>
  <MemoSearchControls
    :keyword="keyword ?? ''"
    :searchType="searchType ?? 'all'"
    :sortOrder="sortOrder ?? 'custom'"
    :selectedTags="selectedTags ?? []"
    @update:keyword="emit('update:keyword', $event)"
    @update:searchType="emit('update:searchType', $event)"
    @update:sortOrder="emit('update:sortOrder', $event)"
    @update:selectedTags="emit('update:selectedTags', $event)"
    @tag-deleted="emit('tag-deleted', $event)"
  />
</template>
