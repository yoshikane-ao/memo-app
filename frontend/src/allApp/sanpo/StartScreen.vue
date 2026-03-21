<template>
  <div class="screen start-screen">
    <div class="overlay">
      <h2>READY?</h2>
      <p>操作方法：矢印キーで移動 / スペースで攻撃</p>
      <button class="start-btn" @click="$emit('start')">散歩に出かける</button>
    </div>
  </div>
</template>

<style scoped>
.start-screen {
  /* 公開されている風景画像などを仮の背景に設定 */
  background: url('https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&w=600&q=80');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.overlay {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 40px;
  border-radius: 15px;
  text-align: center;
}
.start-btn {
  font-size: 1.5rem;
  padding: 15px 30px;
  background: #859900;
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: transform 0.2s;
}
.start-btn:hover {
  transform: scale(1.1);
}
</style>