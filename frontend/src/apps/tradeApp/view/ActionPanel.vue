<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type {
  CompanyAction,
  PlayerState,
  StockKey,
  TradeAction,
  TradeMode,
} from '../api/types/game'
import {
  COMPANY_ACTIONS,
  MODE_LABELS,
  TRADE_LABELS,
} from '../api/types/game'
import type {
  BattleActionDraft,
  BattleActionProjection,
} from '../lib/tradeBattle'
import { resolveTradeImpactPattern } from '../lib/tradeImpact'

const props = defineProps<{
  currentPlayer: PlayerState
  draft: BattleActionDraft
  projection: BattleActionProjection
  pendingClose?: {
    stockName: string
    side: 'buy' | 'sell'
    executionPriceText: string
    projectedPnlText: string
    returnedCashText: string
  } | null
}>()

const emit = defineEmits<{
  'update:draft': [draft: BattleActionDraft]
  confirm: []
}>()

const form = reactive<BattleActionDraft>({
  ...props.draft,
})

const quickAmounts = [1000, 5000, 10000] as const

let syncingFromProps = false

watch(
  () => props.draft,
  (draft) => {
    syncingFromProps = true
    Object.assign(form, draft)
    syncingFromProps = false
  },
  { deep: true, immediate: true },
)

watch(
  form,
  () => {
    if (syncingFromProps) return
    emit('update:draft', { ...form })
  },
  { deep: true },
)

const actionKind = computed({
  get: () => form.actionKind,
  set: (value: BattleActionDraft['actionKind']) => {
    form.actionKind = value
  },
})

const companyActions = computed(() => props.projection.companyActions)
const visibleTradeActions = computed(() => props.projection.visibleTradeActions)
const canSubmitTrade = computed(() => props.projection.canSubmitTrade)
const canSubmitCompany = computed(() => props.projection.canSubmitCompany)
const canSubmitWait = computed(() => props.projection.canSubmitWait)
const canSubmit = computed(() => props.projection.canSubmit)
const isClosePending = computed(() => props.pendingClose != null)

type GuideTone = 'up-strong' | 'up' | 'down' | 'down-strong'

type TradeGuideEffect = {
  label: string
  percentText: string
  tone: GuideTone
}

type TradeGuideItem = {
  key: StockKey
  title: string
  effects: TradeGuideEffect[]
}

function ownStockKey(): 'p1' | 'p2' {
  return props.currentPlayer.id === 'player1' ? 'p1' : 'p2'
}

function rivalStockKey(): 'p1' | 'p2' {
  return ownStockKey() === 'p1' ? 'p2' : 'p1'
}

function nextCompanyAction(): CompanyAction {
  return companyActions.value[0] ?? COMPANY_ACTIONS[0]
}

function setActionKind(kind: 'trade' | 'company' | 'wait'): void {
  actionKind.value = kind

  if (kind === 'trade') {
    form.companyAction = COMPANY_ACTIONS[0]
    return
  }

  if (kind === 'wait') {
    form.companyAction = COMPANY_ACTIONS[0]
    form.quantity = 0
    return
  }

  form.stockKey = ownStockKey()
  form.companyAction = nextCompanyAction()
}

function isTradeDisabled(action: TradeAction): boolean {
  void action
  return actionKind.value !== 'trade'
}

function selectTradeAction(action: TradeAction): void {
  if (isTradeDisabled(action)) return
  form.tradeAction = action
}

function stepAmount(diff: number): void {
  form.quantity = Math.max(0, props.projection.orderAmount + diff)
}

function addPreset(amount: number): void {
  form.quantity = props.projection.orderAmount + amount
}

function resetAmount(): void {
  form.quantity = 0
}

function submitTurn(): void {
  if (!isClosePending.value && !canSubmit.value) return
  emit('confirm')
}

function resolveGuideTitle(targetKey: StockKey): string {
  if (targetKey === ownStockKey()) {
    return form.tradeAction === 'buy' ? '自社を買う' : '自社を売る'
  }

  if (targetKey === rivalStockKey()) {
    return form.tradeAction === 'buy' ? '相手を買う' : '相手を売る'
  }

  return form.tradeAction === 'buy' ? '市場を買う' : '市場を売る'
}

function resolveEffectLabel(effectKey: StockKey): string {
  if (effectKey === 'market') return '市場'
  return effectKey === ownStockKey() ? '自社' : '相手'
}

