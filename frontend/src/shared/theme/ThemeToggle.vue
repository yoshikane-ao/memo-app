<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore } from './useThemeStore';

const theme = useThemeStore();
const label = computed(() =>
  theme.mode === 'light' ? 'ダークモードに切替' : 'ライトモードに切替',
);
const indicator = computed(() => (theme.mode === 'light' ? 'Light' : 'Dark'));
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="label"
    :title="label"
    @click="theme.toggle()"
  >
    <span class="theme-toggle-icon" aria-hidden="true">
      {{ theme.mode === 'light' ? '☾' : '☀' }}
    </span>
    <span class="theme-toggle-label">{{ indicator }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--menu-border, rgba(30, 20, 10, 0.12));
  background: var(--menu-compact-bg, rgba(30, 20, 10, 0.04));
  color: var(--menu-text, #1f1d1a);
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.theme-toggle:hover {
  color: var(--menu-accent-strong, #a55427);
  border-color: rgba(200, 106, 56, 0.32);
  background: var(--menu-accent-soft, rgba(200, 106, 56, 0.12));
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--menu-accent, #c86a38);
  outline-offset: 2px;
}

.theme-toggle-icon {
  font-size: 0.96rem;
  line-height: 1;
}

.theme-toggle-label {
  letter-spacing: 0.06em;
}

@media (prefers-reduced-motion: reduce) {
  .theme-toggle {
    transition: none;
  }
}
</style>
