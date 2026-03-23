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

const hasWidthChanged = computed(() => {
  if (props.currentWidth == null) {
    return false;
  }

  return props.currentWidth !== props.initialWidth && !(props.initialWidth == null && props.currentWidth === 0);
});

const hasHeightChanged = computed(() => {
  if (props.currentHeight == null) {
    return false;
  }

  return props.currentHeight !== props.initialHeight && !(props.initialHeight == null && props.currentHeight === 0);
});

const isUpdateDisabled = computed(() => {
  const hasRequiredFields = props.title.trim() !== '' && props.content.trim() !== '';
  return !hasRequiredFields || (!hasTextChanged.value && !hasWidthChanged.value && !hasHeightChanged.value);
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
