<script setup lang="ts">
import MemoTrashCard from "./MemoTrashCard.vue";
import type { MemoTrashListEmits, MemoTrashListProps } from "./types";

defineProps<MemoTrashListProps>();
const emit = defineEmits<MemoTrashListEmits>();
</script>

<template>
  <div class="memo-container">
    <div v-if="items.length === 0" class="memo-empty">Trash is empty.</div>

    <div v-else class="sortable-list">
      <MemoTrashCard
        v-for="memo in items"
        :key="memo.id"
        :memo="memo"
        @copy-error="emit('copy-error', $event)"
        @restore-requested="emit('restore-requested', $event)"
        @purge-requested="emit('purge-requested', $event)"
      />
    </div>
  </div>
</template>
