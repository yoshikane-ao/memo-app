<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import MemoUpdate from '../memoUpdate/memoUpdate.vue';
import MemoDelete from '../memoDelete/memoDelete.vue';
import MemoCopy from '../memoCopy/memoCopy.vue';
import TagRelationField from '../../tagLogic/tagRelation/tagRelationField.vue';
import type { MemoRowViewEmits, MemoRowViewProps } from '../Types';

const props = defineProps<MemoRowViewProps>();
const emit = defineEmits<MemoRowViewEmits>();

const titleTextareaRef = ref<HTMLTextAreaElement | null>(null);
const contentTextareaRef = ref<HTMLTextAreaElement | null>(null);

const notifyChanged = () => {
  emit('changed');
};

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
  emit('title-input', event);
  syncTitleLayout();
};

const handleContentInput = (event: Event) => {
  emit('content-input', event);
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

      <TagRelationField
        :memoId="memo.id"
        :tags="memo.memo_tags.map(({ tag }) => tag)"
        @changed="notifyChanged"
      />
    </div>

    <div class="actions-cell">
      <MemoCopy :text="`${memo.content}`" />
      <MemoUpdate
        :memoId="memo.id"
        :title="memo.title"
        :content="memo.content"
        :initialTitle="memo.initialTitle"
        :initialContent="memo.initialContent"
        :currentWidth="currentWidth"
        :initialWidth="memo.width ?? undefined"
        :currentHeight="currentHeight"
        :initialHeight="memo.height ?? undefined"
        @updated="notifyChanged"
      />
      <MemoDelete :memoId="memo.id" @deleted="notifyChanged" />
    </div>
  </div>
</template>
