<script setup lang="ts"></script>

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
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex: 1 1 auto;
  overflow: hidden;
}

.trade-workspace-body {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex: 1 1 auto;
  overflow: hidden;
}
</style>
