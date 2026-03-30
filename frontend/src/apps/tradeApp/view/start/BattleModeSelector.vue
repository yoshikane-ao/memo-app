<script setup lang="ts">
import type { BattleMode } from '../../store/useTradeGameStore'

const props = defineProps<{
  modelValue: BattleMode
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: BattleMode): void
}>()

const options: Array<{ value: BattleMode; title: string }> = [
  { value: 'pvp', title: 'P1 VS P2' },
  { value: 'pvc', title: 'P1 VS CPU' },
  { value: 'cvc', title: 'CPU VS CPU' },
]
</script>

<template>
  <div class="segment-grid">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="segment-button"
      :class="{ 'segment-button--active': props.modelValue === option.value }"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.title }}
    </button>
  </div>
</template>

<style scoped>
.segment-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.segment-button {
  height: 42px;
  padding: 0 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(17, 29, 55, 0.84), rgba(9, 17, 32, 0.94));
  color: #f5f7fb;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.segment-button:hover {
  transform: translateY(-1px);
  border-color: rgba(130, 166, 255, 0.28);
}

.segment-button--active {
  border-color: rgba(125, 205, 255, 0.7);
  background: linear-gradient(135deg, rgba(73, 119, 255, 0.9), rgba(58, 198, 255, 0.82));
  box-shadow:
    0 10px 22px rgba(52, 109, 255, 0.22),
    inset 0 1px 0 rgba(255,255,255,0.12);
}

@media (max-width: 900px) {
  .segment-grid {
    grid-template-columns: 1fr;
  }
}
</style>
