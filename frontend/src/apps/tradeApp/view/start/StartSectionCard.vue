<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="start-section-card">
    <header class="section-head">
      <h2>{{ title }}</h2>
      <p v-if="description">{{ description }}</p>
    </header>

    <div class="section-body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.start-section-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  padding: 11px 13px;
  background:
    linear-gradient(180deg, rgba(11, 20, 40, 0.9), rgba(7, 14, 28, 0.96)),
    linear-gradient(90deg, rgba(83, 133, 255, 0.06), transparent 55%, rgba(255, 98, 118, 0.06));
  border: 1px solid rgba(130, 150, 196, 0.16);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.04),
    0 14px 30px rgba(0, 0, 0, 0.24);
  min-height: 0;
}

.start-section-card::before {
  content: '';
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, rgba(86, 133, 255, 0.92), rgba(255, 103, 126, 0.72));
  opacity: 0.82;
}

.section-head {
  margin-bottom: 9px;
}

h2 {
  margin: 0 0 2px;
  font-size: 14px;
  line-height: 1.2;
  color: #f3f8ff;
}

p {
  margin: 0;
  font-size: 11px;
  line-height: 1.35;
  color: #9fb0d4;
}

.section-body {
  min-width: 0;
}
</style>
