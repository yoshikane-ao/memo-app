<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import StartingCashSection from '../ui/start/StartingCashSection.vue';
import TurnOrderSection from '../ui/start/TurnOrderSection.vue';
import ProfileSlotCard from '../ui/start/ProfileSlotCard.vue';
import ProfileCreateModal from '../components/ProfileCreateModal.vue';
import ProfilePickerModal from '../components/ProfilePickerModal.vue';
import { createGuestIdentity, type PlayerIdentity, type PlayerSlot } from '../model/playerIdentity';
import {
  DEFAULT_MARKET_STOCK_STARTING_PRICE,
  DEFAULT_PLAYER_STOCK_STARTING_PRICE,
  buildTradeSessionSnapshot,
  type FirstPlayer,
  type TradeSetupDraft,
} from '../model/tradeSetup';
import { useTradeGameStore } from '../model/useTradeGameStore';
import {
  useTradeProfileStore,
  type CreateTradeProfileInput,
  type TradeProfile,
} from '../model/useTradeProfileStore';
import { useTradeButtonSound } from './useTradeButtonSound';
import startBackgroundUrl from '../../../assets/start-screen-background.png';

type StartingCashMode = 'same' | 'separate';

type SelectedPlayerPayload = {
  kind: PlayerIdentity['kind'];
  label?: string;
  profileId?: string;
};

const router = useRouter();
const gameStore = useTradeGameStore();
const profileStore = useTradeProfileStore();
const startPageRoot = ref<HTMLElement | null>(null);

const firstPlayer = ref<FirstPlayer>('random');
const startingCashMode = ref<StartingCashMode>('same');
const sharedStartingCash = ref(100000);
const player1StartingCash = ref(100000);
const player2StartingCash = ref(100000);
const statusMessage = ref('');

const p1Identity = ref<PlayerIdentity>(createGuestIdentity('p1'));
const p2Identity = ref<PlayerIdentity>(createGuestIdentity('p2'));

const pickerSlot = ref<PlayerSlot | null>(null);
const isPickerOpen = ref(false);
const isCreateModalOpen = ref(false);
const createTargetSlot = ref<PlayerSlot>('p1');

const p1Profile = computed<TradeProfile | null>(() => resolveProfile(p1Identity.value));
const p2Profile = computed<TradeProfile | null>(() => resolveProfile(p2Identity.value));

const resolvedPlayer1Name = computed(() => {
  if (p1Identity.value.kind === 'profile') {
    return p1Profile.value?.name || 'PLAYER 1';
  }

  return p1Identity.value.label;
});

const resolvedPlayer2Name = computed(() => {
  if (p2Identity.value.kind === 'profile') {
    return p2Profile.value?.name || 'PLAYER 2';
  }

  return p2Identity.value.label;
});

const resolvedPlayer1Cash = computed(() => {
  return startingCashMode.value === 'same'
    ? normalizeCash(sharedStartingCash.value)
    : normalizeCash(player1StartingCash.value);
});

const resolvedPlayer2Cash = computed(() => {
  return startingCashMode.value === 'same'
    ? normalizeCash(sharedStartingCash.value)
    : normalizeCash(player2StartingCash.value);
});

void resolvedPlayer1Cash.value;
void resolvedPlayer2Cash.value;

useTradeButtonSound(startPageRoot);

onMounted(() => {
  profileStore.seedIfEmpty();
  const draft = gameStore.state.draft;
  firstPlayer.value = draft.firstPlayer;
  startingCashMode.value = draft.startingCashMode;
  sharedStartingCash.value = draft.sharedStartingCash;
  player1StartingCash.value = draft.player1StartingCash;
  player2StartingCash.value = draft.player2StartingCash;
  p1Identity.value = draft.p1Identity.kind === 'cpu' ? createGuestIdentity('p1') : draft.p1Identity;
  p2Identity.value = draft.p2Identity.kind === 'cpu' ? createGuestIdentity('p2') : draft.p2Identity;
  syncDraftToStore();
});

watch(firstPlayer, () => {
  syncDraftToStore();
});

function resolveProfile(identity: PlayerIdentity): TradeProfile | null {
  if (identity.kind !== 'profile') {
    return null;
  }
  return profileStore.sortedProfiles.find((profile) => profile.id === identity.profileId) ?? null;
}

