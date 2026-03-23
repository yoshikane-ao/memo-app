<script setup lang="ts">
import MemoListView from './memoListView.vue';
import MemoRowView from './memoRowView.vue';
import { useMemoListState } from './memoList';
import type { MemoListEmits, MemoListProps } from '../Types';

const props = defineProps<MemoListProps>();
const emit = defineEmits<MemoListEmits>();

const {
  updateMemoField,
  checkResize,
  getTitleWidth,
  getContentHeight,
  getCurrentWidth,
  getCurrentHeight
} = useMemoListState();

const notifyChanged = () => {
  emit('changed');
};

const updateItems = (items: MemoListProps['items']) => {
  if (!props.canSort) {
    return;
  }

  emit('update:items', items);
};

const handleSorted = () => {
  if (!props.canSort) {
    return;
  }

  emit('sorted');
};
</script>

<template>
  <MemoListView
    :items="items"
    :canSort="canSort"
    @update:items="updateItems"
    @sorted="handleSorted"
  >
    <template #default="{ memo }">
      <MemoRowView
        :memo="memo"
        :titleWidth="getTitleWidth(memo)"
        :contentHeight="getContentHeight(memo)"
        :currentWidth="getCurrentWidth(memo)"
        :currentHeight="getCurrentHeight(memo)"
        @title-input="updateMemoField(memo, 'title', $event)"
        @content-input="updateMemoField(memo, 'content', $event)"
        @title-resize="checkResize(memo.id, $event, 'width')"
        @content-resize="checkResize(memo.id, $event, 'height')"
        @changed="notifyChanged"
      />
    </template>
  </MemoListView>
</template>
