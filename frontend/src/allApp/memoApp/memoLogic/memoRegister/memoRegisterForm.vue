<script setup lang="ts">
import buttonBaseField from '../../../shared/buttonBaseField.vue';
import TagSelectionField from '../../tagLogic/tagSelection/tagSelectionField.vue';
import MemoRegisterFields from './memoRegisterFields.vue';
import type { MemoRegisterFormEmits, MemoRegisterFormProps } from './types';

defineProps<MemoRegisterFormProps>();
const emit = defineEmits<MemoRegisterFormEmits>();
</script>

<template>
  <div class="memo-register-wrapper">
    <MemoRegisterFields
      :title="title"
      :content="content"
      @update:title="emit('update:title', $event)"
      @update:content="emit('update:content', $event)"
    />

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
        @tag-deleted="emit('tag-deleted', $event)"
      />
    </div>
  </div>
</template>
