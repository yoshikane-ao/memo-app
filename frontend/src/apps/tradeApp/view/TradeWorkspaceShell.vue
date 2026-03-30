<script setup lang="ts">
</script>

<template>
  <section class="trade-workspace-shell">
    <div class="trade-workspace-body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.trade-workspace-shell {
  width: 100%;
  min-width: 0;
  min-height: 0;
  display: block;
}

.trade-workspace-body {
  width: 100%;
  min-width: 0;
  min-height: 0;
  display: block;
}
</style>
