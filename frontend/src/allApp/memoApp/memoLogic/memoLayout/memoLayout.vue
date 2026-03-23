<script setup lang="ts">
import { useMemoLayoutState } from './memoLayout';
import type { MemoLayoutSlotProps } from '../Types';

defineSlots<{
  default(props: MemoLayoutSlotProps): any;
}>();

const {
  syncTitleLayout,
  syncContentLayout,
  getTitleWidth,
  getContentHeight,
  getCurrentWidth,
  getCurrentHeight
} = useMemoLayoutState();
</script>

<template>
  <slot
    :syncTitleLayout="syncTitleLayout"
    :syncContentLayout="syncContentLayout"
    :getTitleWidth="getTitleWidth"
    :getContentHeight="getContentHeight"
    :getCurrentWidth="getCurrentWidth"
    :getCurrentHeight="getCurrentHeight"
  />
</template>