function resolveGuideTone(value: number): GuideTone {
  if (value >= 1) return 'up-strong'
  if (value > 0) return 'up'
  if (value <= -1) return 'down-strong'
  return 'down'
}

function formatGuidePercent(value: number): string {
  const percent = Math.round(value * 100)
  return `${percent > 0 ? '+' : ''}${percent}%`
}

const tradeGuideItems = computed<TradeGuideItem[]>(() => {
  const targets: StockKey[] = [ownStockKey(), rivalStockKey(), 'market']
  const effectOrder: StockKey[] = [ownStockKey(), rivalStockKey(), 'market']

  return targets.map((targetKey) => {
    const pattern = resolveTradeImpactPattern(props.currentPlayer.id, targetKey, form.tradeAction)

    return {
      key: targetKey,
      title: resolveGuideTitle(targetKey),
      effects: effectOrder.map((effectKey) => ({
        label: resolveEffectLabel(effectKey),
        percentText: formatGuidePercent(pattern[effectKey]),
        tone: resolveGuideTone(pattern[effectKey]),
      })),
    }
  })
})

const tradeSummaryTitle = computed(() => {
  if (isClosePending.value) {
    return `${props.pendingClose?.stockName ?? ''}の${props.pendingClose?.side === 'buy' ? '買い' : '売り'}ポジションを決済`
  }

  return `${props.currentPlayer.name}のターン`
})

const tradeHint = computed(() => {
  if (isClosePending.value) {
    return `想定約定 ${props.pendingClose?.executionPriceText ?? ''} / 回収 ${props.pendingClose?.returnedCashText ?? ''} / 損益 ${props.pendingClose?.projectedPnlText ?? ''}`
  }

  return ''
})

const confirmButtonLabel = computed(() => {
  if (isClosePending.value) return 'ポジション決済を確定'
  if (actionKind.value === 'trade' && props.projection.isCashInsufficient) return '残高不足'
  return '行動を決定'
})

const companySummaryTitle = computed(() => {
  return isClosePending.value ? tradeSummaryTitle.value : 'この内容で追加操作を実行'
})

const companySummaryHint = computed(() => {
  return isClosePending.value ? tradeHint.value : 'クールダウン中の操作は選べません。'
})

const waitSummaryTitle = computed(() => {
  return isClosePending.value ? tradeSummaryTitle.value : 'このターンは待機する'
})

const waitSummaryHint = computed(() => {
  return isClosePending.value ? tradeHint.value : 'ポジションはそのままで、相手に手番を渡します。'
})

watch(
  () => props.currentPlayer.id,
  () => {
    if (actionKind.value === 'company') {
      form.stockKey = ownStockKey()
    }
  },
)
</script>

