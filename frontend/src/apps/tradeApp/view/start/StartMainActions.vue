<script setup lang="ts">
export type StartEntryTab = 'local' | 'online' | 'record'

const props = defineProps<{
  modelValue: StartEntryTab
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: StartEntryTab): void
}>()

const buttons: Array<{ value: StartEntryTab; label: string; tone: 'blue' | 'green' | 'violet' }> = [
  { value: 'local', label: 'ローカル対戦', tone: 'blue' },
  { value: 'online', label: 'オンライン対戦', tone: 'green' },
  { value: 'record', label: '成績', tone: 'violet' },
]
</script>

<template>
  <div class="main-actions-card">
    <div class="actions-grid">
      <button
        v-for="button in buttons"
        :key="button.value"
        type="button"
        class="action-button"
        :class="[
          `action-button--${button.tone}`,
          { 'action-button--active': props.modelValue === button.value },
        ]"
        @click="emit('update:modelValue', button.value)"
      >
        <span class="action-button__glow" />
        <span class="action-button__label">{{ button.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.main-actions-card {
  position: relative;
  margin-top: -36px;
  z-index: 2;
  padding-inline: 28px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.action-button {
  position: relative;
  height: 82px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 22px;
  overflow: hidden;
  cursor: pointer;
  color: #f8fbff;
  font-weight: 900;
  font-size: clamp(24px, 2.4vw, 32px);
  letter-spacing: 0.02em;
  background: rgba(10, 16, 32, 0.82);
  box-shadow:
    0 22px 40px rgba(0, 0, 0, 0.34),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    filter 0.18s ease;
}

.action-button:hover {
  transform: translateY(-2px);
  filter: brightness(1.04);
}

.action-button:active {
  transform: translateY(0) scale(0.985);
}

.action-button__glow,
.action-button__label {
  position: absolute;
  inset: 0;
}

.action-button__glow {
  opacity: 0.76;
  transition: opacity 0.18s ease;
}

.action-button__label {
  display: grid;
  place-items: center;
  z-index: 1;
  text-shadow: 0 0 16px rgba(255, 255, 255, 0.2), 0 4px 18px rgba(0, 0, 0, 0.48);
}

.action-button--blue .action-button__glow {
  background:
    radial-gradient(circle at 50% 50%, rgba(123, 215, 255, 0.34), transparent 44%),
    linear-gradient(135deg, rgba(74, 150, 255, 0.82), rgba(90, 205, 255, 0.4));
}

.action-button--green .action-button__glow {
  background:
    radial-gradient(circle at 50% 50%, rgba(164, 255, 216, 0.34), transparent 44%),
    linear-gradient(135deg, rgba(43, 194, 126, 0.82), rgba(96, 232, 197, 0.38));
}

.action-button--violet .action-button__glow {
  background:
    radial-gradient(circle at 50% 50%, rgba(234, 167, 255, 0.34), transparent 44%),
    linear-gradient(135deg, rgba(138, 94, 255, 0.8), rgba(212, 120, 255, 0.42));
}

.action-button--active {
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow:
    0 28px 46px rgba(0, 0, 0, 0.42),
    0 0 28px rgba(119, 184, 255, 0.22),
    inset 0 0 0 1px rgba(255, 255, 255, 0.16);
}

.action-button--active .action-button__glow {
  opacity: 1;
}

@media (max-width: 900px) {
  .main-actions-card {
    padding-inline: 16px;
    margin-top: -28px;
  }

  .actions-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .action-button {
    height: 70px;
    border-radius: 18px;
    font-size: 24px;
  }
}
</style>
