<script setup lang="ts">
import { watch } from "vue";
import { applyAutoHeight, applyAutoWidth } from "../../../../shared/composables/textareaAutosize";
import type { MemoComposerFieldsEmits, MemoComposerFieldsProps } from "./types";

const props = defineProps<MemoComposerFieldsProps>();
const emit = defineEmits<MemoComposerFieldsEmits>();

const handleTitleInput = (event: Event) => {
  const target = event.target;

  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }

  emit("update:title", target.value);
  applyAutoWidth(target);
};

const handleContentInput = (event: Event) => {
  const target = event.target;

  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }

  emit("update:content", target.value);
  applyAutoHeight(target);
};

const syncTitleLayout = (element: Element | null) => {
  if (!(element instanceof HTMLTextAreaElement)) {
    return;
  }

  applyAutoWidth(element);
};

const syncContentLayout = (element: Element | null) => {
  if (!(element instanceof HTMLTextAreaElement)) {
    return;
  }

  applyAutoHeight(element);
};

watch(
  () => props.title,
  () => {
    syncTitleLayout(document.getElementById("memo-compose-title"));
  }
);

watch(
  () => props.content,
  () => {
    syncContentLayout(document.getElementById("memo-compose-content"));
  }
);
</script>

<template>
  <div class="register-row">
    <div class="title-cell">
      <textarea
        id="memo-compose-title"
        :value="title"
        rows="1"
        spellcheck="false"
        class="title-input"
        placeholder="Title"
        @input="handleTitleInput"
      />
    </div>
    <div class="content-cell">
      <textarea
        id="memo-compose-content"
        :value="content"
        rows="2"
        spellcheck="false"
        class="content-input"
        placeholder="Write memo content"
        @input="handleContentInput"
      />
    </div>
  </div>
</template>
