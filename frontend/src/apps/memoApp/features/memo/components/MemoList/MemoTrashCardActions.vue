<script setup lang="ts">
import BaseButton from "../../../../../../shared/ui/BaseButton.vue";
import type { MemoTrashCardActionsEmits, MemoTrashCardActionsProps } from "./types";

defineProps<MemoTrashCardActionsProps>();
const emit = defineEmits<MemoTrashCardActionsEmits>();
</script>

<template>
  <button class="copy-btn" title="Copy memo" @click.stop="emit('copy-requested')">
    <span v-if="!isCopied">Copy</span>
    <span v-else>OK!</span>
  </button>
  <BaseButton class="restore-btn" label="Restore" @click="emit('restore-requested')" />
  <BaseButton class="purge-btn" label="Delete forever" @click="emit('purge-requested')" />
</template>
