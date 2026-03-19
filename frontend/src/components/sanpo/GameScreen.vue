<template>
  <div class="screen game-screen" ref="gameArea">
    <div class="ui-layer">
      <span class="score">SCORE: {{ score }}</span>
    </div>

    <div 
      class="player" 
      :style="{ left: player.x + 'px', top: player.y + 'px' }"
    >
      🚶‍♂️
    </div>

    <div 
      v-for="enemy in enemies" 
      :key="enemy.id" 
      class="enemy" 
      :style="{ left: enemy.x + 'px', top: enemy.y + 'px' }"
    >
      👾
    </div>

    <div 
      v-for="bullet in bullets" 
      :key="bullet.id" 
      class="bullet" 
      :style="{ left: bullet.x + 'px', top: bullet.y + 'px' }"
    ></div>

    <div v-if="isGameOver" class="modal">
      <div class="modal-content">
        <h2>GAME OVER</h2>
        <p>最終スコア: {{ score }}</p>
        <button @click="resetGame">もう一度</button>
        <button @click="$emit('toMenu')">終了する</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['toMenu']);

// ゲーム設定
const AREA_WIDTH = 400;
const AREA_HEIGHT = 500;
const PLAYER_SPEED = 10;

const score = ref(0);
const isGameOver = ref(false);
const player = reactive({ x: 180, y: 400, w: 40, h: 40 });
const enemies = ref([]);
const bullets = ref([]);
let gameLoopId = null;

// キー入力状態の管理
const keys = {};

const handleKeyDown = (e) => { keys[e.key] = true; if (e.key === ' ') fire(); };
const handleKeyUp = (e) => { keys[e.key] = false; };

const fire = () => {
  if (isGameOver.value) return;
  bullets.value.push({
    id: Date.now(),
    x: player.x + 15,
    y: player.y,
  });
};

const update = () => {
  if (isGameOver.value) return;

  // --- 主人公の移動 (縦横) ---
  if ((keys['ArrowUp'] || keys['w']) && player.y > 0) player.y -= PLAYER_SPEED;
  if ((keys['ArrowDown'] || keys['s']) && player.y < AREA_HEIGHT - player.h) player.y += PLAYER_SPEED;
  if ((keys['ArrowLeft'] || keys['a']) && player.x > 0) player.x -= PLAYER_SPEED;
  if ((keys['ArrowRight'] || keys['d']) && player.x < AREA_WIDTH - player.w) player.x += PLAYER_SPEED;

  // --- 弾の移動 ---
  bullets.value.forEach((b, i) => {
    b.y -= 10;
    if (b.y < -20) bullets.value.splice(i, 1);
  });

  // --- 敵の生成と移動 ---
  if (Math.random() < 0.03) {
    enemies.value.push({
      id: Math.random(),
      x: Math.random() * (AREA_WIDTH - 30),
      y: -30
    });
  }

  enemies.value.forEach((en, ei) => {
    en.y += 4;

    // 衝突判定: 主人公 vs 敵
    if (
      player.x < en.x + 30 && player.x + player.w > en.x &&
      player.y < en.y + 30 && player.y + player.h > en.y
    ) {
      gameOver();
    }

    // 衝突判定: 弾 vs 敵
    bullets.value.forEach((b, bi) => {
      if (
        b.x < en.x + 30 && b.x + 10 > en.x &&
        b.y < en.y + 30 && b.y + 10 > en.y
      ) {
        enemies.value.splice(ei, 1);
        bullets.value.splice(bi, 1);
        score.value += 100;
      }
    });

    if (en.y > AREA_HEIGHT) enemies.value.splice(ei, 1);
  });

  gameLoopId = requestAnimationFrame(update);
};

const gameOver = () => {
  isGameOver.value = true;
  cancelAnimationFrame(gameLoopId);
};

const resetGame = () => {
  score.value = 0;
  isGameOver.value = false;
  player.x = 180; player.y = 400;
  enemies.value = [];
  bullets.value = [];
  gameLoopId = requestAnimationFrame(update);
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  gameLoopId = requestAnimationFrame(update);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  cancelAnimationFrame(gameLoopId);
});
</script>

<style scoped>
.game-screen {
  background: #eee;
  position: relative;
  overflow: hidden;
  height: 500px;
}
.ui-layer {
  position: absolute;
  top: 10px; left: 10px;
  z-index: 10;
  font-weight: bold;
}
.player {
  position: absolute;
  font-size: 40px;
  z-index: 5;
}
.enemy {
  position: absolute;
  font-size: 30px;
}
.bullet {
  position: absolute;
  width: 6px; height: 15px;
  background: #d33682;
  border-radius: 3px;
}
.modal {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-content {
  background: white;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
}
</style>