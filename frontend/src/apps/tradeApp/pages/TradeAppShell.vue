<script setup lang="ts">
import { onBeforeMount, onUnmounted } from 'vue';

type ThemeMode = 'light' | 'dark';

let previousTheme: ThemeMode | null = null;

onBeforeMount(() => {
  if (typeof document === 'undefined') return;
  const current = document.documentElement.dataset.theme;
  previousTheme = current === 'light' || current === 'dark' ? current : null;
  document.documentElement.dataset.theme = 'dark';
});

onUnmounted(() => {
  if (typeof document === 'undefined') return;
  if (previousTheme) {
    document.documentElement.dataset.theme = previousTheme;
  }
});
</script>

<template>
  <RouterView />
</template>
