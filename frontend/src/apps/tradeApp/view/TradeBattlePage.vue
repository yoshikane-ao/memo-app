<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTradeGameStore } from '../store/useTradeGameStore'

const router = useRouter()
const gameStore = useTradeGameStore()

const battle = computed(() => gameStore.state.battle)

const turnLabel = computed(() => {
    if (!battle.value) return '-'
    return `TURN ${battle.value.turn}`
})

const currentPlayerLabel = computed(() => {
    if (!battle.value) return '-'
    return battle.value.currentPlayer === 'p1'
        ? battle.value.players.p1.name
        : battle.value.players.p2.name
})

const player1Name = computed(() => battle.value?.players.p1.name ?? 'PLAYER 1')
const player2Name = computed(() => battle.value?.players.p2.name ?? 'CPU')

const player1Cash = computed(() => battle.value?.players.p1.cash ?? 0)
const player2Cash = computed(() => battle.value?.players.p2.cash ?? 0)

const player1Assets = computed(() => battle.value?.players.p1.totalAssets ?? 0)
const player2Assets = computed(() => battle.value?.players.p2.totalAssets ?? 0)

const assetDiff = computed(() => player1Assets.value - player2Assets.value)

const p1Stock = computed(() => battle.value?.stocks.p1 ?? 0)
const p2Stock = computed(() => battle.value?.stocks.p2 ?? 0)
const marketStock = computed(() => battle.value?.stocks.market ?? 0)

const cpuParticipants = computed(() => battle.value?.cpu.participants ?? 0)
const cpuInvestment = computed(() => battle.value?.cpu.totalInvestment ?? 0)
const cpuWithdrawals = computed(() => battle.value?.cpu.withdrawals ?? 0)

const difficultyLabel = computed(() => gameStore.state.settings.difficulty)

const backToTitle = () => {
    gameStore.resetGame()
    router.push({ name: 'trade-start' })
}

const nextTurnForMock = () => {
    gameStore.nextTurn()
}
</script>

<template>
    <main class="trade-battle-page">
        <section class="battle-topbar">
            <div class="topbar-card large">
                <p class="top-label">現在ターン</p>
                <h1>{{ turnLabel }}</h1>
                <p class="top-sub">行動中: {{ currentPlayerLabel }}</p>
            </div>

            <div class="topbar-card">
                <p class="top-label">難易度</p>
                <h2>{{ difficultyLabel }}</h2>
            </div>

            <div class="topbar-card">
                <p class="top-label">市場参加CPU</p>
                <h2>{{ cpuParticipants }}人</h2>
            </div>

            <div class="topbar-card">
                <p class="top-label">CPU投資総額</p>
                <h2>{{ cpuInvestment.toLocaleString() }}円</h2>
            </div>

            <div class="topbar-card">
                <p class="top-label">撤退CPU数</p>
                <h2>{{ cpuWithdrawals }}人</h2>
            </div>
        </section>

        <section class="player-summary-grid">
            <article class="summary-card">
                <p class="card-label">{{ player1Name }}</p>
                <h2>現金 {{ player1Cash.toLocaleString() }}円</h2>
                <p>総資産 {{ player1Assets.toLocaleString() }}円</p>
            </article>

            <article class="summary-card">
                <p class="card-label">{{ player2Name }}</p>
                <h2>現金 {{ player2Cash.toLocaleString() }}円</h2>
                <p>総資産 {{ player2Assets.toLocaleString() }}円</p>
            </article>

            <article class="summary-card accent">
                <p class="card-label">総資産差</p>
                <h2>{{ assetDiff.toLocaleString() }}円</h2>
                <p>＋なら {{ player1Name }} が有利</p>
            </article>
        </section>

        <section class="stock-summary-grid">
            <article class="stock-card">
                <p>P1株</p>
                <h2>{{ p1Stock }}</h2>
            </article>

            <article class="stock-card">
                <p>P2株</p>
                <h2>{{ p2Stock }}</h2>
            </article>

            <article class="stock-card">
                <p>市場株</p>
                <h2>{{ marketStock }}</h2>
            </article>
        </section>

        <section class="info-grid">
            <article class="info-card">
                <p class="card-label">バブルライン</p>
                <ul>
                    <li>P1株: {{ battle?.bubbleLimit.p1 ?? 0 }}</li>
                    <li>P2株: {{ battle?.bubbleLimit.p2 ?? 0 }}</li>
                    <li>市場株: {{ battle?.bubbleLimit.market ?? 0 }}</li>
                </ul>
            </article>

            <article class="info-card">
                <p class="card-label">下限ライン</p>
                <ul>
                    <li>P1株: {{ battle?.floorLimit.p1 ?? 0 }}</li>
                    <li>P2株: {{ battle?.floorLimit.p2 ?? 0 }}</li>
                    <li>市場株: {{ battle?.floorLimit.market ?? 0 }}</li>
                </ul>
            </article>

            <article class="info-card">
                <p class="card-label">現在の状態</p>
                <p class="info-text">
                    スタート画面の設定が初期盤面に反映された状態です。
                    次ターンボタンは今はモックで、ターン担当だけ切り替わります。
                </p>
            </article>
        </section>

        <section class="battle-actions">
            <button @click="nextTurnForMock">次ターンへ</button>
            <button class="ghost" @click="backToTitle">タイトルへ戻る</button>
        </section>
    </main>
</template>

<style scoped>
.trade-battle-page {
    min-height: 100vh;
    padding: 20px;
    box-sizing: border-box;
    background:
        radial-gradient(circle at top left, rgba(120, 160, 255, 0.1), transparent 26%),
        radial-gradient(circle at top right, rgba(255, 120, 120, 0.08), transparent 22%),
        #0b1020;
    color: #f4f7ff;
    display: grid;
    gap: 16px;
}

.battle-topbar,
.player-summary-grid,
.stock-summary-grid,
.info-grid {
    display: grid;
    gap: 12px;
}

.battle-topbar {
    grid-template-columns: 1.4fr repeat(4, 1fr);
}

.player-summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stock-summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.info-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.topbar-card,
.summary-card,
.stock-card,
.info-card {
    background: rgba(17, 25, 46, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 18px;
    padding: 16px;
    box-sizing: border-box;
}

.topbar-card.large {
    padding: 18px 20px;
}

.top-label,
.card-label,
.stock-card p {
    margin: 0 0 8px;
    color: #9caed6;
    font-size: 12px;
}

.topbar-card h1,
.topbar-card h2,
.summary-card h2,
.stock-card h2 {
    margin: 0;
}

.top-sub,
.summary-card p,
.info-text {
    margin: 8px 0 0;
    color: #c7d2eb;
    line-height: 1.6;
}

.summary-card.accent {
    background: linear-gradient(135deg, rgba(36, 84, 165, 0.95), rgba(22, 145, 121, 0.92));
}

.info-card ul {
    margin: 8px 0 0;
    padding-left: 18px;
    color: #dbe5ff;
    line-height: 1.7;
}

.battle-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.battle-actions button {
    border: none;
    border-radius: 12px;
    padding: 12px 18px;
    font-weight: 700;
    cursor: pointer;
    background: linear-gradient(135deg, #7fd0ff, #9cffc6);
    color: #08101f;
}

.battle-actions .ghost {
    background: transparent;
    color: #e4ebff;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

@media (max-width: 1100px) {
    .battle-topbar {
        grid-template-columns: 1fr 1fr;
    }

    .player-summary-grid,
    .stock-summary-grid,
    .info-grid {
        grid-template-columns: 1fr;
    }
}
</style>
