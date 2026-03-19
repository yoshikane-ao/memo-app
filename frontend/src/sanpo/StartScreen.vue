<template>
  <div class="screen start-screen">
    <div class="overlay">
      <h2 class="ready-text">READY?</h2>
      <button @click="$emit('start-game')" class="start-btn">
        <span class="icon">👟</span> 散歩をはじめる
      </button>
      <button @click="$emit('back-to-menu')" class="back-btn">メニューへ戻る</button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['start-game', 'back-to-menu']);
</script>

<style scoped>
.start-screen {
  /* 背景画像。assets等に配置した画像を指定してください */
  background-image: url('https://images.unsplash.com/photo-1444491741275-3747c53c99b4?q=80&w=600&h=400&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
  position: relative;
  height: 100%;
}
.overlay {
  background: rgba(0, 0, 0, 0.4);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.ready-text { color: white; font-size: 4rem; font-style: italic; margin-bottom: 2rem; }
.start-btn {
  padding: 1.5rem 3rem;
  font-size: 1.5rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 5px #2e7d32;
}
.start-btn:active { transform: translateY(4px); box-shadow: 0 1px #2e7d32; }
.back-btn { margin-top: 20px; background: none; border: 1px solid white; color: white; cursor: pointer; }
</style>