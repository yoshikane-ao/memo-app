<script setup lang="ts">
import { onBeforeMount, onUnmounted, watch } from 'vue';
import { useThemeStore, type ThemeMode } from '../../../shared/theme/useThemeStore';

const theme = useThemeStore();
let previousMode: ThemeMode | null = null;
let stopWatcher: (() => void) | null = null;

onBeforeMount(() => {
  previousMode = theme.mode;
  if (theme.mode !== 'dark') {
    theme.setMode('dark');
  }
  // 共通ヘッダーのトグルなどから一時的にライトへ切り替えられても、ダーク固定に戻す。
  stopWatcher = watch(
    () => theme.mode,
    (mode) => {
      if (mode !== 'dark') {
        theme.setMode('dark');
      }
    },
  );
});

onUnmounted(() => {
  stopWatcher?.();
  stopWatcher = null;
  if (previousMode && previousMode !== 'dark') {
    theme.setMode(previousMode);
  }
  previousMode = null;
});
</script>

<template>
  <RouterView />
</template>
