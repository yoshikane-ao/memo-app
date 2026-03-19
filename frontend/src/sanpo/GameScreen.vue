<template>
  <div class="screen game-screen">
    <div class="hud">
      <div class="score">SCORE: {{ score }}</div>
      <div v-if="isGameOver" class="game-over">
        <h2>GAME OVER</h2>
        <p>Spaceキーで戻る</p>
      </div>
    </div>
    <canvas ref="canvasRef" width="600" height="400"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['finish-game']);
const score = ref(0);
const isGameOver = ref(false);
const canvasRef = ref(null);

let ctx, animationId;
let player = { x: 50, y: 180, w: 40, h: 40 };
let enemies = [];
let bullets = [];

const spawnEnemy = () => {
  if (Math.random() < 0.03 && !isGameOver.value) {
    enemies.push({ x: 620, y: Math.random() * 350, w: 30, h: 30, speed: 4 + (score.value / 1000) });
  }
};

const update = () => {
  if (isGameOver.value) return;

  // 弾の移動
  bullets.forEach((b, i) => {
    b.x += 8;
    if (b.x > 600) bullets.splice(i, 1);
  });

  // 敵の移動と判定
  enemies.forEach((en, ei) => {
    en.x -= en.speed;
    
    // 衝突判定（主人公）
    if (en.x < player.x + player.w && en.x + en.w > player.x && 
        en.y < player.y + player.h && en.y + en.h > player.y) {
      isGameOver.value = true;
    }

    // 衝突判定（弾）
    bullets.forEach((bu, bi) => {
      if (bu.x < en.x + en.w && bu.x + 10 > en.x && 
          bu.y < en.y + en.h && bu.y + 5 > en.y) {
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        score.value += 100;
      }
    });

    if (en.x < -40) enemies.splice(ei, 1);
  });

  spawnEnemy();
};

const draw = () => {
  ctx.clearRect(0, 0, 600, 400);

  // 主人公（本来はここでdrawImage）
  ctx.font = "40px Arial";
  ctx.fillText("🚶", player.x, player.y + 35);

  // 敵
  ctx.fillText("👻", ...enemies.map(e => [e.x, e.y + 25]).flat()); 
  // ※簡略化のためループ描画
  enemies.forEach(e => ctx.fillText("👾", e.x, e.y + 25));

  // 弾
  ctx.fillStyle = "#ffeb3b";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 10, 5));
};

const loop = () => {
  update();
  draw();
  animationId = requestAnimationFrame(loop);
};

const handleKey = (e) => {
  if (isGameOver.value) {
    if (e.code === 'Space') emit('finish-game', score.value);
    return;
  }
  if (e.code === 'ArrowUp') player.y = Math.max(0, player.y - 15);
  if (e.code === 'ArrowDown') player.y = Math.min(360, player.y + 15);
  if (e.code === 'Space') bullets.push({ x: player.x + 30, y: player.y + 15 });
};

onMounted(() => {
  ctx = canvasRef.value.getContext('2d');
  window.addEventListener('keydown', handleKey);
  loop();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey);
  cancelAnimationFrame(animationId);
});
</script>

<style scoped>
.game-screen { position: relative; background: #333; overflow: hidden; }
canvas { background: #fff; display: block; margin: 0 auto; }
.hud { position: absolute; width: 100%; top: 10px; pointer-events: none; color: #333; }
.score { font-size: 24px; font-weight: bold; text-align: left; padding-left: 20px; }
.game-over { 
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: rgba(255, 0, 0, 0.8); color: white; padding: 2rem; border-radius: 10px; text-align: center;
}
</style>