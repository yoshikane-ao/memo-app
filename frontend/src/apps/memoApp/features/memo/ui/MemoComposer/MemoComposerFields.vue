<script setup lang="ts">
import { nextTick, watch } from "vue";
import { applyAutoHeight } from "../../../../../../shared/composables/textareaAutosize";
import {
  handleMultilineEnterSubmit,
  handleSingleLineEnterSubmit,
} from "../../../../../../shared/keyboard/handleEnterSubmit";
import type { MemoComposerFieldsEmits, MemoComposerFieldsProps } from "./types";

const props = defineProps<MemoComposerFieldsProps>();
const emit = defineEmits<MemoComposerFieldsEmits>();

const handleTitleInput = (event: Event) => {
  const target = event.target;

  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }

  emit("update:title", target.value);
  applyAutoHeight(target);
};

const handleContentInput = (event: Event) => {
  const target = event.target;

  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }

  emit("update:content", target.value);
  applyAutoHeight(target);
};

const handleTitleKeydown = (event: KeyboardEvent) => {
  handleSingleLineEnterSubmit(
    event,
    () => emit("submit-requested"),
    () => props.title.trim() !== "" && props.content.trim() !== ""
  );
};

const handleContentKeydown = (event: KeyboardEvent) => {
  handleMultilineEnterSubmit(
    event,
    () => emit("submit-requested"),
    () => props.title.trim() !== "" && props.content.trim() !== ""
  );
};

const syncTitleLayout = (element: Element | null) => {
  if (!(element instanceof HTMLTextAreaElement)) {
    return;
  }

  applyAutoHeight(element);
};

const syncContentLayout = (element: Element | null) => {
  if (!(element instanceof HTMLTextAreaElement)) {
    return;
  }

  applyAutoHeight(element);
};

watch(
  () => props.title,
  async () => {
    await nextTick();
    syncTitleLayout(document.getElementById("memo-compose-title"));
  }
);

watch(
  () => props.content,
  async () => {
    await nextTick();
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
        @keydown="handleTitleKeydown"
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
        @keydown="handleContentKeydown"
      />
    </div>
  </div>
</template>
