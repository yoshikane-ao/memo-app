<script setup lang="ts">
import MemoCopy from '../memoCopy/memoCopy.vue';
import MemoUpdate from '../memoUpdate/memoUpdate.vue';
import MemoDelete from '../memoDelete/memoDelete.vue';
import type { MemoRowActionsEmits, MemoRowActionsProps } from './types';

defineProps<MemoRowActionsProps>();
const emit = defineEmits<MemoRowActionsEmits>();
</script>

<template>
  <MemoCopy :text="memo.content" />
  <MemoUpdate
    :memoId="memo.id"
    :title="memo.title"
    :content="memo.content"
    :initialTitle="memo.initialTitle"
    :initialContent="memo.initialContent"
    :currentWidth="currentWidth"
    :initialWidth="memo.width ?? undefined"
    :currentHeight="currentHeight"
    :initialHeight="memo.height ?? undefined"
    @memo-updated="emit('memo-updated', $event)"
  />
  <MemoDelete :memoId="memo.id" @memo-deleted="emit('memo-deleted', $event)" />
</template>
