<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerIdentity, PlayerSlot, TradeProfile } from '../../types';

const props = withDefaults(
  defineProps<{
    slot: PlayerSlot;
    identity: PlayerIdentity;
    profile?: TradeProfile | null;
    disabled?: boolean;
  }>(),
  {
    profile: null,
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'select'): void;
  (e: 'create'): void;
  (e: 'reset-guest'): void;
  (e: 'open-stats'): void;
}>();

const slotLabel = computed(() => (props.slot === 'p1' ? 'PLAYER 1' : 'PLAYER 2'));
const slotAccentClass = computed(() => (props.slot === 'p1' ? 'slot-card--p1' : 'slot-card--p2'));

const badgeLabel = computed(() => {
  switch (props.identity.kind) {
    case 'guest':
      return 'GUEST';
    case 'profile':
      return 'PROFILE';
    case 'cpu':
      return 'CPU';
  }
});

const displayName = computed(() => {
  if (props.identity.kind === 'profile') {
    return props.profile?.name ?? 'プロフィール不明';
  }

  return props.identity.label;
});

const subtitle = computed(() => {
  if (props.identity.kind === 'profile') {
    return props.profile?.title || props.profile?.tagline || '戦績を保存するキャラクター';
  }

  if (props.identity.kind === 'guest') {
    return 'ゲスト / 成績は保存されません';
  }

  return '自動参加';
});

const iconText = computed(() => {
  if (props.identity.kind === 'cpu') {
    return 'CPU';
  }

  if (props.identity.kind === 'guest') {
    return props.slot === 'p1' ? 'G1' : 'G2';
  }

  return props.profile?.name.slice(0, 1).toUpperCase() || '?';
});

const stats = computed(() => {
  if (props.identity.kind !== 'profile' || !props.profile) {
    return null;
  }

  return [
    {
      label: '勝率',
      value: `${props.profile.stats.winRate}%`,
    },
    {
      label: '累計獲得額',
      value: formatCurrency(props.profile.stats.totalEarnedAmount),
    },
    {
      label: '現在資産',
      value: formatCurrency(props.profile.stats.currentAssets),
      negative: props.profile.stats.currentAssets < 0,
    },
  ];
});

function formatCurrency(value: number): string {
  const rounded = Math.round(value);
  const prefix = rounded < 0 ? '-¥' : '¥';
  return `${prefix}${Math.abs(rounded).toLocaleString('ja-JP')}`;
}
</script>

<template>
  <article
    class="slot-card"
    :class="[slotAccentClass, `slot-card--${identity.kind}`, { 'is-disabled': disabled }]"
  >
    <header class="slot-card__header">
      <span class="slot-card__slot">{{ slotLabel }}</span>
      <span class="slot-card__badge">{{ badgeLabel }}</span>
    </header>

    <div class="slot-card__body">
      <div class="slot-card__avatar" aria-hidden="true">
        <span>{{ iconText }}</span>
      </div>

      <div class="slot-card__main">
        <div class="slot-card__name-row">
          <h3 class="slot-card__name">{{ displayName }}</h3>
          <span
            v-if="identity.kind === 'profile' && profile?.stats.totalBattles"
            class="slot-card__battle-count"
          >
            {{ profile.stats.totalBattles }}戦
          </span>
        </div>

        <p class="slot-card__subtitle">{{ subtitle }}</p>

        <div v-if="stats" class="slot-card__stats">
          <div
            v-for="item in stats"
            :key="item.label"
            class="slot-card__stat"
            :class="{ 'is-negative': item.negative }"
          >
            <span class="slot-card__stat-label">{{ item.label }}</span>
            <strong class="slot-card__stat-value">{{ item.value }}</strong>
          </div>
        </div>
      </div>
    </div>

    <footer v-if="identity.kind !== 'cpu'" class="slot-card__actions">
      <div class="slot-card__action-primary">
        <button
          type="button"
          class="slot-card__button slot-card__button--primary"
          :disabled="disabled"
          @click="emit('select')"
        >
          選択
        </button>
        <button
          v-if="identity.kind === 'profile'"
          type="button"
          class="slot-card__button slot-card__button--ghost"
          :disabled="disabled"
          @click="emit('open-stats')"
        >
          成績
        </button>
      </div>

      <div class="slot-card__action-secondary">
        <button
          type="button"
          class="slot-card__button slot-card__button--secondary"
          :disabled="disabled"
          @click="emit('create')"
        >
          新規作成
        </button>
        <button
          v-if="identity.kind === 'profile'"
          type="button"
          class="slot-card__text-link"
          :disabled="disabled"
          @click="emit('reset-guest')"
        >
          ゲストに戻す
        </button>
      </div>
    </footer>
  </article>
