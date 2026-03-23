<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { MemoRegister } from './memoRegister.ts';
import MemoRegisterForm from './memoRegisterForm.vue';
import type { MemoDraft, MemoRegisterEmits } from '../Types';

const emit = defineEmits<MemoRegisterEmits>();

const { executeRegister } = MemoRegister();
const newMemo = reactive<MemoDraft>({
  title: '',
  content: ''
});
const selectedTagTitles = ref<string[]>([]);
const tagSelectionResetKey = ref(0);

const isRegisterDisabled = computed(() => {
  return newMemo.title.trim() === '' || newMemo.content.trim() === '';
});

const updateTitle = (title: string) => {
  newMemo.title = title;
};

const updateContent = (content: string) => {
  newMemo.content = content;
};

const handleSelectedTitlesUpdate = (titles: string[]) => {
  selectedTagTitles.value = titles;
};

const resetRegisterForm = () => {
  newMemo.title = '';
  newMemo.content = '';
  selectedTagTitles.value = [];
  tagSelectionResetKey.value += 1;
};

const handleSave = async () => {
  if (isRegisterDisabled.value) {
    return;
  }

  const success = await executeRegister({
    title: newMemo.title,
    content: newMemo.content,
    tags: selectedTagTitles.value
  });

  if (success) {
    emit('created');
    resetRegisterForm();
    return;
  }

  alert('メモの作成に失敗しました。');
};
</script>

<template>
  <MemoRegisterForm
    :title="newMemo.title"
    :content="newMemo.content"
    :isRegisterDisabled="isRegisterDisabled"
    :tagSelectionResetKey="tagSelectionResetKey"
    @update:title="updateTitle"
    @update:content="updateContent"
    @update:selectedTitles="handleSelectedTitlesUpdate"
    @submit="handleSave"
  />
</template>
