<script setup lang="ts">
import BaseButton from "../../../../../../shared/ui/BaseButton.vue";
import type { MemoCardActionsEmits, MemoCardActionsProps } from "./types";

defineProps<MemoCardActionsProps>();
const emit = defineEmits<MemoCardActionsEmits>();
</script>

<template>
  <button class="copy-btn" title="メモをコピー" @click.stop="emit('copy-requested')">
    <span v-if="!isCopied">コピー</span>
    <span v-else>OK!</span>
  </button>
  <BaseButton
    class="update-btn"
    label="保存"
    :disabled="isSaveDisabled"
    @click="emit('save-requested')"
  />
  <BaseButton class="delete-btn" label="ごみ箱" @click="emit('trash-requested')" />
</template>
