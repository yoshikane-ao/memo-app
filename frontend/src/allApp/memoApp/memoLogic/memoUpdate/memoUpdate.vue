<script setup lang="ts">
import { computed } from 'vue';
import { memoUpdate } from './memoUpdate.ts';
import buttonBaseField from '../../../shared/buttonBaseField.vue';
import type { MemoUpdateEmits, MemoUpdateProps } from '../Types';

const props = defineProps<MemoUpdateProps>();

const emit = defineEmits<MemoUpdateEmits>();

const { executeUpdate } = memoUpdate();

const hasTextChanged = computed(() => {
  return props.title !== props.initialTitle || props.content !== props.initialContent;
});

const isUpdateDisabled = computed(() => {
  const hasRequiredFields = props.title.trim() !== '' && props.content.trim() !== '';
  return !hasRequiredFields || !hasTextChanged.value;
});

const handleUpdate = async () => {
  if (isUpdateDisabled.value) {
    return;
  }

  const success = await executeUpdate({
    id: props.memoId,
    title: props.title,
    content: props.content,
    width: props.currentWidth,
    height: props.currentHeight
  });

  if (success) {
    emit('updated');
    return;
  }

  alert('メモの更新に失敗しました。');
};
</script>

<template>
  <buttonBaseField
    class="update-btn"
    label="更新"
    :disabled="isUpdateDisabled"
    @click="handleUpdate"
  />
</template>
