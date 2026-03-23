<script setup lang="ts">
import { ref } from 'vue';
import type { MemoCopyProps } from './types';

const props = defineProps<MemoCopyProps>();
const isCopied = ref(false);

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.text);
    isCopied.value = true;
    setTimeout(() => { isCopied.value = false; }, 500); // 0.5秒後に戻す
  } catch (err) {
    console.error('コピーに失敗しました', err);
  }
};
</script>

<template>
  <button @click.stop="handleCopy" class="copy-btn" title="メモをコピー">
    <span v-if="!isCopied">Copy</span>
    <span v-else>OK!</span>
  </button>
</template>
