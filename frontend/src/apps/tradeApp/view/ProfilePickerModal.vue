<script setup lang="ts">
import { computed } from 'vue'
import type { TradeProfile } from '../store/useTradeProfileStore'
import type { PlayerSlot, PlayerIdentity } from '../types/playerIdentity'
import { createGuestIdentity } from '../types/playerIdentity'

const props = defineProps<{
  modelValue: boolean
  slot: PlayerSlot | null
  profiles: TradeProfile[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', payload: PlayerIdentity): void
  (e: 'create'): void
}>()

const guestIdentity = computed(() => {
  if (!props.slot) {
    return null
  }
  return createGuestIdentity(props.slot)
})

const guestLabel = computed(() => {
  if (!props.slot) {
    return 'ゲスト'
  }
  return props.slot === 'p1' ? 'プレイヤー1' : 'プレイヤー2'
})

function close(): void {
  emit('update:modelValue', false)
}

function handleSelectProfile(profileId: string): void {
  emit('select', { kind: 'profile', profileId })
  close()
}

function handleSelectGuest(): void {
  if (!guestIdentity.value) {
    return
  }
  emit('select', guestIdentity.value)
  close()
}

function handleCreate(): void {
  emit('create')
}

function formatCurrency(value: number): string {
  const rounded = Math.round(value)
  const prefix = rounded < 0 ? '-¥' : '¥'
  return `${prefix}${Math.abs(rounded).toLocaleString('ja-JP')}`
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="picker-modal">
      <div class="picker-modal__backdrop" @click="close" />

      <section class="picker-modal__dialog" role="dialog" aria-modal="true" aria-label="プロフィール選択">
        <header class="picker-modal__header">
          <div>
            <p class="picker-modal__eyebrow">PROFILE PICKER</p>
            <h2>{{ guestLabel }} のキャラクター選択</h2>
            <p class="picker-modal__copy">
              ゲストのままでも開始できます。プロフィールを選ぶと戦績が保存されます。
            </p>
          </div>

          <button type="button" class="picker-modal__close" @click="close">×</button>
        </header>

        <div class="picker-modal__grid">
          <button type="button" class="picker-card picker-card--guest" @click="handleSelectGuest">
            <div class="picker-card__head">
              <span class="picker-card__badge">GUEST</span>
            </div>
            <div class="picker-card__avatar">{{ slot === 'p1' ? 'G1' : 'G2' }}</div>
            <strong>{{ guestLabel }}</strong>
            <p>成績は保存されません</p>
            <span class="picker-card__cta">このまま開始</span>
          </button>

          <button type="button" class="picker-card picker-card--create" @click="handleCreate">
            <div class="picker-card__avatar">＋</div>
            <strong>新規作成</strong>
            <p>新しいキャラクターを作成</p>
            <span class="picker-card__cta">作って選ぶ</span>
          </button>

          <button
            v-for="profile in profiles"
            :key="profile.id"
            type="button"
            class="picker-card picker-card--profile"
            :class="`theme-${profile.theme}`"
            @click="handleSelectProfile(profile.id)"
          >
            <div class="picker-card__head">
              <span class="picker-card__badge">PROFILE</span>
              <span class="picker-card__battles">{{ profile.stats.totalBattles }}戦</span>
            </div>
            <div class="picker-card__avatar">{{ profile.name.slice(0, 1).toUpperCase() }}</div>
            <strong>{{ profile.name }}</strong>
            <p>{{ profile.title }}</p>

            <div class="picker-card__stats">
              <div>
                <span>勝率</span>
                <strong>{{ profile.stats.winRate }}%</strong>
              </div>
              <div>
                <span>累計獲得額</span>
                <strong>{{ formatCurrency(profile.stats.totalEarnedAmount) }}</strong>
              </div>
              <div>
                <span>現在資産</span>
                <strong :class="{ 'is-negative': profile.stats.currentAssets < 0 }">{{ formatCurrency(profile.stats.currentAssets) }}</strong>
              </div>
            </div>
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.picker-modal {
  position: fixed;
  inset: 0;
  z-index: 3100;
}

.picker-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(4, 8, 14, 0.78);
  backdrop-filter: blur(10px);
}

.picker-modal__dialog {
  position: relative;
  width: min(1180px, calc(100vw - 24px));
  max-height: calc(100vh - 24px);
  margin: 12px auto;
  padding: 22px;
  overflow: auto;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(180deg, rgba(10, 15, 27, 0.98), rgba(5, 9, 17, 0.99));
  color: #eef4ff;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
}

.picker-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.picker-modal__eyebrow {
  margin: 0 0 6px;
  color: rgba(154, 190, 255, 0.88);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.picker-modal__header h2 {
  margin: 0 0 8px;
  font-size: clamp(1.2rem, 2vw, 1.7rem);
}

.picker-modal__copy {
  margin: 0;
  color: rgba(220, 228, 246, 0.76);
  font-size: 0.84rem;
}

.picker-modal__close {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
}

.picker-modal__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.picker-card {
  display: grid;
  align-content: start;
  gap: 10px;
  min-height: 232px;
  padding: 16px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(180deg, rgba(15, 22, 38, 0.94), rgba(8, 12, 20, 0.98));
  color: #eef4ff;
  cursor: pointer;
  text-align: left;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.picker-card:hover {
  transform: translateY(-2px);
  border-color: rgba(128, 194, 255, 0.46);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.28);
}

.picker-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.picker-card__badge,
.picker-card__battles {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.picker-card__badge {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.picker-card__battles {
  background: rgba(84, 145, 255, 0.14);
  color: #cfe0ff;
}

.picker-card__avatar {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 1.45rem;
  font-weight: 900;
}

.picker-card strong {
  font-size: 1.02rem;
}

.picker-card p {
  margin: 0;
  color: rgba(218, 227, 246, 0.72);
  font-size: 0.82rem;
  line-height: 1.5;
}

.picker-card__cta {
  margin-top: auto;
  color: #cfe0ff;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.picker-card__stats {
  display: grid;
  gap: 8px;
  margin-top: auto;
}

.picker-card__stats div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  font-size: 0.8rem;
}

.picker-card__stats span {
  color: rgba(210, 222, 247, 0.74);
}

.picker-card__stats strong.is-negative {
  color: #ffb5b5;
}

.picker-card--guest {
  background: linear-gradient(180deg, rgba(16, 24, 40, 0.95), rgba(9, 13, 22, 0.98));
}

.picker-card--create {
  border-style: dashed;
  border-color: rgba(159, 202, 255, 0.36);
}

.picker-card--profile.theme-blue {
  box-shadow: inset 0 0 0 1px rgba(101, 180, 255, 0.18);
}

.picker-card--profile.theme-red {
  box-shadow: inset 0 0 0 1px rgba(255, 118, 118, 0.18);
}

.picker-card--profile.theme-gold {
  box-shadow: inset 0 0 0 1px rgba(255, 205, 112, 0.2);
}

.picker-card--profile.theme-violet {
  box-shadow: inset 0 0 0 1px rgba(191, 140, 255, 0.2);
}

@media (max-width: 960px) {
  .picker-modal__grid {
    grid-template-columns: 1fr;
  }
}
</style>
