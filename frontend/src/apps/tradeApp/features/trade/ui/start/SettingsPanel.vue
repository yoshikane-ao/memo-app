<script setup lang="ts">
import { computed } from 'vue';

type Variant = 'blue' | 'neutral' | 'red';

const props = withDefaults(
  defineProps<{
    eyebrow: string;
    title: string;
    variant?: Variant;
    collapsible?: boolean;
    initiallyOpen?: boolean;
    compact?: boolean;
    ariaLabel?: string;
  }>(),
  {
    variant: 'neutral',
    collapsible: false,
    initiallyOpen: true,
    compact: false,
    ariaLabel: undefined,
  },
);

const innerClass = computed(() => [
  'hero-panel__inner',
  `hero-panel__inner--${props.variant}`,
  props.collapsible ? 'mode-details' : null,
  props.compact ? 'hero-panel__inner--compact' : null,
]);
</script>

<template>
  <section class="hero-panel" :aria-label="ariaLabel ?? title">
    <details v-if="collapsible" :class="innerClass" :open="initiallyOpen">
      <summary class="hero-panel__head">
        <p class="hero-panel__eyebrow">{{ eyebrow }}</p>
        <h2>{{ title }}</h2>
      </summary>
      <slot />
    </details>
    <div v-else :class="innerClass">
      <header class="hero-panel__head">
        <p class="hero-panel__eyebrow">{{ eyebrow }}</p>
        <h2>{{ title }}</h2>
      </header>
      <slot />
    </div>
  </section>
</template>

<style scoped>
.hero-panel {
  min-width: 0;
}

.hero-panel__inner {
  height: 100%;
  min-height: 180px;
  padding: 16px 18px 18px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: var(--trade-start-panel-bg);
  backdrop-filter: blur(12px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 18px 40px rgba(0, 0, 0, 0.28);
}

.hero-panel__inner--compact {
  min-height: 148px;
  padding: 10px 12px 12px;
}

.hero-panel__inner--compact .hero-panel__head {
  margin-bottom: 8px;
}

.hero-panel__inner--compact .hero-panel__head h2 {
  font-size: 0.92rem;
}

.hero-panel__inner--compact .hero-panel__eyebrow {
  font-size: 0.64rem;
  letter-spacing: 0.12em;
}

.hero-panel__inner--blue {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 18px 40px rgba(0, 0, 0, 0.28),
    var(--trade-start-glow-p1);
}

.hero-panel__inner--neutral {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 18px 40px rgba(0, 0, 0, 0.28),
    var(--trade-start-glow-neutral);
}

.hero-panel__inner--red {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 18px 40px rgba(0, 0, 0, 0.28),
    var(--trade-start-glow-p2);
}

.hero-panel__head {
  display: grid;
  gap: 2px;
  margin-bottom: 12px;
}

.hero-panel__eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: rgba(221, 232, 255, 0.9);
}

.hero-panel__head h2 {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text-main);
}

.mode-details > summary {
  cursor: pointer;
  list-style: none;
  position: relative;
  padding-right: 24px;
}

.mode-details > summary::-webkit-details-marker {
  display: none;
}

.mode-details > summary::after {
  content: '▾';
  position: absolute;
  top: 0;
  right: 0;
  font-size: 1rem;
  color: rgba(221, 232, 255, 0.6);
  transition: transform 0.18s ease;
}

.mode-details[open] > summary::after {
  transform: rotate(180deg);
}

.hero-panel :deep(.cash-section),
.hero-panel :deep(.segment-grid) {
  gap: 8px;
}

.hero-panel :deep(.mode-button),
.hero-panel :deep(.segment-button) {
  height: 38px;
  border-radius: 10px;
  font-size: 12px;
}

.hero-panel :deep(.cash-grid) {
  gap: 10px;
}

.hero-panel :deep(.field) {
  gap: 6px;
}

.hero-panel :deep(.field-label) {
  font-size: 11px;
}

.hero-panel :deep(.money-input) {
  gap: 8px;
}

.hero-panel :deep(.currency) {
  font-size: 13px;
}

.hero-panel :deep(.field-input) {
  height: 42px;
  font-size: 14px;
  border-radius: 10px;
}

.hero-panel__inner--compact :deep(.mode-button),
.hero-panel__inner--compact :deep(.segment-button) {
  height: 32px;
  font-size: 11px;
}

.hero-panel__inner--compact :deep(.field-label) {
  font-size: 10px;
}

.hero-panel__inner--compact :deep(.field-input) {
  height: 34px;
  font-size: 12px;
}

.hero-panel__inner--compact :deep(.currency) {
  font-size: 12px;
}
</style>