<template>
  <section class="action-panel" :class="[currentPlayer.id, `mode-${actionKind}`, { 'is-close-pending': isClosePending }]"
    :data-current-player="currentPlayer.id">
    <div :key="currentPlayer.id" class="turn-strip" :class="currentPlayer.id" data-turn-strip>
      <span class="turn-strip__label">ACTIVE</span>
      <strong class="turn-strip__name">{{ currentPlayer.name }}</strong>
      <span class="turn-strip__meta">が行動中</span>
    </div>

    <div class="panel-grid trade-grid" v-if="actionKind === 'trade'">
      <article class="card kind-card kind-span">
        <div class="card-title-row"><span class="step">1</span><span>行動</span></div>
        <div class="segment vertical-segment">
          <button type="button" class="segment-button small-kind-button selected" @click="setActionKind('trade')">
            注文
          </button>
          <button type="button" class="segment-button small-kind-button" @click="setActionKind('company')">
            追加操作
          </button>
          <button type="button" class="segment-button small-kind-button" @click="setActionKind('wait')">
            待つ
          </button>
        </div>
      </article>

      <article class="card stock-card stock-span">
        <div class="card-title-row"><span class="step">2</span><span>対象レート</span></div>
        <div class="stock-choice-list">
          <button
            v-for="item in tradeGuideItems"
            :key="item.key"
            type="button"
            class="stock-choice trade-guide-choice"
            :class="{ selected: form.stockKey === item.key }"
            @click="form.stockKey = item.key"
          >
            <span class="stock-choice-main">{{ item.title }}</span>
            <span class="trade-guide-effects">
              <span
                v-for="effect in item.effects"
                :key="`${item.key}-${effect.label}`"
                class="trade-guide-chip"
                :class="`is-${effect.tone}`"
              >
                <span class="trade-guide-chip-label">{{ effect.label }}</span>
                <span class="trade-guide-chip-value">{{ effect.percentText }}</span>
              </span>
            </span>
          </button>
        </div>
      </article>

      <article class="card mode-card mode-span">
        <div class="card-title-row"><span class="step">3</span><span>方式 / 操作</span></div>
        <div class="stack-group">
          <div class="segment segment-2">
            <button
              v-for="mode in (['investment', 'speculation'] as TradeMode[])"
              :key="mode"
              type="button"
              class="segment-button"
              :class="{ selected: form.tradeMode === mode }"
              @click="form.tradeMode = mode"
            >
              {{ MODE_LABELS[mode] }}
            </button>
          </div>

          <div class="segment segment-2">
            <button
              v-for="action in visibleTradeActions"
              :key="action"
              type="button"
              class="segment-button"
              :class="{ selected: form.tradeAction === action }"
              :disabled="isTradeDisabled(action)"
              @click="selectTradeAction(action)"
            >
              {{ TRADE_LABELS[action] }}
            </button>
          </div>
        </div>
      </article>

      <article class="card amount-card amount-span">
        <div class="card-title-row amount-title-row">
          <span><span class="step">4</span> 注文金額</span>
          <button type="button" class="mini-clear-button" @click="resetAmount">クリア</button>
        </div>

        <div class="amount-preset-grid">
          <button
            v-for="amount in quickAmounts"
            :key="amount"
            type="button"
            class="preset-chip preset-block"
            @click="addPreset(amount)"
          >
            +{{ amount.toLocaleString('ja-JP') }}
          </button>
        </div>

        <div class="amount-box">
          <button type="button" class="amount-step" @click="stepAmount(-1000)">−</button>
          <input v-model.number="form.quantity" type="number" min="0" step="1000" class="amount-input" />
          <button type="button" class="amount-step" @click="stepAmount(1000)">＋</button>
        </div>
      </article>

      <article class="card summary-card summary-span">
        <div class="card-title-row"><span class="step">5</span><span>確認</span></div>
        <div class="summary-banner">
          <div class="summary-banner-title">{{ tradeSummaryTitle }}</div>
          <span v-if="tradeHint" class="summary-banner-sub">{{ tradeHint }}</span>
        </div>
        <button
          type="button"
          class="confirm-button"
          :disabled="isClosePending ? false : !canSubmitTrade"
          @click="submitTurn"
        >
          {{ confirmButtonLabel }}
        </button>
      </article>
    </div>

    <div class="panel-grid company-grid" v-else-if="actionKind === 'company'">
      <article class="card kind-card company-kind-span">
        <div class="card-title-row"><span class="step">1</span><span>行動</span></div>
        <div class="segment vertical-segment">
          <button type="button" class="segment-button small-kind-button" @click="setActionKind('trade')">注文</button>
          <button type="button" class="segment-button small-kind-button selected" @click="setActionKind('company')">追加操作</button>
          <button type="button" class="segment-button small-kind-button" @click="setActionKind('wait')">待つ</button>
        </div>
      </article>

      <article class="card company-card company-actions-span">
        <div class="card-title-row"><span class="step">2</span><span>追加操作</span></div>
        <div class="segment segment-3">
          <button
            v-for="action in companyActions"
            :key="action"
            type="button"
            class="segment-button"
            :class="{ selected: form.companyAction === action }"
            :disabled="props.currentPlayer.cooldowns[action] > 0"
            @click="form.companyAction = action"
          >
            {{ action }}
          </button>
        </div>
      </article>

      <article class="card summary-card company-summary-span">
        <div class="card-title-row"><span class="step">3</span><span>確認</span></div>
        <div class="summary-banner">
          <div class="summary-banner-title">{{ companySummaryTitle }}</div>
          <span class="summary-banner-sub">{{ companySummaryHint }}</span>
        </div>
        <button
          type="button"
          class="confirm-button"
          :disabled="isClosePending ? false : !canSubmitCompany"
          @click="submitTurn"
        >
          {{ confirmButtonLabel }}
        </button>
      </article>
    </div>

    <div class="panel-grid wait-grid" v-else>
      <article class="card kind-card wait-kind-span">
        <div class="card-title-row"><span class="step">1</span><span>行動</span></div>
        <div class="segment vertical-segment">
          <button type="button" class="segment-button small-kind-button" @click="setActionKind('trade')">注文</button>
          <button type="button" class="segment-button small-kind-button" @click="setActionKind('company')">追加操作</button>
          <button type="button" class="segment-button small-kind-button selected" @click="setActionKind('wait')">待つ</button>
        </div>
      </article>

      <article class="card summary-card wait-summary-span">
        <div class="card-title-row"><span class="step">2</span><span>確認</span></div>
        <div class="summary-banner">
          <div class="summary-banner-title">{{ waitSummaryTitle }}</div>
          <span class="summary-banner-sub">{{ waitSummaryHint }}</span>
        </div>
        <button
          type="button"
          class="confirm-button"
          :disabled="isClosePending ? false : !canSubmitWait"
          @click="submitTurn"
        >
          {{ confirmButtonLabel }}
        </button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.action-panel {
  position: relative;
  isolation: isolate;
  height: auto;
  min-height: 0;
  min-width: 0;
  container-type: inline-size;
  border-radius: 12px;
  border: 1px solid rgba(120, 156, 228, 0.16);
  background:
    linear-gradient(180deg, rgba(2, 10, 28, 0.96) 0%, rgba(2, 8, 22, 0.92) 100%),
    radial-gradient(circle at top, rgba(78, 131, 255, 0.05), transparent 45%);
  padding: 8px 9px 9px;
  overflow: visible;
  display: grid;
  gap: 8px;
}

