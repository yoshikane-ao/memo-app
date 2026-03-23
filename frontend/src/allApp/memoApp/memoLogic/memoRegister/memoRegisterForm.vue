<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import buttonBaseField from '../../../shared/buttonBaseField.vue';
import TagSelectionField from '../../tagLogic/tagSelection/tagSelectionField.vue';
import { applyAutoContentHeight, applyAutoTitleWidth } from '../memoLayout/memoLayout';
import type { MemoRegisterFormEmits, MemoRegisterFormProps } from '../Types';

const props = defineProps<MemoRegisterFormProps>();
const emit = defineEmits<MemoRegisterFormEmits>();

const titleTextareaRef = ref<HTMLTextAreaElement | null>(null);
const contentTextareaRef = ref<HTMLTextAreaElement | null>(null);

const syncTitleLayout = () => {
  if (!titleTextareaRef.value) {
    return;
  }

  applyAutoTitleWidth(titleTextareaRef.value);
};

const syncContentLayout = () => {
  if (!contentTextareaRef.value) {
    return;
  }

  applyAutoContentHeight(contentTextareaRef.value);
};

const handleTitleInput = (event: Event) => {
  const target = event.target;
  if (target instanceof HTMLTextAreaElement) {
    emit('update:title', target.value);
    applyAutoTitleWidth(target);
  }
};

const handleContentInput = (event: Event) => {
  const target = event.target;
  if (target instanceof HTMLTextAreaElement) {
    emit('update:content', target.value);
    applyAutoContentHeight(target);
  }
};

onMounted(() => {
  syncTitleLayout();
  syncContentLayout();
});

watch(() => props.title, syncTitleLayout);
watch(() => props.content, syncContentLayout);
</script>

<template>
  <div class="memo-register-wrapper">
    <div class="register-row">
      <div class="title-cell">
        <textarea
          ref="titleTextareaRef"
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
          ref="contentTextareaRef"
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

    <div class="register-bottom-row">
      <buttonBaseField
        id="submit"
        label="登録"
        :disabled="isRegisterDisabled"
        @click="emit('submit')"
      />

      <TagSelectionField
        :resetKey="tagSelectionResetKey"
        @update:selectedTitles="emit('update:selectedTitles', $event)"
      />
    </div>
  </div>
</template>
