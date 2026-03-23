<script setup lang="ts">
import MemoLayout from '../memoLayout/memoLayout.vue';
import MemoListView from './memoListView.vue';
import MemoRowView from './memoRowView.vue';
import type { MemoListItem } from '../types/memo-domain.types';
import type { MemoListRowsEmits, MemoListRowsProps } from './types';

defineProps<MemoListRowsProps>();
const emit = defineEmits<MemoListRowsEmits>();

defineSlots<{
  tags(props: { memo: MemoListItem }): any;
  actions(props: { memo: MemoListItem; currentWidth?: number; currentHeight?: number }): any;
}>();
</script>

<template>
  <MemoLayout
    v-slot="{ syncTitleLayout, syncContentLayout, getTitleWidth, getContentHeight, getCurrentWidth, getCurrentHeight }"
  >
    <MemoListView
      :items="items"
      :canSort="canSort"
      @update:items="emit('update:items', $event)"
      @sort-saved="emit('sort-saved', $event)"
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
          @title-input="emit('title-input', { memoId: memo.id, value: $event })"
          @content-input="emit('content-input', { memoId: memo.id, value: $event })"
        >
          <template #tags>
            <slot name="tags" :memo="memo" />
          </template>

          <template #actions="{ currentWidth, currentHeight }">
            <slot
              name="actions"
              :memo="memo"
              :currentWidth="currentWidth"
              :currentHeight="currentHeight"
            />
          </template>
        </MemoRowView>
      </template>
    </MemoListView>
  </MemoLayout>
</template>
