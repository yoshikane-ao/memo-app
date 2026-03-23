<script setup lang="ts">
import buttonBaseField from '../../../shared/buttonBaseField.vue';
import TagSelectionField from '../../tagLogic/tagSelection/tagSelectionField.vue';
import type { MemoRegisterFormEmits, MemoRegisterFormProps } from '../Types';

const props = defineProps<MemoRegisterFormProps>();
const emit = defineEmits<MemoRegisterFormEmits>();

const handleTitleInput = (event: Event) => {
  const target = event.target;
  if (target instanceof HTMLTextAreaElement) {
    emit('update:title', target.value);
  }
};

const handleContentInput = (event: Event) => {
  const target = event.target;
  if (target instanceof HTMLTextAreaElement) {
    emit('update:content', target.value);
  }
};
</script>

<template>
  <div class="memo-register-wrapper">
    <div class="register-row">
      <div class="title-cell">
        <textarea
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
