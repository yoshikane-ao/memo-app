<script setup lang="ts">
const props = defineProps<{
  backgroundImageUrl: string
}>()
</script>

<template>
  <section class="start-hero" :style="{ '--hero-image': `url(${props.backgroundImageUrl})` }">
    <div class="hero-backdrop" />
    <div class="hero-vignette" />
    <div class="hero-scan hero-scan--blue" />
    <div class="hero-scan hero-scan--red" />
  </section>
</template>

<style scoped>
.start-hero {
  position: relative;
  min-height: 300px;
  border-radius: 28px;
  overflow: hidden;
  isolation: isolate;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background:
    linear-gradient(180deg, rgba(4, 8, 18, 0.12), rgba(4, 8, 18, 0.34)),
    var(--hero-image) center center / cover no-repeat;
  box-shadow:
    0 28px 80px rgba(0, 0, 0, 0.42),
    inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.hero-backdrop,
.hero-vignette,
.hero-scan {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-backdrop {
  background:
    radial-gradient(circle at 28% 52%, rgba(65, 148, 255, 0.22), transparent 34%),
    radial-gradient(circle at 73% 48%, rgba(255, 79, 79, 0.22), transparent 32%),
    linear-gradient(180deg, rgba(3, 6, 16, 0.02), rgba(2, 5, 14, 0.24));
}

.hero-vignette {
  background:
    linear-gradient(180deg, rgba(4, 7, 16, 0.04) 0%, rgba(4, 7, 16, 0.16) 52%, rgba(4, 7, 16, 0.48) 100%),
    radial-gradient(circle at center, transparent 58%, rgba(2, 3, 8, 0.34) 100%);
}

.hero-scan {
  width: 42%;
  filter: blur(14px);
  opacity: 0.45;
  animation: pulse 5.8s ease-in-out infinite;
}

.hero-scan--blue {
  left: -8%;
  background: radial-gradient(circle at 40% 50%, rgba(68, 148, 255, 0.28), transparent 68%);
}

.hero-scan--red {
  inset: 0 0 0 auto;
  right: -8%;
  background: radial-gradient(circle at 60% 50%, rgba(255, 88, 88, 0.28), transparent 68%);
  animation-delay: 1.4s;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.22;
    transform: scale(1);
  }

  50% {
    opacity: 0.4;
    transform: scale(1.04);
  }
}

@media (max-width: 900px) {
  .start-hero {
    min-height: 260px;
    border-radius: 22px;
  }
}
</style>
