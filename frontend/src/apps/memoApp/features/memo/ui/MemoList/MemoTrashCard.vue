<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { copyText } from '../../../../../../shared/copy/copyText';
import { TagBadgeList } from '../../../tag';
import MemoTrashCardActions from './MemoTrashCardActions.vue';
import type { MemoTrashCardEmits, MemoTrashCardProps } from './types';

const props = defineProps<MemoTrashCardProps>();
const emit = defineEmits<MemoTrashCardEmits>();

const isCopied = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

const deletedAtLabel = computed(() =>
  props.memo.deletedAt ? new Date(props.memo.deletedAt).toLocaleString() : 'Unknown',
);

const markCopied = () => {
  isCopied.value = true;

  if (copiedTimer) {
    clearTimeout(copiedTimer);
  }

  copiedTimer = setTimeout(() => {
    isCopied.value = false;
    copiedTimer = null;
  }, 500);
};

const copyMemoContent = async () => {
  try {
    await copyText(props.memo.content);
    markCopied();
  } catch (error) {
    console.error('Failed to copy memo content.', error);
    emit('copy-error', 'Failed to copy memo.');
  }
};

onBeforeUnmount(() => {
  if (copiedTimer) {
    clearTimeout(copiedTimer);
  }
});
</script>

<template>
  <div class="memo-row memo-row-readonly">
    <div class="title-cell">
      <div class="title-display">{{ memo.title.trim() || 'Untitled memo' }}</div>
    </div>

    <div class="content-cell">
      <p class="content-display">{{ memo.content.trim() || 'No content.' }}</p>
      <p class="memo-meta-text">Deleted {{ deletedAtLabel }}</p>
      <div v-if="memo.memo_tags.length > 0" class="tag-row">
        <TagBadgeList :tags="memo.memo_tags.map((memoTag) => memoTag.tag)" :removable="false" />
      </div>
    </div>

    <div class="actions-cell">
      <MemoTrashCardActions
        :is-copied="isCopied"
        @copy-requested="void copyMemoContent()"
        @restore-requested="emit('restore-requested', memo.id)"
        @purge-requested="emit('purge-requested', memo.id)"
      />
    </div>
  </div>
</template>
