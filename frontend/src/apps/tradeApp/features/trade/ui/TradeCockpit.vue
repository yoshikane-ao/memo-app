<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type {
  BattleActionDraft,
  BattleActionProjection,
  CompanyAction,
  CooldownAction,
  PlayerState,
  StockKey,
  TradeAction,
  TradeMode,
  OrderType,
} from '../types';
import { COOLDOWN_ACTIONS, MODE_LABELS, NO_COMPANY_ACTION } from '../types';
import { formatCurrency } from '../../../../../shared/format/currency';

const props = defineProps<{
  currentPlayer: PlayerState;
  playerNames: { p1: string; p2: string };
  draft: BattleActionDraft;
  projection: BattleActionProjection;
  pendingClose?: {
    stockName: string;
    side: 'buy' | 'sell';
    executionPriceText: string;
    projectedPnlText: string;
    returnedCashText: string;
  } | null;
}>();

const emit = defineEmits<{
  'update:draft': [draft: BattleActionDraft];
  confirm: [];
  cancelPendingClose: [];
}>();

const form = reactive<BattleActionDraft>({ ...props.draft });
let syncing = false;

watch(
  () => props.draft,
  (next) => {
    syncing = true;
    Object.assign(form, next);
    syncing = false;
  },
  { deep: true, immediate: true },
);

watch(
  form,
  () => {
    if (syncing) return;
    emit('update:draft', { ...form });
  },
  { deep: true },
);

const quickAmounts = [1000, 5000, 10000] as const;

type TargetOption = {
  key: StockKey;
  title: string;
  subtitle: string;
};

const targetOptions = computed<TargetOption[]>(() => props.projection.stockChoices);

const visibleTradeActions = computed(() => props.projection.visibleTradeActions);

const companyActions = computed<CooldownAction[]>(() => COOLDOWN_ACTIONS);

const tradeHint = computed(() => props.projection.preview.overviewTitle);
const executionEstimate = computed(() => props.projection.executionEstimateText);

const confirmLabel = computed(() => {
  if (props.pendingClose) return 'ポジション決済';
  if (props.projection.draft.actionKind === 'company') return 'この自社行動を実行';
  if (props.projection.draft.actionKind === 'wait') return 'このターンを待機';
  if (props.projection.isCashInsufficient) return '残高不足';
  if (form.orderType === 'forward') return '予約を確定 (2T後)';
  return 'この内容で注文';
});

const canSubmit = computed(() => {
  if (props.pendingClose) return true;
  return props.projection.canSubmit;
});

const isTradeWarning = computed(() => {
  if (props.pendingClose) return false;
  if (props.draft.actionKind !== 'trade') return false;
  return (
    props.projection.isCashInsufficient ||
    (!props.projection.canSubmit && Number(props.draft.quantity ?? 0) > 0)
  );
});

function setActionKind(kind: BattleActionDraft['actionKind']): void {
  form.actionKind = kind;
  if (kind === 'trade') {
    form.companyAction = NO_COMPANY_ACTION;
  } else if (kind === 'company') {
    form.stockKey = props.currentPlayer.id === 'player1' ? 'p1' : 'p2';
    if (form.companyAction === NO_COMPANY_ACTION) {
      form.companyAction = companyActions.value[0] ?? NO_COMPANY_ACTION;
    }
  } else {
    form.quantity = 0;
    form.companyAction = NO_COMPANY_ACTION;
  }
}

function setStock(key: StockKey): void {
  form.stockKey = key;
}

function setSide(action: TradeAction): void {
  form.tradeAction = action;
}

function setMode(mode: TradeMode): void {
  form.tradeMode = mode;
}

function setOrderType(type: OrderType): void {
  form.orderType = type;
}

function setCompanyAction(action: CompanyAction): void {
  form.companyAction = action;
}

function addAmount(amount: number): void {
  form.quantity = Math.max(0, Number(form.quantity ?? 0) + amount);
}

function clearAmount(): void {
  form.quantity = 0;
}

function submit(): void {
  if (props.pendingClose) {
    emit('confirm');
    return;
  }
  if (!canSubmit.value) return;
  emit('confirm');
}

function cancelPendingClose(): void {
  emit('cancelPendingClose');
}

function stockSubtitle(option: TargetOption): string {
  if (option.key === 'p1') return props.playerNames.p1;
  if (option.key === 'p2') return props.playerNames.p2;
  return option.subtitle;
}
</script>