.action-panel::before {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
}

.action-panel.player1::before {
  background: linear-gradient(
    110deg,
    transparent 10%,
    rgba(99, 163, 255, 0.18) 42%,
    rgba(99, 163, 255, 0.06) 55%,
    transparent 76%
  );
  animation: action-panel-turn-sweep-blue 760ms cubic-bezier(0.22, 0.74, 0.24, 1) both;
}

.action-panel.player2::before {
  background: linear-gradient(
    110deg,
    transparent 10%,
    rgba(255, 110, 138, 0.18) 42%,
    rgba(255, 110, 138, 0.06) 55%,
    transparent 76%
  );
  animation: action-panel-turn-sweep-red 760ms cubic-bezier(0.22, 0.74, 0.24, 1) both;
}

.turn-strip {
  position: relative;
  min-width: 0;
  width: fit-content;
  max-width: 100%;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  overflow: hidden;
  border: 1px solid rgba(132, 168, 240, 0.18);
  background: linear-gradient(180deg, rgba(11, 23, 47, 0.95), rgba(8, 16, 33, 0.96));
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.22);
}

.turn-strip::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.turn-strip.player1 {
  border-color: rgba(124, 180, 255, 0.34);
  box-shadow:
    inset 0 0 0 1px rgba(99, 163, 255, 0.14),
    0 10px 22px rgba(0, 0, 0, 0.22);
}

.turn-strip.player1::after {
  background: linear-gradient(
    118deg,
    transparent 18%,
    rgba(125, 184, 255, 0.3) 48%,
    transparent 78%
  );
  animation: turn-strip-sweep-blue 720ms ease-out both;
}

.turn-strip.player2 {
  border-color: rgba(255, 146, 170, 0.34);
  box-shadow:
    inset 0 0 0 1px rgba(255, 110, 138, 0.14),
    0 10px 22px rgba(0, 0, 0, 0.22);
}

.turn-strip.player2::after {
  background: linear-gradient(
    118deg,
    transparent 18%,
    rgba(255, 150, 171, 0.3) 48%,
    transparent 78%
  );
  animation: turn-strip-sweep-red 720ms ease-out both;
}

