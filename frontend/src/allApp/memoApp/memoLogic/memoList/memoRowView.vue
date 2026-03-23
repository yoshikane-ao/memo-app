<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { MemoRowViewEmits, MemoRowViewProps } from './types';

const props = defineProps<MemoRowViewProps>();
const emit = defineEmits<MemoRowViewEmits>();

const titleTextareaRef = ref<HTMLTextAreaElement | null>(null);
const contentTextareaRef = ref<HTMLTextAreaElement | null>(null);

const syncTitleLayout = () => {
  if (!titleTextareaRef.value) {
    return;
  }

  props.syncTitleLayout(props.memo.id, titleTextareaRef.value);
};

const syncContentLayout = () => {
  if (!contentTextareaRef.value) {
    return;
  }

  props.syncContentLayout(props.memo.id, contentTextareaRef.value);
};

const handleTitleInput = (event: Event) => {
  const target = event.target;

  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }

  emit('title-input', target.value);
  syncTitleLayout();
};

const handleContentInput = (event: Event) => {
  const target = event.target;

  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }

  emit('content-input', target.value);
  syncContentLayout();
};

onMounted(() => {
  syncTitleLayout();
  syncContentLayout();
});

watch(() => props.memo.title, syncTitleLayout);
watch(() => props.memo.content, syncContentLayout);
</script>

<template>
  <div class="memo-row">
    <div class="title-cell">
      <textarea
        ref="titleTextareaRef"
        :id="`title-${memo.id}`"
        :value="memo.title"
        :style="{ width: titleWidth }"
        rows="1"
        spellcheck="false"
        class="title-input"
        @input="handleTitleInput"
      />
    </div>

    <div class="content-cell">
      <textarea
        ref="contentTextareaRef"
        :id="`content-${memo.id}`"
        :value="memo.content"
        :style="{ height: contentHeight }"
        rows="2"
        spellcheck="false"
        class="content-input"
        @input="handleContentInput"
      />

      <slot name="tags" :memo="memo" />
    </div>

    <div class="actions-cell">
      <slot
        name="actions"
        :memo="memo"
        :currentWidth="currentWidth"
        :currentHeight="currentHeight"
      />
    </div>
  </div>
</template>
