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
  border-radius: 14px;
  padding: 9px 11px;
  background: rgba(13, 21, 40, 0.84);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.2);
  min-height: 0;
}

.section-head {
  margin-bottom: 6px;
}

h2 {
  margin: 0 0 2px;
  font-size: 14px;
  line-height: 1.2;
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