<template>
  <section
    class="cockpit"
    :class="[
      `is-${draft.actionKind}`,
      `is-${currentPlayer.id}`,
      { 'is-pending-close': !!pendingClose },
    ]"
    :data-cockpit="currentPlayer.id"
  >
    <template v-if="pendingClose">
      <div class="cockpit-close">
        <span class="ck-tag ck-tag--close">決済プレビュー</span>
        <strong class="ck-close-name"
          >{{ pendingClose.stockName }}
          {{ pendingClose.side === 'buy' ? '買いポジ' : '売りポジ' }}</strong
        >
        <span class="ck-close-kv"
          >約定 <strong>{{ pendingClose.executionPriceText }}</strong></span
        >
        <span class="ck-close-kv"
          >損益 <strong>{{ pendingClose.projectedPnlText }}</strong></span
        >
        <span class="ck-close-kv"
          >回収 <strong>{{ pendingClose.returnedCashText }}</strong></span
        >
        <div class="ck-close-actions">
          <button type="button" class="ck-btn ck-btn--ghost" @click="cancelPendingClose">
            取消
          </button>
          <button type="button" class="ck-btn ck-btn--primary" @click="submit">決済確定</button>
        </div>
      </div>
    </template>

    <template v-else>
      <nav class="cockpit-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="tab-btn"
          :class="{ 'is-selected': draft.actionKind === 'trade' }"
          :aria-selected="draft.actionKind === 'trade'"
          @click="setActionKind('trade')"
        >
          売買
        </button>
        <button
          type="button"
          role="tab"
          class="tab-btn"
          :class="{ 'is-selected': draft.actionKind === 'company' }"
          :aria-selected="draft.actionKind === 'company'"
          @click="setActionKind('company')"
        >
          自社
        </button>
        <button
          type="button"
          role="tab"
          class="tab-btn"
          :class="{ 'is-selected': draft.actionKind === 'wait' }"
          :aria-selected="draft.actionKind === 'wait'"
          @click="setActionKind('wait')"
        >
          待機
        </button>
      </nav>

      <div v-if="draft.actionKind === 'trade'" class="cockpit-row cockpit-row--trade">
        <div class="ck-group ck-group--target">
          <span class="ck-label">対象</span>
          <div class="ck-seg">
            <button
              v-for="option in targetOptions"
              :key="option.key"
              type="button"
              class="seg-btn"
              :class="{ 'is-selected': draft.stockKey === option.key }"
              :title="stockSubtitle(option)"
              @click="setStock(option.key)"
            >
              {{ option.title }}
            </button>
          </div>
        </div>

        <div class="ck-group ck-group--side">
          <span class="ck-label">方向</span>
          <div class="ck-seg ck-seg--side">
            <button
              v-for="action in visibleTradeActions"
              :key="action"
              type="button"
              class="seg-btn"
              :class="[`is-side-${action}`, { 'is-selected': draft.tradeAction === action }]"
              @click="setSide(action)"
            >
              {{ action === 'buy' ? '買' : '売' }}
            </button>
          </div>
        </div>

        <div class="ck-group ck-group--mode">
          <span class="ck-label">種別</span>
          <div class="ck-seg">
            <button
              v-for="mode in ['investment', 'speculation'] as TradeMode[]"
              :key="mode"
              type="button"
              class="seg-btn"
              :class="{ 'is-selected': draft.tradeMode === mode }"
              @click="setMode(mode)"
            >
              {{ MODE_LABELS[mode] }}
            </button>
          </div>
        </div>

        <div class="ck-group ck-group--order">
          <span class="ck-label">発注</span>
          <div class="ck-seg">
            <button
              type="button"
              class="seg-btn"
              :class="{ 'is-selected': draft.orderType === 'market' }"
              @click="setOrderType('market')"
            >
              即時
            </button>
            <button
              type="button"
              class="seg-btn"
              :class="{ 'is-selected': draft.orderType === 'forward' }"
              title="2T後に発動・予約料3%"
              @click="setOrderType('forward')"
            >
              予約
            </button>
          </div>
        </div>

        <div class="ck-group ck-group--amount">
          <span class="ck-label">金額</span>
          <div class="ck-amount">
            <button type="button" class="ck-step" @click="addAmount(-1000)">−</button>
            <input
              v-model.number="form.quantity"
              type="number"
              min="0"
              step="1000"
              class="ck-amount-input"
            />
            <button type="button" class="ck-step" @click="addAmount(1000)">＋</button>
          </div>
          <div class="ck-presets">
            <button
              v-for="amount in quickAmounts"
              :key="amount"
              type="button"
              class="preset-btn"
              @click="addAmount(amount)"
            >
              +{{ amount.toLocaleString('ja-JP') }}
            </button>
            <button type="button" class="preset-btn preset-clear" @click="clearAmount">
              クリア
            </button>
          </div>
        </div>

        <div class="ck-group ck-group--submit">
          <div class="ck-hint" :class="{ 'ck-hint--warn': isTradeWarning }">
            <span v-if="isTradeWarning" class="ck-hint-badge" aria-hidden="true">！</span>
            <span class="ck-hint-main">{{ tradeHint }}</span>
            <span class="ck-hint-sub">{{ executionEstimate }}</span>
          </div>
          <button
            type="button"
            class="ck-btn ck-btn--primary"
            :disabled="!canSubmit"
            @click="submit"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>

      <div v-else-if="draft.actionKind === 'company'" class="cockpit-row cockpit-row--company">
        <div class="ck-group ck-group--company-list">
          <span class="ck-label">自社行動</span>
          <div class="ck-seg ck-seg--company">
            <button
              v-for="action in companyActions"
              :key="action"
              type="button"
              class="seg-btn seg-btn--company"
              :class="{ 'is-selected': draft.companyAction === action }"
              :disabled="(currentPlayer.companyActionCharges[action] ?? 0) <= 0"
              @click="setCompanyAction(action)"
            >
              {{ action }}
              <span class="charge-badge"
                >残{{ currentPlayer.companyActionCharges[action] ?? 0 }}</span
              >
            </button>
          </div>
        </div>

        <div class="ck-group ck-group--submit">
          <div class="ck-hint">
            <span class="ck-hint-main">選択中: {{ draft.companyAction }}</span>
            <span class="ck-hint-sub"
              >予備資金 {{ formatCurrency(currentPlayer.companyFunds) }}</span
            >
          </div>
          <button
            type="button"
            class="ck-btn ck-btn--primary"
            :disabled="!projection.canSubmitCompany"
            @click="submit"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>

      <div v-else class="cockpit-row cockpit-row--wait">
        <div class="ck-wait-hint">
          このターンを待機し、大きな動きを見送ります。相手の出方と CPU 反応を見るのに有効。
        </div>
        <button type="button" class="ck-btn ck-btn--primary" @click="submit">
          {{ confirmLabel }}
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.cockpit {
  display: grid;
  grid-template-rows: auto auto;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(122, 171, 255, 0.18);
  background: linear-gradient(180deg, rgba(9, 18, 40, 0.92), rgba(5, 11, 26, 0.96));
  color: #e7eefd;
  font-size: 11px;
}

