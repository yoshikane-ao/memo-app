<script setup lang="ts">
import type { MemoRegisterFieldsEmits, MemoRegisterFieldsProps } from './types';
import { useMemoRegisterLayout } from './useMemoRegisterLayout';

const props = defineProps<MemoRegisterFieldsProps>();
const emit = defineEmits<MemoRegisterFieldsEmits>();

const registerLayout = useMemoRegisterLayout(
  () => props.title,
  () => props.content
);

const handleTitleInput = (event: Event) => {
  const target = event.target;

  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }

  emit('update:title', target.value);
  registerLayout.handleTitleInputLayout(target);
};

const handleContentInput = (event: Event) => {
  const target = event.target;

  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }

  emit('update:content', target.value);
  registerLayout.handleContentInputLayout(target);
};
</script>

<template>
  <div class="register-row">
    <div class="title-cell">
      <textarea
        ref="registerLayout.titleTextareaRef"
        id="reg-title"
        :value="title"
        placeholder="タイトル"
        rows="1"
        spellcheck="false"
        class="title-input"
        @input="handleTitleInput"
      />
    </div>
    <div class="content-cell">
      <textarea
        ref="registerLayout.contentTextareaRef"
        id="reg-content"
        :value="content"
        placeholder="内容を入力してください"
        rows="2"
        spellcheck="false"
        class="content-input"
        @input="handleContentInput"
      />
    </div>
  </div>
</template>