function normalizeNonNegativeInt(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

function normalizeCash(value: number): number {
  return normalizeNonNegativeInt(value);
}

function buildCurrentDraft(): TradeSetupDraft {
  return {
    battleMode: 'pvp',
    firstPlayer: firstPlayer.value,
    startingCashMode: startingCashMode.value,
    sharedStartingCash: sharedStartingCash.value,
    player1StartingCash: player1StartingCash.value,
    player2StartingCash: player2StartingCash.value,
    weakCpuCount: 0,
    strongCpuCount: 0,
    marketStartingPriceMode: 'fixed',
    marketStartingPrice: DEFAULT_MARKET_STOCK_STARTING_PRICE,
    p1Identity: p1Identity.value,
    p2Identity: p2Identity.value,
  };
}

function syncDraftToStore(): void {
  gameStore.setDraft(buildCurrentDraft());
}

function setStartingCashMode(value: StartingCashMode): void {
  startingCashMode.value = value;
  if (value === 'same') {
    const base = normalizeCash(
      sharedStartingCash.value || player1StartingCash.value || player2StartingCash.value,
    );
    sharedStartingCash.value = base;
    player1StartingCash.value = base;
    player2StartingCash.value = base;
  }
  syncDraftToStore();
}

function setSharedCash(value: number): void {
  const normalized = normalizeCash(value);
  sharedStartingCash.value = normalized;
  if (startingCashMode.value === 'same') {
    player1StartingCash.value = normalized;
    player2StartingCash.value = normalized;
  }
  syncDraftToStore();
}

function setPlayerCash(slot: PlayerSlot, value: number): void {
  const normalized = normalizeCash(value);
  if (slot === 'p1') {
    player1StartingCash.value = normalized;
  } else {
    player2StartingCash.value = normalized;
  }
  syncDraftToStore();
}

function openPicker(slot: PlayerSlot): void {
  pickerSlot.value = slot;
  isPickerOpen.value = true;
}

function openCreate(slot: PlayerSlot): void {
  createTargetSlot.value = slot;
  isCreateModalOpen.value = true;
}

function assignIdentity(slot: PlayerSlot, identity: PlayerIdentity): void {
  if (slot === 'p1') {
    p1Identity.value = identity;
  } else {
    p2Identity.value = identity;
  }
  syncDraftToStore();
}

function handleSelectProfile(identity: PlayerIdentity): void {
  if (!pickerSlot.value) {
    return;
  }
  assignIdentity(pickerSlot.value, identity);
  if (identity.kind === 'profile') {
    profileStore.selectProfile(identity.profileId);
  }
  statusMessage.value = '';
}

function handleCreateProfileSubmit(payload: CreateTradeProfileInput): void {
  const created = profileStore.createProfile(payload);
  assignIdentity(createTargetSlot.value, { kind: 'profile', profileId: created.id });
  statusMessage.value = `${created.name} を作成して選択しました。`;
}

function handleCreateProfile(payload: CreateTradeProfileInput): void {
  const created = profileStore.createProfile(payload);
  assignIdentity(createTargetSlot.value, { kind: 'profile', profileId: created.id });
  statusMessage.value = `${created.name} を保存しました。`;
}

function resetSlotToGuest(slot: PlayerSlot): void {
  assignIdentity(slot, createGuestIdentity(slot));
}

function openStats(slot: PlayerSlot): void {
  const identity = slot === 'p1' ? p1Identity.value : p2Identity.value;
  if (identity.kind !== 'profile') {
    return;
  }

  router
    .push({
      name: 'menu-workspace-trade-profile-stats',
      params: { profileId: identity.profileId },
    })
    .catch(() => {
      statusMessage.value =
        '戦績画面へ移動できませんでした。プロフィール一覧から再度開いてください。';
    });
}

function persistSelectedIdentities(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: Record<PlayerSlot, SelectedPlayerPayload> = {
    p1: serializeIdentity(p1Identity.value),
    p2: serializeIdentity(p2Identity.value),
  };

  window.sessionStorage.setItem('trade:selectedIdentities', JSON.stringify(payload));
}

function serializeIdentity(identity: PlayerIdentity): SelectedPlayerPayload {
  if (identity.kind === 'profile') {
    return { kind: 'profile', profileId: identity.profileId };
  }
  return { kind: identity.kind, label: identity.label };
}

function startLocalBattleSubmit(): void {
  const session = buildTradeSessionSnapshot(buildCurrentDraft(), profileStore.sortedProfiles);
  gameStore.initializeGame(session);

  router.push({ name: 'menu-workspace-trade-battle' }).catch(() => {
    statusMessage.value = 'バトル画面へ移動できませんでした。';
  });
}
void handleCreateProfile;
void persistSelectedIdentities;
</script>

<template>
  <main ref="startPageRoot" class="trade-start-page">
    <section class="hero-layout">
      <div class="hero-stage">
        <div class="hero-stage__visual-shell">
          <img
            class="hero-stage__background"
            :src="startBackgroundUrl"
            alt="CLASH CAPITAL start background"
          />
          <div class="hero-stage__shade"></div>
        </div>

        <div class="hero-stage__ui">
          <div class="hero-stage__spacer" aria-hidden="true"></div>

          <div class="hero-stage__settings-row">
            <section class="hero-panel" aria-label="蟇ｾ謌ｦ譚｡莉ｶ">
              <div class="hero-panel__inner hero-panel__inner--blue">
                <header class="hero-panel__head">
                  <p class="hero-panel__eyebrow">設定を変更</p>
                  <h2>設定</h2>
                </header>
                <StartingCashSection
                  :cash-mode="startingCashMode"
                  :shared-cash="sharedStartingCash"
                  :player1-cash="player1StartingCash"
                  :player2-cash="player2StartingCash"
                  :player1-name="resolvedPlayer1Name"
                  :player2-name="resolvedPlayer2Name"
                  @update:cash-mode="setStartingCashMode"
                  @update:shared-cash="setSharedCash"
                  @update:player1-cash="setPlayerCash('p1', $event)"
                  @update:player2-cash="setPlayerCash('p2', $event)"
                />
              </div>
            </section>

            <section class="hero-panel" aria-label="turn order settings">
              <div class="hero-panel__inner hero-panel__inner--neutral">
                <header class="hero-panel__head">
                  <p class="hero-panel__eyebrow">TURN ORDER</p>
                  <h2>順番設定</h2>
                </header>

                <div class="flow-panel">
                  <TurnOrderSection
                    :model-value="firstPlayer"
                    :player1-name="resolvedPlayer1Name"
                    :player2-name="resolvedPlayer2Name"
                    @update:model-value="firstPlayer = $event"
                  />
                </div>
              </div>
            </section>

            <section class="hero-panel" aria-label="rules">
              <div class="hero-panel__inner hero-panel__inner--red">
                <header class="hero-panel__head">
                  <p class="hero-panel__eyebrow">RULES</p>
                  <h2>シンプル設計</h2>
                </header>

                <div class="mode-panel">
                  <p class="mode-panel__copy">いまは 2人対戦専用です。</p>
                  <p class="mode-panel__copy">
                    先攻後攻を決めて、資金を持った状態で対戦を開始します。
                  </p>
                  <p class="mode-panel__copy">
                    Player1 と Player2 の株価は
                    {{ DEFAULT_PLAYER_STOCK_STARTING_PRICE.toLocaleString() }}円開始です。
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div class="hero-stage__profile-row">
            <section class="hero-profile-card" aria-label="繝励Ξ繧､繝､繝ｼ1繝励Ο繝輔ぅ繝ｼ繝ｫ">
              <div class="hero-profile-card__inner hero-profile-card__inner--blue">
                <ProfileSlotCard
                  slot="p1"
                  :identity="p1Identity"
                  :profile="p1Profile"
                  :disabled="false"
                  @select="openPicker('p1')"
                  @create="openCreate('p1')"
                  @reset-guest="resetSlotToGuest('p1')"
                  @open-stats="openStats('p1')"
                />
              </div>
            </section>

            <section class="hero-profile-hub" aria-label="battle actions">
              <div class="hero-profile-hub__inner">
                <div class="hero-stage__actions" aria-label="start actions">
                  <button
                    type="button"
                    class="hero-action hero-action--blue"
                    @click="startLocalBattleSubmit"
                  >
                    対戦開始
                  </button>
                </div>
                <p v-if="statusMessage" class="hero-profile-hub__status">{{ statusMessage }}</p>
              </div>
            </section>

            <section class="hero-profile-card" aria-label="繝励Ξ繧､繝､繝ｼ2繝励Ο繝輔ぅ繝ｼ繝ｫ">
              <div class="hero-profile-card__inner hero-profile-card__inner--red">
                <ProfileSlotCard
                  slot="p2"
                  :identity="p2Identity"
                  :profile="p2Profile"
                  :disabled="false"
                  @select="openPicker('p2')"
                  @create="openCreate('p2')"
                  @reset-guest="resetSlotToGuest('p2')"
                  @open-stats="openStats('p2')"
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>

    <ProfilePickerModal
      :slot="pickerSlot"
      v-model="isPickerOpen"
      :profiles="profileStore.sortedProfiles"
      @select="handleSelectProfile"
      @create="openCreate(pickerSlot || 'p1')"
    />

    <ProfileCreateModal v-model="isCreateModalOpen" @create="handleCreateProfileSubmit" />
  </main>
</template>

<style scoped>
.trade-start-page {
  width: calc(100% + 24px);
  margin: -16px -12px 0;
  padding: 16px 12px 36px;
  overflow-x: hidden;
  color: #f4f7ff;
}

.hero-layout {
  display: grid;
}

.hero-stage {
  position: relative;
  width: min(100%, 1320px);
  margin: 0 auto 40px;
  aspect-ratio: 3 / 2;
  overflow: visible;
}

.hero-stage__visual-shell {
  position: absolute;
  inset: 0;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.38);
  background: #04060b;
}

