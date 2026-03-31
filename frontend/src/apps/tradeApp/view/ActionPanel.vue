<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type {
    CompanyAction,
    PlayerState,
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

const props = defineProps<{
    currentPlayer: PlayerState
    draft: BattleActionDraft
    projection: BattleActionProjection
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
        if (syncingFromProps) {
            return
        }
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
const stockChoices = computed(() => props.projection.stockChoices)
const selectedPrice = computed(() => props.projection.selectedPrice)
const selectedHolding = computed(() => ({ quantity: props.projection.selectedHoldingQuantity }))
const selectedShort = computed(() => ({ quantity: props.projection.selectedShortQuantity }))
const visibleTradeActions = computed(() => props.projection.visibleTradeActions)
const executionEstimateText = computed(() => props.projection.executionEstimateText)
const companySummaryItems = computed(() => props.projection.preview.companySummaryItems)
const canSubmitTrade = computed(() => props.projection.canSubmitTrade)
const canSubmitCompany = computed(() => props.projection.canSubmitCompany)
const canSubmitWait = computed(() => props.projection.canSubmitWait)
const canSubmit = computed(() => props.projection.canSubmit)
const impactOverviewTitle = computed(() => props.projection.preview.overviewTitle)
const impactOverviewSub = computed(() => props.projection.preview.overviewSub)
const waitImpactPreview = computed(() => props.projection.preview.stockImpactPreview)

const selectedChoice = computed(() =>
    stockChoices.value.find((choice) => choice.key === form.stockKey) ?? stockChoices.value[0],
)
const selectedTradeModeLabel = computed(() => MODE_LABELS[form.tradeMode])
const selectedTradeActionLabel = computed(() => TRADE_LABELS[form.tradeAction])
const orderAmountLabel = computed(() => `${props.projection.orderAmount.toLocaleString()}円`)

const confirmHint = computed(() => {
    if (actionKind.value === 'trade') {
        if (props.projection.orderAmount <= 0) {
            return '注文額を入力すると執行見込みが確定します'
        }
        if (props.projection.isCashInsufficient) {
            return `現金不足です。必要 ${props.projection.requiredCashAmount.toLocaleString()}円 / 所持 ${props.projection.availableCash.toLocaleString()}円`
        }
        if (!canSubmitTrade.value) {
            return '現在の保有数または注文額では約定できません'
        }
        return 'この内容で 1 ターン分の注文を送ります'
    }

    if (actionKind.value === 'company') {
        return '会社資金と自社株への影響を確認して実行します'
    }

    return 'このターンはポジションを増やさずに待機します'
})

function ownStockKey(): 'p1' | 'p2' {
    return props.currentPlayer.id === 'player1' ? 'p1' : 'p2'
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
    if (form.companyAction === COMPANY_ACTIONS[0] || form.companyAction === COMPANY_ACTIONS[3]) {
        form.companyAction = nextCompanyAction()
    }
}

function isTradeDisabled(action: TradeAction): boolean {
    if (actionKind.value !== 'trade') return true

    if (form.tradeMode === 'speculation') {
        return action !== 'buy' && action !== 'short'
    }

    if (action === 'sell') return props.projection.selectedHoldingQuantity <= 0
    if (action === 'cover') return props.projection.selectedShortQuantity <= 0
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
    if (!canSubmit.value) return
    emit('confirm')
}

watch(
    () => form.tradeMode,
    (mode: TradeMode) => {
        if (mode === 'speculation' && (form.tradeAction === 'sell' || form.tradeAction === 'cover')) {
            form.tradeAction = 'buy'
        }
    },
)

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
    <section class="action-panel" :class="`mode-${actionKind}`">
        <div class="panel-head">
            <div>
                <div class="panel-title">行動入力</div>
                <div class="panel-subtitle">下段で 1 ターン分の入力を完了し、右側の予測と見比べながら確定します</div>
            </div>
            <div class="turn-note">1ターン1行動</div>
        </div>

        <div class="panel-grid trade-grid" v-if="actionKind === 'trade'">
            <article class="card kind-card span-1 compact-kind-card">
                <div class="card-title-row"><span class="step">1</span><span>行動</span></div>
                <div class="segment vertical-segment">
                    <button type="button" class="segment-button small-kind-button selected" @click="setActionKind('trade')">売買</button>
                    <button type="button" class="segment-button small-kind-button" @click="setActionKind('company')">会社行動</button>
                    <button type="button" class="segment-button small-kind-button" @click="setActionKind('wait')">待つ</button>
                </div>
            </article>

            <article class="card stock-card span-3">
                <div class="card-title-row"><span class="step">2</span><span>対象株</span></div>
                <div class="stock-choice-list">
                    <button
                        v-for="choice in stockChoices"
                        :key="choice.key"
                        type="button"
                        class="stock-choice"
                        :class="{ selected: form.stockKey === choice.key }"
                        @click="form.stockKey = choice.key"
                    >
                        <span class="stock-choice-main">{{ choice.title }}</span>
                        <span class="stock-choice-sub">{{ choice.subtitle }}</span>
                    </button>
                </div>
                <div class="meta-pills">
                    <span class="pill">現在 {{ Math.round(selectedPrice) }}円</span>
                    <span class="pill">保有 {{ selectedHolding.quantity }}株</span>
                    <span class="pill">空売り {{ selectedShort.quantity }}株</span>
                </div>
            </article>

            <article class="card mode-card span-3">
                <div class="card-title-row"><span class="step">3</span><span>方式 / 売買</span></div>
                <div class="stack-group">
                    <div class="segment segment-2 compact-segment-2">
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

                    <div class="segment segment-4 compact-buttons">
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

            <article class="card amount-card span-2">
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
                        +{{ amount.toLocaleString() }}
                    </button>
                </div>

                <div class="amount-box compact-amount-box">
                    <button type="button" class="amount-step" @click="stepAmount(-500)">−</button>
                    <input v-model.number="form.quantity" type="number" min="0" step="500" class="amount-input" />
                    <button type="button" class="amount-step" @click="stepAmount(500)">＋</button>
                </div>
                <div class="helper-line">執行見込み {{ executionEstimateText }}</div>
            </article>

            <article class="card summary-card span-3 confirm-card">
                <div class="card-title-row"><span class="step">5</span><span>確認</span></div>

                <div class="summary-card-body confirm-card-body">
                    <div class="summary-banner compact-summary-banner">
                        <div class="summary-banner-title">注文チケット</div>
                        <strong class="summary-banner-main compact-banner-main">{{ impactOverviewTitle }}</strong>
                        <span class="summary-banner-sub compact-banner-sub">{{ confirmHint }}</span>
                    </div>

                    <div class="ticket-grid">
                        <article class="ticket-item">
                            <div class="ticket-label">対象</div>
                            <div class="ticket-value">{{ selectedChoice?.title }}</div>
                            <div class="ticket-sub">{{ selectedChoice?.subtitle }}</div>
                        </article>

                        <article class="ticket-item">
                            <div class="ticket-label">方式 / 売買</div>
                            <div class="ticket-value">{{ selectedTradeModeLabel }}</div>
                            <div class="ticket-sub">{{ selectedTradeActionLabel }}</div>
                        </article>

                        <article class="ticket-item">
                            <div class="ticket-label">注文金額</div>
                            <div class="ticket-value">{{ orderAmountLabel }}</div>
                            <div class="ticket-sub">入力した金額ベースで計算</div>
                        </article>

                        <article class="ticket-item emphasize">
                            <div class="ticket-label">執行見込み</div>
                            <div class="ticket-value">{{ executionEstimateText }}</div>
                            <div class="ticket-sub">現在価格での概算です</div>
                        </article>
                    </div>
                </div>

                <button type="button" class="confirm-button" :disabled="!canSubmitTrade" @click="submitTurn">行動を決定</button>
            </article>
        </div>

        <div class="panel-grid company-grid" v-else-if="actionKind === 'company'">
            <article class="card kind-card span-2 compact-kind-card">
                <div class="card-title-row"><span class="step">1</span><span>行動</span></div>
                <div class="segment vertical-segment">
                    <button type="button" class="segment-button small-kind-button" @click="setActionKind('trade')">売買</button>
                    <button type="button" class="segment-button small-kind-button selected" @click="setActionKind('company')">会社行動</button>
                    <button type="button" class="segment-button small-kind-button" @click="setActionKind('wait')">待つ</button>
                </div>
            </article>

            <article class="card company-card span-4">
                <div class="card-title-row"><span class="step">2</span><span>会社行動</span></div>
                <div class="segment segment-3 company-actions compact-company-actions">
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
                <div class="helper-line">増資は会社資金を増やし、広告と設備投資は自社株の追い風になります</div>
            </article>

            <article class="card summary-card span-6 company-summary-card">
                <div class="card-title-row"><span class="step">3</span><span>確認</span></div>
                <div class="summary-card-body company-summary-body">
                    <div class="summary-banner compact-summary-banner">
                        <div class="summary-banner-title">今回の実行内容</div>
                        <strong class="summary-banner-main compact-banner-main">{{ impactOverviewTitle }}</strong>
                        <span class="summary-banner-sub compact-banner-sub">{{ confirmHint }}</span>
                    </div>
                    <div class="summary-badges company-summary-grid">
                        <div v-for="item in companySummaryItems" :key="item.label" class="summary-badge">
                            <span class="summary-badge-label">{{ item.label }}</span>
                            <strong class="summary-badge-value">{{ item.value }}</strong>
                        </div>
                    </div>
                </div>
                <button type="button" class="confirm-button" :disabled="!canSubmitCompany" @click="submitTurn">この内容で実行</button>
            </article>
        </div>

        <div class="panel-grid wait-grid" v-else>
            <article class="card kind-card span-2 compact-kind-card">
                <div class="card-title-row"><span class="step">1</span><span>行動</span></div>
                <div class="segment vertical-segment">
                    <button type="button" class="segment-button small-kind-button" @click="setActionKind('trade')">売買</button>
                    <button type="button" class="segment-button small-kind-button" @click="setActionKind('company')">会社行動</button>
                    <button type="button" class="segment-button small-kind-button selected" @click="setActionKind('wait')">待つ</button>
                </div>
            </article>

            <article class="card summary-card span-10 wait-summary-card">
                <div class="card-title-row"><span class="step">2</span><span>確認</span></div>
                <div class="summary-card-body wait-summary-body">
                    <div class="summary-banner compact-summary-banner">
                        <div class="summary-banner-title">待機内容</div>
                        <strong class="summary-banner-main compact-banner-main">{{ impactOverviewTitle }}</strong>
                        <span class="summary-banner-sub compact-banner-sub">{{ impactOverviewSub }}</span>
                    </div>
                    <div class="wait-chip-row">
                        <span v-for="item in waitImpactPreview" :key="item.key" class="wait-chip">
                            {{ item.title }}: {{ item.headline }}
                        </span>
                    </div>
                </div>
                <button type="button" class="confirm-button" :disabled="!canSubmitWait" @click="submitTurn">このターンは待つ</button>
            </article>
        </div>
    </section>
</template>

<style scoped>
.action-panel {
    height: 100%;
    min-height: 0;
    min-width: 0;
    border-radius: 16px;
    border: 1px solid rgba(120, 156, 228, 0.16);
    background:
        linear-gradient(180deg, rgba(2, 10, 28, 0.96) 0%, rgba(2, 8, 22, 0.92) 100%),
        radial-gradient(circle at top, rgba(78, 131, 255, 0.05), transparent 45%);
    padding: 6px 8px 8px;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 6px;
    overflow: hidden;
}

.panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
}

.panel-title {
    color: #f4f8ff;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.05;
}

.panel-subtitle {
    margin-top: 1px;
    color: rgba(193, 214, 255, 0.66);
    font-size: 9px;
    line-height: 1.2;
}

.turn-note {
    flex: 0 0 auto;
    padding: 2px 7px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #dfeaff;
    font-size: 9px;
    font-weight: 800;
}

.panel-grid {
    min-height: 0;
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 6px;
    align-items: stretch;
}

.trade-grid .span-1 { grid-column: span 1; }
.trade-grid .span-2 { grid-column: span 2; }
.trade-grid .span-3 { grid-column: span 3; }
.company-grid .span-2 { grid-column: span 2; }
.company-grid .span-4 { grid-column: span 4; }
.company-grid .span-6 { grid-column: span 6; }
.wait-grid .span-2 { grid-column: span 2; }
.wait-grid .span-10 { grid-column: span 10; }

.card {
    min-width: 0;
    min-height: 0;
    border-radius: 14px;
    padding: 6px;
    display: grid;
    align-content: start;
    gap: 5px;
    background: rgba(8, 15, 34, 0.92);
    border: 1px solid rgba(118, 139, 182, 0.18);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.kind-card { border-color: rgba(102, 168, 255, 0.34); }
.stock-card { border-color: rgba(76, 205, 225, 0.3); }
.mode-card { border-color: rgba(146, 130, 255, 0.3); }
.amount-card { border-color: rgba(88, 205, 131, 0.34); }
.company-card { border-color: rgba(255, 122, 182, 0.3); }
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
    width: 16px;
    height: 16px;
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
    gap: 5px;
}

.segment-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.segment-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.segment-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.vertical-segment { grid-template-columns: 1fr; }

.stack-group {
    display: grid;
    gap: 5px;
}

.segment-button,
.preset-chip,
.amount-step,
.confirm-button,
.mini-clear-button,
.stock-choice {
    min-width: 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
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

.segment-button { min-height: 30px; padding: 0 6px; line-height: 1.15; }
.small-kind-button { min-height: 26px; font-size: 9px; padding: 0 4px; }
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
    gap: 5px;
}

.stock-choice {
    min-height: 42px;
    padding: 5px 6px;
    display: grid;
    align-content: center;
    justify-items: start;
    text-align: left;
    gap: 2px;
}

.stock-choice-main {
    color: #f3f8ff;
    font-size: 11px;
    font-weight: 800;
    line-height: 1.05;
}

.stock-choice-sub {
    color: rgba(217, 231, 255, 0.74);
    font-size: 8px;
    font-weight: 700;
    line-height: 1.1;
}

.meta-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.amount-preset-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 5px;
}

