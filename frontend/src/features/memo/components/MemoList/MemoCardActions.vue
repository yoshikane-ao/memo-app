<script setup lang="ts">
import BaseButton from "../../../../shared/ui/BaseButton.vue";
import type { MemoCardActionsEmits, MemoCardActionsProps } from "./types";

defineProps<MemoCardActionsProps>();
const emit = defineEmits<MemoCardActionsEmits>();
</script>

<template>
  <button class="copy-btn" title="Copy memo" @click.stop="emit('copy-requested')">
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