.hero-stage__background,
.hero-stage__shade {
  position: absolute;
  inset: 0;
}

.hero-stage__background {
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  pointer-events: none;
}

.hero-stage__shade {
  background:
    linear-gradient(
      180deg,
      rgba(3, 6, 10, 0.01) 0%,
      rgba(3, 6, 10, 0.03) 48%,
      rgba(2, 4, 8, 0.14) 62%,
      rgba(2, 4, 8, 0.3) 100%
    ),
    radial-gradient(
      circle at bottom center,
      rgba(4, 8, 18, 0.08),
      rgba(2, 4, 8, 0.04) 40%,
      rgba(1, 2, 4, 0) 72%
    );
  pointer-events: none;
}

.hero-stage__ui {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  grid-template-rows: 61% auto auto;
  gap: 12px;
  padding: 0 6.6% 2%;
}

.hero-stage__spacer {
  min-height: 0;
}

.hero-stage__settings-row,
.hero-stage__profile-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.55%;
}

.hero-panel,
.hero-profile-card,
.hero-profile-hub {
  min-width: 0;
}

.hero-panel__inner,
.hero-profile-card__inner,
.hero-profile-hub__inner {
  height: 100%;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: linear-gradient(180deg, rgba(10, 14, 25, 0.84), rgba(6, 9, 17, 0.92));
  backdrop-filter: blur(12px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 18px 40px rgba(0, 0, 0, 0.24);
}

.hero-panel__inner {
  min-height: 174px;
  padding: 12px 14px 14px;
}

.hero-profile-card__inner,
.hero-profile-hub__inner {
  min-height: 172px;
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
}

.hero-panel__inner--blue,
.hero-profile-card__inner--blue {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 18px 40px rgba(0, 0, 0, 0.24),
    0 0 0 1px rgba(87, 174, 255, 0.18),
    0 0 28px rgba(59, 121, 255, 0.14);
}

.hero-panel__inner--neutral,
.hero-profile-hub__inner {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 18px 40px rgba(0, 0, 0, 0.24),
    0 0 0 1px rgba(231, 116, 73, 0.14),
    0 0 24px rgba(84, 137, 255, 0.1);
}

.hero-profile-hub__inner {
  justify-content: center;
  gap: 10px;
}

.hero-panel__inner--red,
.hero-profile-card__inner--red {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 18px 40px rgba(0, 0, 0, 0.24),
    0 0 0 1px rgba(255, 104, 104, 0.18),
    0 0 26px rgba(228, 64, 64, 0.12);
}

.hero-panel__head {
  display: grid;
  gap: 2px;
  margin-bottom: 8px;
}

.hero-panel__eyebrow,
.hero-profile-hub__eyebrow {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: rgba(221, 232, 255, 0.9);
}

.hero-panel__head h2,
.hero-profile-hub__head h2 {
  margin: 0;
  font-size: 0.95rem;
}

.hero-profile-hub__head {
  display: none;
}

.hero-profile-hub__status,
.mode-panel__copy,
.mode-panel__status {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.45;
  color: rgba(216, 225, 244, 0.82);
}

.hero-profile-hub__status {
  min-height: 18px;
  text-align: center;
}

.flow-panel,
.mode-panel {
  display: grid;
  gap: 8px;
}

.mode-panel__status {
  color: #ffe0b0;
}

.hero-profile-card :deep(.slot-card) {
  min-height: 142px;
  padding: 10px;
  gap: 8px;
  border-radius: 14px;
}

.hero-profile-card :deep(.slot-card__header) {
  gap: 8px;
}

.hero-profile-card :deep(.slot-card__slot),
.hero-profile-card :deep(.slot-card__badge) {
  min-height: 22px;
  padding: 0 9px;
  font-size: 9px;
}

.hero-profile-card :deep(.slot-card__body) {
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 8px;
}

.hero-profile-card :deep(.slot-card__avatar) {
  width: 44px;
  height: 44px;
  border-radius: 12px;
}

.hero-profile-card :deep(.slot-card__avatar span) {
  font-size: 14px;
}

.hero-profile-card :deep(.slot-card__name-row) {
  gap: 6px;
}

.hero-profile-card :deep(.slot-card__name) {
  font-size: 14px;
}

.hero-profile-card :deep(.slot-card__battle-count) {
  padding: 2px 6px;
  font-size: 10px;
}

.hero-profile-card :deep(.slot-card__subtitle) {
  font-size: 10px;
  line-height: 1.35;
}

.hero-profile-card :deep(.slot-card__stats) {
  gap: 6px;
}

.hero-profile-card :deep(.slot-card__stat) {
  padding: 7px 8px;
  border-radius: 10px;
}

.hero-profile-card :deep(.slot-card__stat-label) {
  font-size: 8px;
}

.hero-profile-card :deep(.slot-card__stat-value) {
  font-size: 11px;
}

.hero-profile-card :deep(.slot-card__actions) {
  gap: 6px;
}

.hero-profile-card :deep(.slot-card__action-primary),
.hero-profile-card :deep(.slot-card__action-secondary) {
  gap: 6px;
}

.hero-profile-card :deep(.slot-card__button) {
  min-width: 64px;
  padding: 7px 9px;
  font-size: 10px;
  border-radius: 10px;
}

.hero-profile-card :deep(.slot-card__text-link) {
  font-size: 10px;
}

.hero-stage__actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  align-content: center;
}

