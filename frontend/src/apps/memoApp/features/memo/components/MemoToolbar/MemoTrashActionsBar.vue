<script setup lang="ts">
import BaseButton from "../../../../../../shared/ui/BaseButton.vue";
import type { MemoTrashActionsBarEmits, MemoTrashActionsBarProps } from "./types";

defineProps<MemoTrashActionsBarProps>();
const emit = defineEmits<MemoTrashActionsBarEmits>();
</script>

<template>
  <div class="memo-trash-actions">
    <div class="memo-trash-actions-copy">
      <p class="memo-trash-actions-title">ごみ箱</p>
      <p class="memo-trash-actions-subtitle">
        <span>{{ trashCount }}件</span>
        <span>完全削除すると元に戻せません。</span>
      </p>
    </div>
    <BaseButton
      class="memo-trash-actions-button"
      :label="isBusy ? '削除中...' : 'ごみ箱を空にする'"
      :disabled="trashCount === 0 || isBusy"
      @click="emit('purge-all-requested')"
    />
  </div>
</template>
