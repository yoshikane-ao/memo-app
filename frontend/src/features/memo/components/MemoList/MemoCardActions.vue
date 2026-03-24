<script setup lang="ts">
import { ref } from "vue";
import BaseButton from "../../../../shared/ui/BaseButton.vue";
import type { MemoCardActionsEmits, MemoCardActionsProps } from "./types";

defineProps<MemoCardActionsProps>();
const emit = defineEmits<MemoCardActionsEmits>();

const isCopied = ref(false);

const handleCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 500);
  } catch (error) {
    console.error("Failed to copy memo content.", error);
  }
};
</script>

<template>
  <button class="copy-btn" title="Copy memo" @click.stop="handleCopy(content)">
    <span v-if="!isCopied">Copy</span>
    <span v-else>OK!</span>
  </button>
  <BaseButton
    class="update-btn"
    label="Save"
    :disabled="isSaveDisabled"
    @click="emit('save-requested')"
  />
  <BaseButton class="delete-btn" label="Delete" @click="emit('delete-requested')" />
</template>
