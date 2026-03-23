<script setup lang="ts">
import MemoLayout from '../memoLayout/memoLayout.vue';
import { useMemoCollection } from '../memoCollection/memoCollection';
import MemoListView from './memoListView.vue';
import MemoRowView from './memoRowView.vue';
import type { MemoDeletedPayload } from '../memoDelete/types';
import type { MemoUpdatedPayload } from '../memoUpdate/types';
import type { MemoListEmits, MemoListProps } from './types';

const props = defineProps<MemoListProps>();
const emit = defineEmits<MemoListEmits>();
const { updateMemoField } = useMemoCollection();

const notifyChanged = () => {
  emit('changed');
};

const updateItems = (items: MemoListProps['items']) => {
  if (!props.canSort) {
    return;
  }

  emit('update:items', items);
};

const handleSorted = (items: MemoListProps['items']) => {
  if (!props.canSort) {
    return;
  }

  emit('sort-saved', items);
};

const handleUpdated = (payload: MemoUpdatedPayload) => {
  emit('memo-updated', payload);
};

const handleDeleted = (memoId: MemoDeletedPayload) => {
  emit('memo-deleted', memoId);
};

const handleMemoFieldUpdate = (memoId: number, field: 'title' | 'content', value: string) => {
  updateMemoField(memoId, field, value);
};
</script>

<template>
  <MemoLayout
    v-slot="{ syncTitleLayout, syncContentLayout, getTitleWidth, getContentHeight, getCurrentWidth, getCurrentHeight }"
  >
    <MemoListView
      :items="items"
      :canSort="canSort"
      @update:items="updateItems"
      @sort-saved="handleSorted"
    >
      <template #default="{ memo }">
        <MemoRowView
          :memo="memo"
          :titleWidth="getTitleWidth(memo)"
          :contentHeight="getContentHeight(memo)"
          :currentWidth="getCurrentWidth(memo)"
          :currentHeight="getCurrentHeight(memo)"
          :syncTitleLayout="syncTitleLayout"
          :syncContentLayout="syncContentLayout"
          @title-input="handleMemoFieldUpdate(memo.id, 'title', $event)"
          @content-input="handleMemoFieldUpdate(memo.id, 'content', $event)"
          @changed="notifyChanged"
          @memo-updated="handleUpdated"
          @memo-deleted="handleDeleted"
        />
      </template>
    </MemoListView>
  </MemoLayout>
</template>