.hero-action {
  min-height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #f8fbff;
  font-size: clamp(0.82rem, 0.9vw, 1rem);
  font-weight: 900;
  letter-spacing: 0.04em;
  cursor: pointer;
  backdrop-filter: blur(12px);
  transition:
    transform 0.18s ease,
    filter 0.18s ease,
    box-shadow 0.18s ease;
}

.hero-action:hover {
  transform: translateY(-2px) scale(1.01);
  filter: brightness(1.05);
}

.hero-action--blue {
  background: linear-gradient(180deg, rgba(77, 140, 255, 0.62), rgba(28, 72, 170, 0.72));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 12px 30px rgba(56, 121, 255, 0.34);
}

.hero-action--green {
  background: linear-gradient(180deg, rgba(52, 190, 140, 0.62), rgba(23, 114, 90, 0.72));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 12px 30px rgba(44, 181, 128, 0.3);
}

.hero-action--violet {
  background: linear-gradient(180deg, rgba(157, 96, 255, 0.62), rgba(91, 46, 172, 0.74));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 12px 30px rgba(139, 86, 255, 0.28);
}

.hero-panel :deep(.cash-section),
.hero-panel :deep(.segment-grid) {
  gap: 6px;
}

.hero-panel :deep(.mode-button),
.hero-panel :deep(.segment-button) {
  height: 34px;
  border-radius: 10px;
  font-size: 11px;
}

