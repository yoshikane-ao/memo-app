<script setup lang="ts">
import { memoDelete } from './memoDelete.ts';
import buttonBaseField from '../../../shared/buttonBaseField.vue';
import type { MemoDeleteEmits, MemoIdProps } from '../Types';

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
    emit('deleted');
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