.pill,
.preset-chip,
.helper-line,
.mini-clear-button {
    color: rgba(220, 234, 255, 0.78);
    font-size: 9px;
}

.pill,
.preset-chip {
    min-height: 24px;
    padding: 0 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
}

.preset-block {
    min-height: 28px;
    border-radius: 9px;
}

.mini-clear-button {
    padding: 2px 7px;
    border-radius: 999px;
    line-height: 1;
}

.helper-line {
    line-height: 1.2;
}

.amount-box {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) 32px;
    gap: 5px;
}

.amount-step {
    min-height: 32px;
}

.amount-input {
    width: 100%;
    min-height: 32px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(2, 10, 22, 0.88);
    color: #edf4ff;
    font-size: 11px;
    font-weight: 800;
    text-align: center;
    outline: none;
}

.summary-card-body {
    min-height: 0;
    display: grid;
    gap: 5px;
    overflow: hidden;
}

.confirm-card-body,
.company-summary-body,
.wait-summary-body {
    grid-template-rows: auto minmax(0, 1fr);
}

.summary-banner {
    border-radius: 10px;
    padding: 6px 7px;
    display: grid;
    gap: 2px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.07);
}

.summary-banner-title {
    color: rgba(193, 214, 255, 0.7);
    font-size: 8px;
    font-weight: 700;
}