.turn-strip__label {
  color: rgba(217, 231, 255, 0.72);
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.turn-strip__name {
  color: #f7fbff;
  font-size: 10px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.turn-strip__meta {
  color: rgba(217, 231, 255, 0.82);
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
}

.turn-strip,
.panel-grid {
  position: relative;
  z-index: 1;
}

.panel-grid {
  min-height: 0;
  min-width: 0;
  display: grid;
  gap: 8px;
  align-items: stretch;
  grid-auto-rows: minmax(0, auto);
}

.trade-grid {
  grid-template-columns:
    minmax(108px, 0.9fr)
    minmax(0, 2.5fr)
    minmax(0, 2fr)
    minmax(186px, 1.35fr)
    minmax(228px, 1.6fr);
}

.company-grid {
  grid-template-columns:
    minmax(132px, 1fr)
    minmax(0, 2.8fr);
}

.wait-grid {
  grid-template-columns:
    minmax(132px, 1fr)
    minmax(0, 4.2fr);
}

.trade-grid > .kind-span,
.trade-grid > .stock-span,
.trade-grid > .mode-span,
.trade-grid > .amount-span,
.trade-grid > .summary-span,
.company-grid > .company-kind-span,
.company-grid > .company-actions-span,
.wait-grid > .wait-kind-span,
.wait-grid > .wait-summary-span {
  grid-column: auto;
}

.company-grid > .company-summary-span {
  grid-column: 1 / -1;
}

.card {
  min-width: 0;
  min-height: 0;
  border-radius: 10px;
  padding: 7px;
  display: grid;
  align-content: start;
  gap: 6px;
  background: rgba(8, 15, 34, 0.92);
  border: 1px solid rgba(118, 139, 182, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.kind-card {
  border-color: rgba(102, 168, 255, 0.34);
}

.stock-card {
  border-color: rgba(76, 205, 225, 0.3);
}

.mode-card {
  border-color: rgba(146, 130, 255, 0.3);
}

.amount-card {
  border-color: rgba(88, 205, 131, 0.34);
}

.company-card {
  border-color: rgba(255, 122, 182, 0.3);
}

.summary-card {
  border-color: rgba(122, 172, 255, 0.32);
  background:
    linear-gradient(180deg, rgba(11, 24, 48, 0.98), rgba(6, 15, 31, 0.95)),
    radial-gradient(circle at top, rgba(78, 131, 255, 0.1), transparent 50%);
  grid-template-rows: auto minmax(0, 1fr) auto;
}

.action-panel.player1 .summary-card {
  box-shadow: inset 0 0 0 1px rgba(99, 163, 255, 0.12);
}

.action-panel.player2 .summary-card {
  box-shadow: inset 0 0 0 1px rgba(255, 110, 138, 0.12);
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #eef5ff;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}

.amount-title-row {
  justify-content: space-between;
}

.step {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  color: #f5f9ff;
  font-size: 8px;
  flex: 0 0 auto;
}

.segment {
  display: grid;
  gap: 6px;
}

.segment-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.segment-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.vertical-segment {
  grid-template-columns: 1fr;
}

.stack-group {
  display: grid;
  gap: 6px;
}

.segment-button,
.preset-chip,
.amount-step,
.confirm-button,
.mini-clear-button,
.stock-choice {
  min-width: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #edf4ff;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background-color 0.16s ease,
    opacity 0.16s ease;
}

.segment-button {
  min-height: 32px;
  padding: 0 8px;
  line-height: 1.1;
}

.small-kind-button {
  min-height: 30px;
  font-size: 9px;
  padding: 0 8px;
}

.segment-button.selected,
.stock-choice.selected {
  border-color: rgba(111, 159, 255, 0.7);
  background: linear-gradient(180deg, rgba(94, 147, 255, 0.76), rgba(74, 124, 233, 0.82));
}

.segment-button:disabled,
.confirm-button:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.stock-choice-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.meta-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meta-pill,
.helper-line {
  color: rgba(220, 234, 255, 0.78);
  font-size: 8px;
}

.meta-pill {
  min-height: 24px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.stock-choice {
  min-height: 72px;
  padding: 8px;
  display: grid;
  align-content: start;
  justify-items: start;
  text-align: left;
  gap: 6px;
}

.stock-choice-main {
  color: #f3f8ff;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.15;
}

.trade-guide-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.trade-guide-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 8px;
  font-weight: 800;
  line-height: 1;
}

.trade-guide-chip-label,
.trade-guide-chip-value {
  color: inherit;
}

.trade-guide-chip-value {
  font-size: 8px;
  font-weight: 900;
}

.trade-guide-chip.is-up-strong {
  color: #8fe4c2;
  background: rgba(31, 102, 77, 0.32);
  border-color: rgba(111, 214, 179, 0.22);
}

.trade-guide-chip.is-up {
  color: #8bc2ff;
  background: rgba(36, 73, 133, 0.28);
  border-color: rgba(111, 159, 255, 0.22);
}

.trade-guide-chip.is-down-strong {
  color: #ff93a4;
  background: rgba(124, 33, 49, 0.32);
  border-color: rgba(255, 123, 142, 0.22);
}

.trade-guide-chip.is-down {
  color: #ffb0bb;
  background: rgba(112, 42, 54, 0.24);
  border-color: rgba(255, 145, 163, 0.2);
}

.amount-preset-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.preset-chip,
.mini-clear-button {
  color: rgba(220, 234, 255, 0.78);
  font-size: 8px;
}

.preset-chip {
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  border-radius: 8px;
}

.mini-clear-button {
  padding: 3px 8px;
  border-radius: 999px;
  line-height: 1;
}

.amount-box {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 32px;
  gap: 6px;
}

.amount-step {
  min-height: 32px;
}

.amount-input {
  width: 100%;
  min-height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(2, 10, 22, 0.88);
  color: #edf4ff;
  font-size: 12px;
  font-weight: 800;
  text-align: center;
  outline: none;
}

.helper-line {
  line-height: 1.3;
}

.summary-banner {
  border-radius: 10px;
  padding: 8px 9px;
  display: grid;
  gap: 5px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.summary-banner-title {
  color: #f7fbff;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.15;
}

.summary-banner-sub {
  color: rgba(220, 234, 255, 0.78);
  font-size: 9px;
  line-height: 1.25;
}

.confirm-button {
  min-height: 38px;
  background: linear-gradient(180deg, rgba(110, 161, 255, 0.9), rgba(77, 126, 233, 0.92));
  border-color: rgba(147, 186, 255, 0.55);
  font-size: 10px;
}

.action-panel.player1 .confirm-button:not(:disabled) {
  box-shadow: 0 0 24px rgba(93, 146, 255, 0.18);
}

.action-panel.player2 .confirm-button:not(:disabled) {
  background: linear-gradient(180deg, rgba(255, 134, 156, 0.92), rgba(215, 72, 108, 0.94));
  border-color: rgba(255, 168, 187, 0.52);
  box-shadow: 0 0 24px rgba(255, 110, 138, 0.18);
}

.action-panel.is-close-pending .panel-grid > .card:not(.summary-card) {
  opacity: 0.52;
  pointer-events: none;
}

@keyframes action-panel-turn-sweep-blue {
  0% {
    transform: translateX(-116%);
    opacity: 0;
  }

  26% {
    opacity: 0.95;
  }

  100% {
    transform: translateX(108%);
    opacity: 0;
  }
}

@keyframes action-panel-turn-sweep-red {
  0% {
    transform: translateX(-116%);
    opacity: 0;
  }

  26% {
    opacity: 0.95;
  }

  100% {
    transform: translateX(108%);
    opacity: 0;
  }
}

@keyframes turn-strip-sweep-blue {
  0% {
    transform: translateX(-120%);
    opacity: 0;
  }

  28% {
    opacity: 1;
  }

  100% {
    transform: translateX(112%);
    opacity: 0;
  }
}

@keyframes turn-strip-sweep-red {
  0% {
    transform: translateX(-120%);
    opacity: 0;
  }

  28% {
    opacity: 1;
  }

  100% {
    transform: translateX(112%);
    opacity: 0;
  }
}

@container (max-width: 1120px) {
  .trade-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .trade-grid > .kind-span {
    grid-column: 1;
  }

  .trade-grid > .stock-span {
    grid-column: 2;
  }

  .trade-grid > .mode-span,
  .trade-grid > .amount-span {
    grid-column: span 2;
  }

  .trade-grid > .summary-span {
    grid-column: span 2;
  }

  .company-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .company-grid > .company-kind-span,
  .company-grid > .company-actions-span,
  .company-grid > .company-summary-span {
    grid-column: 1;
  }

  .stock-choice {
    min-height: 66px;
  }

  .card-title-row {
    font-size: 9px;
  }

  .segment-button,
  .stock-choice-main {
    font-size: 9px;
  }

  .summary-banner-title {
    font-size: 10px;
  }

  .summary-banner-sub {
    font-size: 8px;
  }
}

@container (max-width: 760px) {
  .trade-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .trade-grid > .kind-span {
    grid-column: 1;
  }

  .trade-grid > .mode-span,
  .trade-grid > .amount-span,
  .trade-grid > .summary-span {
    grid-column: 1;
  }

  .stock-choice-list {
    grid-template-columns: minmax(0, 1fr);
  }

  .company-grid,
  .wait-grid,
  .trade-grid > .stock-span,
  .company-grid > .company-kind-span,
  .company-grid > .company-actions-span,
  .company-grid > .company-summary-span,
  .wait-grid > .wait-kind-span,
  .wait-grid > .wait-summary-span {
    grid-column: 1;
  }

  .company-grid,
  .wait-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
