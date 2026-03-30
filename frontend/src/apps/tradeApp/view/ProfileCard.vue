<script setup lang="ts">
import { computed } from 'vue'
import type { TradeProfile } from '../store/useTradeProfileStore'

const props = defineProps<{
  profile: TradeProfile
  selected?: boolean
}>()

const emit = defineEmits<{
  (event: 'select', profileId: string): void
}>()

const themeClass = computed(() => `theme-${props.profile.theme}`)

const styleLabel = computed(() => {
  switch (props.profile.stats.style) {
    case 'buy-aggressive':
      return '買い攻勢型'
    case 'short-pressure':
      return '空売り圧力型'
    case 'defensive':
      return '慎重防衛型'
    case 'comeback':
      return '逆転狙い型'
    default:
      return '均衡型'
  }
})

const iconGlyph = computed(() => {
  switch (props.profile.icon) {
    case 'bull':
      return '🐂'
    case 'bear':
      return '🐻'
    case 'wolf':
      return '🐺'
    case 'eagle':
      return '🦅'
    case 'lightning':
      return '⚡'
    case 'crown':
      return '👑'
    case 'flame':
      return '🔥'
    default:
      return '🛡️'
  }
})

function handleClick(): void {
  emit('select', props.profile.id)
}

function formatCurrency(value: number): string {
  const rounded = Math.round(value)
  const prefix = rounded < 0 ? '-¥' : '¥'
  return `${prefix}${Math.abs(rounded).toLocaleString('ja-JP')}`
}
</script>

<template>
  <button
    class="profile-card"
    :class="[themeClass, { 'is-selected': selected }]"
    type="button"
    @click="handleClick"
  >
    <div class="profile-card__header">
      <div class="profile-card__icon" aria-hidden="true">{{ iconGlyph }}</div>
      <div class="profile-card__headings">
        <strong class="profile-card__name">{{ profile.name }}</strong>
        <span class="profile-card__title">{{ profile.title }}</span>
      </div>
      <span v-if="selected" class="profile-card__badge">SELECTED</span>
    </div>

    <p class="profile-card__tagline">{{ profile.tagline || '一言コメント未設定' }}</p>

    <dl class="profile-card__stats">
      <div>
        <dt>勝率</dt>
        <dd>{{ profile.stats.winRate }}%</dd>
      </div>
      <div>
        <dt>総対戦</dt>
        <dd>{{ profile.stats.totalBattles }}</dd>
      </div>
      <div>
        <dt>現在資産</dt>
        <dd :class="{ 'is-negative': profile.stats.currentAssets < 0 }">{{ formatCurrency(profile.stats.currentAssets) }}</dd>
      </div>
      <div>
        <dt>戦法</dt>
        <dd>{{ styleLabel }}</dd>
      </div>
    </dl>
  </button>
</template>

<style scoped>
.profile-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  min-height: 220px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(17, 21, 31, 0.96), rgba(7, 9, 14, 0.98));
  color: #eef3ff;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.profile-card:hover {
  transform: translateY(-3px);
}

.profile-card.theme-blue:hover,
.profile-card.theme-blue.is-selected {
  border-color: rgba(102, 180, 255, 0.78);
  box-shadow: 0 0 0 1px rgba(102, 180, 255, 0.2), 0 18px 36px rgba(26, 101, 211, 0.28);
}

.profile-card.theme-red:hover,
.profile-card.theme-red.is-selected {
  border-color: rgba(255, 110, 110, 0.78);
  box-shadow: 0 0 0 1px rgba(255, 110, 110, 0.2), 0 18px 36px rgba(195, 51, 51, 0.26);
}

.profile-card.theme-gold:hover,
.profile-card.theme-gold.is-selected {
  border-color: rgba(255, 212, 110, 0.78);
  box-shadow: 0 0 0 1px rgba(255, 212, 110, 0.2), 0 18px 36px rgba(180, 131, 26, 0.24);
}

.profile-card.theme-violet:hover,
.profile-card.theme-violet.is-selected {
  border-color: rgba(190, 128, 255, 0.78);
  box-shadow: 0 0 0 1px rgba(190, 128, 255, 0.22), 0 18px 36px rgba(102, 58, 177, 0.26);
}

.profile-card__header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
}

.profile-card__icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.07);
  font-size: 1.5rem;
}

.profile-card__headings {
  display: grid;
  gap: 4px;
}

.profile-card__name {
  font-size: 1rem;
}

.profile-card__title,
.profile-card__tagline,
.profile-card__stats dt {
  color: rgba(220, 228, 246, 0.72);
}

.profile-card__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.profile-card__tagline {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.55;
}

.profile-card__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.profile-card__stats div {
  display: grid;
  gap: 5px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
}

.profile-card__stats dt {
  font-size: 0.72rem;
}

.profile-card__stats dd {
  margin: 0;
  font-size: 0.94rem;
  font-weight: 800;
}

.profile-card__stats dd.is-negative {
  color: #ffb5b5;
}
</style>
