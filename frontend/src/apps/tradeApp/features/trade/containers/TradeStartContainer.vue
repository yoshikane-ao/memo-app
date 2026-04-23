<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import StartingCashSection from '../ui/start/StartingCashSection.vue';
import TurnOrderSection from '../ui/start/TurnOrderSection.vue';
import ProfileSlotCard from '../ui/start/ProfileSlotCard.vue';
import HeroBanner from '../ui/start/HeroBanner.vue';
import SettingsPanel from '../ui/start/SettingsPanel.vue';
import BattleStartAction from '../ui/start/BattleStartAction.vue';
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

function normalizeCash(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
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
void persistSelectedIdentities;
</script>

<template>
  <main ref="startPageRoot" class="trade-start-page">
    <section class="hero-layout">
      <div class="hero-stage">
        <HeroBanner :image-url="startBackgroundUrl" fill />

        <div class="hero-stage__ui">
          <div class="hero-stage__spacer" aria-hidden="true"></div>

          <div class="hero-stage__row">
            <SettingsPanel
              eyebrow="設定を変更"
              title="設定"
              variant="blue"
              aria-label="対戦条件"
              compact
            >
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
            </SettingsPanel>

            <SettingsPanel eyebrow="TURN ORDER" title="順番設定" variant="neutral" compact>
              <div class="flow-panel">
                <TurnOrderSection
                  :model-value="firstPlayer"
                  :player1-name="resolvedPlayer1Name"
                  :player2-name="resolvedPlayer2Name"
                  @update:model-value="firstPlayer = $event"
                />
              </div>
            </SettingsPanel>

            <SettingsPanel
              eyebrow="RULES"
              title="シンプル設計"
              variant="red"
              aria-label="ルール"
              compact
            >
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
            </SettingsPanel>
          </div>

          <div class="hero-stage__row">
            <section
              class="hero-profile-card hero-profile-card--blue"
              aria-label="プレイヤー1 プロフィール"
            >
              <ProfileSlotCard
                slot="p1"
                size="compact"
                :identity="p1Identity"
                :profile="p1Profile"
                :disabled="false"
                @select="openPicker('p1')"
                @create="openCreate('p1')"
                @reset-guest="resetSlotToGuest('p1')"
                @open-stats="openStats('p1')"
              />
            </section>

            <BattleStartAction
              :status-message="statusMessage"
              compact
              @start="startLocalBattleSubmit"
            />

            <section
              class="hero-profile-card hero-profile-card--red"
              aria-label="プレイヤー2 プロフィール"
            >
              <ProfileSlotCard
                slot="p2"
                size="compact"
                :identity="p2Identity"
                :profile="p2Profile"
                :disabled="false"
                @select="openPicker('p2')"
                @create="openCreate('p2')"
                @reset-guest="resetSlotToGuest('p2')"
                @open-stats="openStats('p2')"
              />
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
  padding: 16px 12px 24px;
  overflow-x: hidden;
  color: var(--text-main);
  min-height: 100%;
  background:
    radial-gradient(circle at 50% -10%, rgba(52, 95, 179, 0.28), transparent 45%),
    linear-gradient(180deg, #050912 0%, #070d1c 100%);
}

.hero-layout {
  display: block;
}

.hero-stage {
  position: relative;
  width: min(100%, 1320px, calc((100vh - 80px) * 1.5));
  margin: 0 auto;
  aspect-ratio: 3 / 2;
  border-radius: 28px;
  overflow: hidden;
  isolation: isolate;
  background: var(--trade-start-stage-bg);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 40px 80px rgba(0, 0, 0, 0.5);
}

.hero-stage__ui {
  position: absolute;
  inset: 0;
  z-index: 2;
  padding: 0 clamp(18px, 3.2%, 42px) clamp(14px, 2.4%, 28px);
  display: grid;
  grid-template-rows: 60% auto auto;
  gap: clamp(8px, 1%, 12px);
}

.hero-stage__spacer {
  min-height: 0;
}

.hero-stage__row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(8px, 1%, 14px);
}

.hero-profile-card {
  min-width: 0;
  padding: 0;
}

.hero-profile-card--blue :deep(.slot-card) {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 18px 40px rgba(0, 0, 0, 0.3),
    var(--trade-start-glow-p1);
}

.hero-profile-card--red :deep(.slot-card) {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 18px 40px rgba(0, 0, 0, 0.3),
    var(--trade-start-glow-p2);
}

.flow-panel,
.mode-panel {
  display: grid;
  gap: 6px;
}

.mode-panel__copy {
  margin: 0;
  font-size: 0.7rem;
  line-height: 1.45;
  color: rgba(216, 225, 244, 0.82);
}

@media (max-width: 1240px) {
  .hero-stage {
    aspect-ratio: auto;
    width: 100%;
    border-radius: 24px;
    min-height: 920px;
  }

  .hero-stage__ui {
    position: absolute;
    inset: auto 0 0 0;
    padding: 0 20px 20px;
  }
}

@media (max-width: 980px) {
  .trade-start-page {
    width: calc(100% + 20px);
    margin: -12px -10px 0;
    padding: 12px 10px 20px;
  }

  .hero-stage {
    border-radius: 20px;
    min-height: 1040px;
  }

  .hero-stage__row {
    grid-template-columns: 1fr;
  }
}
</style>