</template>

<style scoped>
.slot-card {
  position: relative;
  display: grid;
  gap: 14px;
  min-height: 188px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(180deg, rgba(10, 17, 33, 0.95), rgba(6, 12, 24, 0.98));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 16px 34px rgba(0, 0, 0, 0.28);
  overflow: hidden;
}

.slot-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.08), transparent 42%);
  pointer-events: none;
}

.slot-card.is-disabled {
  opacity: 0.65;
}

.slot-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.slot-card__slot,
.slot-card__badge {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.slot-card__slot {
  background: rgba(255, 255, 255, 0.05);
  color: #c8d5f4;
}

.slot-card__badge {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #edf4ff;
}

.slot-card__body {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.slot-card__avatar {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.slot-card__avatar span {
  color: #f6f8fc;
  font-size: 18px;
  font-weight: 900;
}

.slot-card--p1 .slot-card__avatar,
.slot-card--p1 .slot-card__badge {
  box-shadow: 0 0 24px rgba(80, 169, 255, 0.18);
}

.slot-card--p2 .slot-card__avatar,
.slot-card--p2 .slot-card__badge {
  box-shadow: 0 0 24px rgba(255, 93, 93, 0.2);
}

.slot-card__main {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.slot-card__name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.slot-card__name {
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
  color: #f5f7fb;
}

.slot-card__battle-count {
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: #b7c4e5;
  font-size: 11px;
}

.slot-card__subtitle {
  margin: 0;
  color: #aebbd9;
  font-size: 12px;
  line-height: 1.5;
}

.slot-card__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.slot-card__stat {
  display: grid;
  gap: 4px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.slot-card__stat.is-negative {
  border-color: rgba(255, 122, 122, 0.18);
}

.slot-card__stat-label {
  color: #8fa2c8;
  font-size: 10px;
}

.slot-card__stat-value {
  color: #f5f7fb;
  font-size: 13px;
  line-height: 1.25;
}

.slot-card__stat.is-negative .slot-card__stat-value {
  color: #ffb5b5;
}

.slot-card__actions {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
}

.slot-card__action-primary,
.slot-card__action-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.slot-card__button,
.slot-card__text-link {
  appearance: none;
  border: none;
  border-radius: 12px;
  font: inherit;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    opacity 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease;
}

.slot-card__button:hover,
.slot-card__text-link:hover {
  transform: translateY(-1px);
}

.slot-card__button:disabled,
.slot-card__text-link:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
}

.slot-card__button {
  min-width: 92px;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.slot-card__button--primary {
  color: #07111f;
  background: linear-gradient(135deg, #7dd7ff, #a4ffd0);
}

.slot-card__button--ghost {
  color: #e9efff;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.slot-card__button--secondary {
  color: #dce6ff;
  background: linear-gradient(180deg, rgba(16, 29, 55, 0.95), rgba(9, 17, 34, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.slot-card__text-link {
  padding: 0;
  background: transparent;
  color: #9fb4e6;
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 900px) {
  .slot-card__stats {
    grid-template-columns: 1fr;
  }
}
</style>
