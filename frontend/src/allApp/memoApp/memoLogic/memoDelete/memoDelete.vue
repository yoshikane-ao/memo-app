<script setup lang="ts">
import { memoDelete } from './memoDelete.ts';
import buttonBaseField from '../../../shared/buttonBaseField.vue';
import type { MemoIdProps } from '../types/memo-domain.types';
import type { MemoDeleteEmits } from './types';

const props = defineProps<MemoIdProps>();

const emit = defineEmits<MemoDeleteEmits>();

const { executeDelete } = memoDelete();

const onClickDelete = async () => {
  const confirmed = confirm('このメモを削除しますか？');
  if (!confirmed) {
    return;
  }

  const success = await executeDelete(props.memoId);

  if (success) {
    emit('memo-deleted', props.memoId);
    return;
  }

  alert('メモの削除に失敗しました。');
};
</script>

<template>
  <buttonBaseField
    :id="'delete-' + memoId"
    label="削除"
    @click="onClickDelete"
  />
</template>
