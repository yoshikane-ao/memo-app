<script setup lang="ts">
import BaseButton from "../../../../../../shared/ui/BaseButton.vue";
import type { MemoTrashCardActionsEmits, MemoTrashCardActionsProps } from "./types";

defineProps<MemoTrashCardActionsProps>();
const emit = defineEmits<MemoTrashCardActionsEmits>();
</script>

<template>
  <button class="copy-btn" title="メモをコピー" @click.stop="emit('copy-requested')">
    <span v-if="!isCopied">コピー</span>
    <span v-else>OK!</span>
  </button>
  <BaseButton class="restore-btn" label="復元" @click="emit('restore-requested')" />
  <BaseButton class="purge-btn" label="完全に削除" @click="emit('purge-requested')" />
</template>
