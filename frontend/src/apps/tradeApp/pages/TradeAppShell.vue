<script setup lang="ts">
import { onUnmounted, watch } from 'vue';
import { useThemeStore, type ThemeMode } from '../../../shared/theme/useThemeStore';

const theme = useThemeStore();
const previousMode: ThemeMode = theme.mode;

// セットアップ直後（=最初のレンダー前）にダークへ強制し、data-theme と CSS 変数を揃える。
if (theme.mode !== 'dark') {
  theme.setMode('dark');
} else if (typeof document !== 'undefined') {
  // 既に store がダークでも、外側で data-theme が書き換えられた状態を救済する。
  document.documentElement.dataset.theme = 'dark';
}

// 共通ヘッダーのトグルなどから一時的にライトへ切り替えられても、ダーク固定に戻す。
const stopWatcher = watch(
  () => theme.mode,
  (mode) => {
    if (mode !== 'dark') {
      theme.setMode('dark');
    }
  },
);

onUnmounted(() => {
  stopWatcher();
  if (previousMode !== 'dark') {
    theme.setMode(previousMode);
  }
});
</script>

<template>
  <RouterView />
</template>