.summary-banner-main {
    color: #f7fbff;
    font-size: 11px;
    font-weight: 800;
    line-height: 1.15;
}

.summary-banner-sub {
    color: rgba(220, 234, 255, 0.78);
    font-size: 8px;
    line-height: 1.15;
}

.ticket-grid {
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 5px;
}

.ticket-item,
.summary-badge,
.wait-chip {
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.045);
    border: 1px solid rgba(255, 255, 255, 0.06);
}

.ticket-item {
    padding: 6px;
    display: grid;
    gap: 2px;
}

.ticket-item.emphasize {
    border-color: rgba(118, 195, 255, 0.32);
    background: rgba(52, 88, 154, 0.16);
}

.ticket-label,
.summary-badge-label {
    color: rgba(193, 214, 255, 0.7);
    font-size: 8px;
    font-weight: 700;
    line-height: 1;
}

.ticket-value,
.summary-badge-value {
    color: #f4f8ff;
    font-size: 10px;
    font-weight: 800;
    line-height: 1.15;
}

.ticket-sub {
    color: rgba(220, 234, 255, 0.74);
    font-size: 7px;
    line-height: 1.15;
}

.summary-badges {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 5px;
}

.summary-badge {
    padding: 6px;
    display: grid;
    gap: 2px;
}

.company-summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.wait-chip-row {
    min-height: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    align-content: flex-start;
}

.wait-chip {
    padding: 5px 7px;
    color: #edf4ff;
    font-size: 8px;
    font-weight: 700;
}

.confirm-button {
    min-height: 32px;
    background: linear-gradient(180deg, rgba(110, 161, 255, 0.9), rgba(77, 126, 233, 0.92));
    border-color: rgba(147, 186, 255, 0.55);
    font-size: 10px;
}

@media (max-width: 1500px) {
    .panel-grid { gap: 5px; }
    .card { padding: 5px; }
    .stock-choice { min-height: 38px; }
    .segment-button { min-height: 28px; font-size: 9px; }
    .ticket-grid { gap: 4px; }
    .ticket-item { padding: 5px; }
}
</style>
