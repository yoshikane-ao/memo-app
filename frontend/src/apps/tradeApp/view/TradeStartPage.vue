<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  useTradeGameStore,
  type TradeDifficulty,
  type FirstPlayer,
} from '../store/useTradeGameStore'

const router = useRouter()
const gameStore = useTradeGameStore()

const playerName = ref('PLAYER 1')
const difficulty = ref<TradeDifficulty>('normal')
const firstPlayer = ref<FirstPlayer>('p1')

const startBattle = () => {
  gameStore.initializeGame({
    playerName: playerName.value.trim() || 'PLAYER 1',
    difficulty: difficulty.value,
    firstPlayer: firstPlayer.value,
  })

  router.push({ name: 'trade-battle' })
}
</script>

<template>
  <main class="trade-start-page">
    <section class="start-panel">
      <div class="hero">
        <p class="eyebrow">TURN-BASED STOCK BATTLE</p>
        <h1>トレーディングバトル</h1>
        <p class="description">
          投資・投機・空売り・会社行動を使って、
          相手より総資産を増やして勝利を目指す対戦ゲームです。
        </p>
      </div>

      <div class="settings-grid">
        <label class="setting-card">
          <span class="label">プレイヤー名</span>
          <input
            v-model="playerName"
            type="text"
            maxlength="20"
            placeholder="PLAYER 1"
          />
        </label>

        <label class="setting-card">
          <span class="label">難易度</span>
          <select v-model="difficulty">
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        <label class="setting-card">
          <span class="label">先攻</span>
          <select v-model="firstPlayer">
            <option value="p1">プレイヤー1</option>
            <option value="p2">プレイヤー2</option>
          </select>
        </label>
      </div>

      <div class="summary-card">
        <h2>開始設定</h2>
        <dl class="summary-list">
          <div>
            <dt>名前</dt>
            <dd>{{ playerName || 'PLAYER 1' }}</dd>
          </div>
          <div>
            <dt>難易度</dt>
            <dd>{{ difficulty }}</dd>
          </div>
          <div>
            <dt>先攻</dt>
            <dd>{{ firstPlayer === 'p1' ? 'プレイヤー1' : 'プレイヤー2' }}</dd>
          </div>
        </dl>
      </div>

      <div class="actions">
        <button class="start-button" @click="startBattle">
          バトル開始
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.trade-start-page {
  min-height: 100vh;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(120, 160, 255, 0.18), transparent 28%),
    radial-gradient(circle at top right, rgba(255, 120, 120, 0.14), transparent 25%),
    #0a0f1c;
  color: #f5f7fb;
  display: grid;
  place-items: center;
  box-sizing: border-box;
}

.start-panel {
  width: min(1100px, 100%);
  display: grid;
  gap: 20px;
}

.hero,
.setting-card,
.summary-card {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(13, 21, 40, 0.82);
  border-radius: 20px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
}

.hero {
  padding: 28px;
}

.eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.16em;
  color: #9fb5ff;
}

.hero h1 {
  margin: 0 0 12px;
  font-size: clamp(32px, 4vw, 48px);
  line-height: 1.1;
}

.description {
  margin: 0;
  color: #c5d0ea;
  line-height: 1.7;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.setting-card {
  padding: 18px;
  display: grid;
  gap: 10px;
}

.label {
  font-size: 13px;
  color: #a7b8df;
}

.setting-card input,
.setting-card select {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: #0c1427;
  color: #f5f7fb;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
}

.summary-card {
  padding: 20px;
}

.summary-card h2 {
  margin: 0 0 16px;
  font-size: 18px;
}

.summary-list {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.summary-list div {
  padding: 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
}

.summary-list dt {
  margin: 0 0 8px;
  font-size: 12px;
  color: #9fb0d4;
}

.summary-list dd {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.actions {
  display: flex;
  justify-content: center;
}

.start-button {
  min-width: 240px;
  border: none;
  border-radius: 14px;
  padding: 16px 24px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  color: #08101f;
  background: linear-gradient(135deg, #7fd0ff, #9cffc6);
  box-shadow: 0 14px 30px rgba(79, 203, 181, 0.24);
}

.start-button:hover {
  transform: translateY(-1px);
}

@media (max-width: 900px) {
  .settings-grid,
  .summary-list {
    grid-template-columns: 1fr;
  }
}
</style>
