<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label?: string;
    statusMessage?: string;
    compact?: boolean;
  }>(),
  {
    label: '対戦開始',
    statusMessage: '',
    compact: false,
  },
);

const emit = defineEmits<{
  (e: 'start'): void;
}>();
void props;
</script>

<template>
  <section class="hero-profile-hub" aria-label="対戦アクション">
    <div class="hero-profile-hub__inner" :class="{ 'hero-profile-hub__inner--compact': compact }">
      <div class="hero-stage__actions" aria-label="start actions">
        <button type="button" class="hero-action hero-action--blue" @click="emit('start')">
          {{ label }}
        </button>
      </div>
      <p v-if="statusMessage" class="hero-profile-hub__status">{{ statusMessage }}</p>
    </div>
  </section>
</template>

<style scoped>
.hero-profile-hub {
  min-width: 0;
}

.hero-profile-hub__inner {
  height: 100%;
  min-height: 180px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: var(--trade-start-panel-bg);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 18px 40px rgba(0, 0, 0, 0.28),
    var(--trade-start-glow-neutral);
}

.hero-profile-hub__inner--compact {
  min-height: 148px;
  padding: 10px 12px;
  gap: 8px;
}

.hero-profile-hub__inner--compact .hero-action {
  min-height: 46px;
  font-size: clamp(0.85rem, 1vw, 1.05rem);
}

.hero-profile-hub__status {
  margin: 0;
  min-height: 18px;
  font-size: 0.78rem;
  line-height: 1.5;
  color: rgba(216, 225, 244, 0.82);
  text-align: center;
}

.hero-stage__actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  align-content: center;
}

.hero-action {
  min-height: 56px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: var(--text-main);
  font-size: clamp(1rem, 1.2vw, 1.3rem);
  font-weight: 900;
  letter-spacing: 0.06em;
  cursor: pointer;
  backdrop-filter: blur(12px);
  transition:
    transform 0.18s ease,
    filter 0.18s ease,
    box-shadow 0.18s ease;
}

.hero-action:hover {
  transform: translateY(-2px) scale(1.01);
  filter: brightness(1.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 18px 42px rgba(56, 121, 255, 0.45);
}

.hero-action--blue {
  background: linear-gradient(180deg, rgba(77, 140, 255, 0.7), rgba(28, 72, 170, 0.8));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 12px 30px rgba(56, 121, 255, 0.38);
}
</style>
