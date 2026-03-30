<script setup lang="ts">
const startImageUrl = '/public/start-image.png'
</script>

<template>
  <main class="trade-start-page">
    <section class="start-visual-shell" aria-label="トレードゲームのスタート画面">
      <img class="start-visual" :src="startImageUrl" alt="CLASH CAPITAL スタート画面ビジュアル" draggable="false" />
    </section>
  </main>
</template>

<style scoped>
.trade-start-page {
  width: calc(100% + 24px);
  margin: 0 -12px -16px;
  overflow-x: clip;
  overflow-y: visible;
  background: #05070d;
}

.start-visual-shell {
  width: 100%;
  overflow-x: clip;
  overflow-y: visible;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: #05070d;
}

.start-visual {
  display: block;
  width: 100%;
  min-width: 100%;
  max-width: none;
  height: auto;
  object-fit: contain;
  object-position: top center;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

@media (max-width: 768px) {
  .trade-start-page {
    width: calc(100% + 20px);
    margin: 0 -10px -12px;
  }
}
</style>
