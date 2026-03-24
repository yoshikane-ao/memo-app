<script setup lang="ts">
import BaseButton from "../../../../shared/ui/BaseButton.vue";
import { TagSelectionSelect } from "../../../tag";
import MemoComposerFields from "./MemoComposerFields.vue";
import type { MemoComposerFormEmits, MemoComposerFormProps } from "./types";

defineProps<MemoComposerFormProps>();
const emit = defineEmits<MemoComposerFormEmits>();
</script>

<template>
  <div class="memo-register-wrapper">
    <MemoComposerFields
      :title="title"
      :content="content"
      @update:title="emit('update:title', $event)"
      @update:content="emit('update:content', $event)"
      @submit-requested="emit('submit')"
    />

    <div class="register-bottom-row">
      <BaseButton
        id="memo-compose-submit"
        label="Create"
        :disabled="isSubmitDisabled"
        @click="emit('submit')"
      />

      <TagSelectionSelect
        :selectedTags="selectedTags"
        :resetKey="tagSelectionResetKey"
        @update:selectedTags="emit('update:selectedTags', $event)"
        @tag-deleted="emit('tag-deleted', $event)"
      />
    </div>
  </div>
</template>