.cockpit.is-player1 {
  border-color: rgba(124, 180, 255, 0.32);
}
.cockpit.is-player2 {
  border-color: rgba(255, 150, 171, 0.32);
}

.cockpit-tabs {
  display: flex;
  gap: 4px;
}

.tab-btn {
  appearance: none;
  border: none;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(220, 230, 250, 0.72);
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 999px;
  cursor: pointer;
  letter-spacing: 0.06em;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.tab-btn.is-selected {
  background: rgba(124, 180, 255, 0.26);
  color: #f7fbff;
}

.cockpit.is-player2 .tab-btn.is-selected {
  background: rgba(255, 150, 171, 0.26);
}

.cockpit-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.ck-group {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.ck-group--amount {
  flex: 1 1 220px;
  min-width: 220px;
}

.ck-group--submit {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex: 0 0 auto;
}

.ck-group--company-list {
  flex: 1 1 360px;
}

.ck-label {
  font-size: 9px;
  letter-spacing: 0.12em;
  opacity: 0.6;
  min-width: 24px;
}

.ck-seg {
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.seg-btn {
  appearance: none;
  border: none;
  background: transparent;
  color: rgba(220, 230, 250, 0.65);
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.18s ease,
    color 0.18s ease;
  position: relative;
}

.seg-btn:disabled {
  opacity: 0.32;
  cursor: not-allowed;
}

.seg-btn.is-selected {
  background: rgba(124, 180, 255, 0.32);
  color: #f7fbff;
}

.cockpit.is-player2 .seg-btn.is-selected {
  background: rgba(255, 150, 171, 0.28);
}

.seg-btn.is-side-buy.is-selected {
  background: rgba(56, 196, 162, 0.34);
  color: #dcf7ec;
}

.seg-btn.is-side-sell.is-selected {
  background: rgba(232, 88, 118, 0.34);
  color: #fde1e8;
}

.seg-btn--company {
  padding-right: 26px;
}

.charge-badge {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 8px;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(255, 213, 128, 0.2);
  color: #ffd894;
  line-height: 1;
}

.ck-amount {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ck-step {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #e7eefd;
  font-size: 14px;
  font-weight: 800;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  cursor: pointer;
}

.ck-step:hover {
  background: rgba(255, 255, 255, 0.08);
}

.ck-amount-input {
  width: 96px;
  height: 26px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(122, 171, 255, 0.24);
  border-radius: 6px;
  color: #f7fbff;
  font-size: 13px;
  font-weight: 800;
  text-align: right;
  padding: 0 8px;
  font-variant-numeric: tabular-nums;
  -moz-appearance: textfield;
}

.ck-amount-input::-webkit-outer-spin-button,
.ck-amount-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.ck-presets {
  display: flex;
  gap: 3px;
}

.preset-btn {
  appearance: none;
  font-size: 9px;
  font-weight: 700;
  padding: 3px 6px;
  border-radius: 999px;
  border: 1px solid rgba(124, 150, 206, 0.18);
  background: rgba(255, 255, 255, 0.03);
  color: #e7eefd;
  cursor: pointer;
  white-space: nowrap;
}

.preset-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.preset-clear {
  border-color: rgba(255, 213, 128, 0.28);
  color: #ffd894;
}

.ck-hint {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 6px;
  text-align: right;
  min-width: 0;
  align-items: center;
}

.ck-hint-badge {
  grid-row: 1 / span 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: rgba(255, 170, 86, 0.18);
  color: #ffc988;
  font-size: 12px;
  font-weight: 900;
  border: 1px solid rgba(255, 186, 96, 0.44);
  animation: ck-hint-badge-pulse 1.3s ease-in-out infinite;
}

.ck-hint-main {
  font-size: 10px;
  font-weight: 700;
  opacity: 0.92;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
  grid-column: 2;
}

.ck-hint-sub {
  font-size: 9px;
  opacity: 0.55;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
  grid-column: 2;
}

.ck-hint--warn .ck-hint-main {
  color: #ffc988;
  opacity: 1;
  font-weight: 900;
}

.ck-hint--warn .ck-hint-sub {
  color: rgba(255, 201, 136, 0.82);
  opacity: 1;
}

@keyframes ck-hint-badge-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 186, 96, 0.34);
  }

  50% {
    transform: scale(1.08);
    box-shadow: 0 0 0 6px rgba(255, 186, 96, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ck-hint-badge {
    animation: none;
  }
}

.ck-btn {
  appearance: none;
  border: none;
  border-radius: 10px;
  padding: 10px 22px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition:
    filter 0.15s ease,
    transform 0.15s ease;
}

.ck-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ck-btn--primary {
  background: linear-gradient(180deg, #6ba5ff, #4d7ee9);
  color: #fff;
  box-shadow: 0 10px 24px rgba(75, 118, 221, 0.4);
}

.cockpit.is-player2 .ck-btn--primary {
  background: linear-gradient(180deg, #ff7f9b, #d7486c);
  box-shadow: 0 10px 24px rgba(215, 72, 108, 0.38);
}

.ck-btn--primary:not(:disabled):hover {
  filter: brightness(1.08);
}

.ck-btn--ghost {
  background: rgba(255, 255, 255, 0.04);
  color: #e7eefd;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.ck-wait-hint {
  flex: 1;
  font-size: 11px;
  opacity: 0.75;
  line-height: 1.4;
}

.cockpit.is-pending-close {
  border-color: rgba(255, 213, 128, 0.55);
}

.cockpit-close {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.ck-tag {
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.12em;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 213, 128, 0.2);
  color: #ffd894;
}

.ck-close-name {
  font-size: 13px;
  font-weight: 800;
}

.ck-close-kv {
  font-size: 11px;
  opacity: 0.85;
  font-variant-numeric: tabular-nums;
}

.ck-close-kv strong {
  font-weight: 800;
  margin-left: 4px;
}

.ck-close-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
</style>