.hero-panel :deep(.cash-grid) {
  gap: 8px;
}

.hero-panel :deep(.field) {
  gap: 4px;
}

.hero-panel :deep(.field-label) {
  font-size: 10px;
}

.hero-panel :deep(.money-input) {
  gap: 6px;
}

.hero-panel :deep(.currency) {
  font-size: 12px;
}

.hero-panel :deep(.field-input) {
  height: 32px;
  font-size: 12px;
  border-radius: 10px;
}

@media (max-width: 1240px) {
  .hero-stage {
    aspect-ratio: auto;
    min-height: 1180px;
    margin-bottom: 0;
  }

  .hero-stage__visual-shell {
    border-radius: 24px;
  }

  .hero-stage__ui {
    position: relative;
    inset: auto;
    display: grid;
    grid-template-rows: auto;
    gap: 14px;
    padding: 52% 20px 20px;
  }

  .hero-stage__spacer {
    display: none;
  }

  .hero-stage__settings-row,
  .hero-stage__profile-row {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .hero-stage__actions {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .trade-start-page {
    width: calc(100% + 20px);
    margin: -12px -10px 0;
    padding: 12px 10px 24px;
  }

  .hero-stage {
    min-height: 1260px;
  }

  .hero-stage__visual-shell {
    border-radius: 20px;
  }

  .hero-stage__actions {
    grid-template-columns: 1fr;
  }
}
</style>
