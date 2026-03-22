<script setup lang="ts">
import { memoDelete } from './memoDelete.ts';
import memoList from '../memoList/memoList.vue';
import buttonBaseField from '../../../shared/buttonBaseField.vue'; // 共通コンポーネント

// 親(memoList)から「どのメモを消すか」のIDを受け取る
const props = defineProps<{
  memoId: number
}>();

// 削除が終わったことを親に知らせるための合図(Event)
const emit = defineEmits(['deleted']);

const { executeDelete } = memoDelete();

const onClickDelete = async () => {
  const success = await executeDelete(props.memoId);
  if (success) {
    emit('deleted'); // 成功したら親に報告する
  }
};
</script>

<template>
    <buttonBaseField
    id="delete"
    label="削除"
    @click="onClickDelete">
  </buttonBaseField>
</template>

<!-- <style scoped>
.delete-style {
  background-color: #ff4d4f;
  color: white;
}
</style> -->