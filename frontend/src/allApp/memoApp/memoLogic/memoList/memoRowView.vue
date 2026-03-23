<script setup lang="ts">
import MemoUpdate from '../memoUpdate/memoUpdate.vue';
import MemoDelete from '../memoDelete/memoDelete.vue';
import MemoCopy from '../memoCopy/memoCopy.vue';
import TagRelationField from '../../tagLogic/tagRelation/tagRelationField.vue';
import type { MemoRowViewEmits, MemoRowViewProps } from '../Types';

const props = defineProps<MemoRowViewProps>();
const emit = defineEmits<MemoRowViewEmits>();

const notifyChanged = () => {
  emit('changed');
};
</script>

<template>
  <div class="memo-row">
    <div class="title-cell">
      <textarea
        :id="`title-${memo.id}`"
        :value="memo.title"
        :style="{ width: titleWidth }"
        rows="1"
        spellcheck="false"
        class="title-input"
        @input="emit('title-input', $event)"
        @mouseup="emit('title-resize', $event)"
      />
    </div>

    <div class="content-cell">
      <textarea
        :id="`content-${memo.id}`"
        :value="memo.content"
        :style="{ height: contentHeight }"
        rows="2"
        spellcheck="false"
        class="content-input"
        @input="emit('content-input', $event)"
        @mouseup="emit('content-resize', $event)"
      />

      <TagRelationField
        :memoId="memo.id"
        :tags="memo.memo_tags.map(({ tag }) => tag)"
        @changed="notifyChanged"
      />
    </div>

    <div class="actions-cell">
      <MemoCopy :text="`${memo.title}\n\n${memo.content}`" />
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
