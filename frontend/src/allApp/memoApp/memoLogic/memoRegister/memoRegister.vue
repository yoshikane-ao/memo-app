<script setup lang="ts">
import MemoRegisterForm from './memoRegisterForm.vue';
import type { MemoRegisterEmits } from './types';
import { useMemoRegisterController } from './useMemoRegisterController';

const emit = defineEmits<MemoRegisterEmits>();
const {
  newMemo,
  tagSelectionResetKey,
  isRegisterDisabled,
  updateTitle,
  updateContent,
  setSelectedTagTitles,
  handleTagDeleted,
  handleSave
} = useMemoRegisterController(emit);
</script>

<template>
  <MemoRegisterForm
    :title="newMemo.title"
    :content="newMemo.content"
    :isRegisterDisabled="isRegisterDisabled"
    :tagSelectionResetKey="tagSelectionResetKey"
    @update:title="updateTitle"
    @update:content="updateContent"
    @update:selectedTitles="setSelectedTagTitles"
    @tag-deleted="handleTagDeleted"
    @submit="handleSave"
  />
</template>
