<script setup lang="ts">
import MemoSortWrapper from '../memoSort/memoSort.vue';
import type { MemoListViewEmits, MemoListViewProps } from '../Types';

defineProps<MemoListViewProps>();
const emit = defineEmits<MemoListViewEmits>();
</script>

<template>
  <div class="memo-container">
    <div v-if="items.length === 0" class="memo-empty">
      表示できるメモがありません。
    </div>

    <MemoSortWrapper
      :items="items"
      :disabled="!canSort"
      @update:items="emit('update:items', $event)"
      @sorted="emit('sorted')"
    >
      <template #default="{ item: memo }">
        <slot :memo="memo" />
      </template>
    </MemoSortWrapper>
  </div>
</template>
