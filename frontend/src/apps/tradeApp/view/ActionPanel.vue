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
import { MIN_TRADE_ORDER_AMOUNT, resolveTradeImpactPattern } from '../lib/tradeImpact'

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
  if (actionKind.value !== 'trade') return true

  if (action === 'buy') {
    return props.projection.selectedShortQuantity > 0
  }

  if (action === 'sell') {
    return props.projection.selectedHoldingQuantity > 0
  }

  return false
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

function formatPositionAmount(value: number): string {
  const normalized = Math.round(value * 100) / 100
  return normalized.toLocaleString('ja-JP', {
    minimumFractionDigits: normalized % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
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

  if (form.tradeAction === 'buy') return 'この内容で買いを実行'
  return 'この内容で売りを実行'
})

const selectedPriceText = computed(() => {
  return `${Math.round(props.projection.selectedPrice).toLocaleString('ja-JP')}円`
})

const selectedHoldingText = computed(() => {
  return `${formatPositionAmount(props.projection.selectedHoldingQuantity)}口`
})

const selectedShortText = computed(() => {
  return `${formatPositionAmount(props.projection.selectedShortQuantity)}口`
})

const tradeHint = computed(() => {
  if (isClosePending.value) {
    return `想定約定 ${props.pendingClose?.executionPriceText ?? ''} / 回収 ${props.pendingClose?.returnedCashText ?? ''} / 損益 ${props.pendingClose?.projectedPnlText ?? ''}`
  }

  if (props.projection.orderAmount <= 0) {
    return '注文額を入力すると着地価格と損益が反映されます。'
  }

  if (props.projection.orderAmount < MIN_TRADE_ORDER_AMOUNT) {
    return `最低注文額は ${MIN_TRADE_ORDER_AMOUNT.toLocaleString('ja-JP')}円です。`
  }

  if (props.projection.isCashInsufficient) {
    return `資金不足です。必要 ${props.projection.requiredCashAmount.toLocaleString('ja-JP')}円 / 所持 ${props.projection.availableCash.toLocaleString('ja-JP')}円`
  }

  if (!canSubmitTrade.value) {
    return '反対方向のポジションが残っています。先に決済してください。'
  }

  return `注文額 ${props.projection.orderAmount.toLocaleString('ja-JP')}円`
})

const confirmButtonLabel = computed(() => {
  return isClosePending.value ? 'ポジション決済を確定' : '行動を決定'
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
  <section class="action-panel" :class="[`mode-${actionKind}`, { 'is-close-pending': isClosePending }]">
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
        <div class="meta-pills">
          <span class="meta-pill">現在 {{ selectedPriceText }}</span>
          <span class="meta-pill">買い {{ selectedHoldingText }}</span>
          <span class="meta-pill">売り {{ selectedShortText }}</span>
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
        <div class="helper-line">{{ props.projection.executionEstimateText }}</div>
      </article>

      <article class="card summary-card summary-span">
        <div class="card-title-row"><span class="step">5</span><span>確認</span></div>
        <div class="summary-banner">
          <div class="summary-banner-title">{{ tradeSummaryTitle }}</div>
          <span class="summary-banner-sub">{{ tradeHint }}</span>
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

.action-panel.is-close-pending .panel-grid > .card:not(.summary-card) {
  opacity: 0.52;
  pointer-events: none;
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
