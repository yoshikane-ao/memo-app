<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ text: string }>();
const isCopied = ref(false);

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.text);
    isCopied.value = true;
    setTimeout(() => { isCopied.value = false; }, 2000); // 2秒後に戻す
  } catch (err) {
    console.error('コピーに失敗しました', err);
  }
};
</script>

<template>
  <button @click.stop="handleCopy" class="copy-btn" title="メモをコピー">
    <span v-if="!isCopied">📋</span>
    <span v-else>✅</span>
  </button>
</template>

<style scoped>
.copy-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  opacity: 0.6;
  transition: opacity 0.2s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}
.copy-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}
.copy-btn:active {
  transform: scale(0.9);
}
</style>