<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type {
    CompanyAction,
    PlayerState,
    StockKey,
    StockState,
    TradeAction,
    TradeMode,
    TurnActionPayload,
} from '../api/types/game'
import {
    COMPANY_ACTIONS,
    MODE_LABELS,
    STOCK_LABELS,
    TRADE_ACTIONS,
    TRADE_LABELS,
} from '../api/types/game'

type StockImpactLevel = 'strong-up' | 'up' | 'neutral' | 'down' | 'strong-down'

type StockImpactItem = {
    key: StockKey
    title: string
    subtitle: string
    level: StockImpactLevel
    headline: string
    detail: string
}

type ActionPanelPayload = TurnActionPayload & {
    metaAction?: 'wait'
}

const props = defineProps<{
    currentPlayer: PlayerState
    stocks: StockState[]
}>()

const emit = defineEmits<{
    confirm: [payload: ActionPanelPayload]
}>()

const actionKind = ref<'trade' | 'company' | 'wait'>('trade')

const form = reactive<TurnActionPayload>({
    stockKey: 'market',
    tradeAction: 'buy',
    tradeMode: 'investment',
    quantity: 0,
    companyAction: 'なし',
})

const quickAmounts = [1000, 5000, 10000] as const

const ownStockKey = computed<StockKey>(() => (props.currentPlayer.id === 'player1' ? 'p1' : 'p2'))
const rivalStockKey = computed<StockKey>(() => (props.currentPlayer.id === 'player1' ? 'p2' : 'p1'))

const companyActions = computed(() =>
    COMPANY_ACTIONS.filter(
        (action): action is Exclude<CompanyAction, 'なし' | '自社株買い'> =>
            action !== 'なし' && action !== '自社株買い',
    ),
)

const stockChoices = computed(() => [
    {
        key: ownStockKey.value,
        title: '自社株',
        subtitle: STOCK_LABELS[ownStockKey.value],
    },
    {
        key: rivalStockKey.value,
        title: '相手株',
        subtitle: STOCK_LABELS[rivalStockKey.value],
    },
    {
        key: 'market' as StockKey,
        title: '市場株',
        subtitle: '共通マーケット',
    },
])

const selectedStock = computed(() => props.stocks.find((stock) => stock.key === form.stockKey))
const selectedPrice = computed(() => selectedStock.value?.currentPrice ?? 0)
const selectedHolding = computed(() => props.currentPlayer.holdings[form.stockKey])
const selectedShort = computed(() => props.currentPlayer.shorts[form.stockKey])
const selectedStockChoice = computed(
    () => stockChoices.value.find((choice) => choice.key === form.stockKey) ?? stockChoices.value[0],
)

const orderAmount = computed(() => Math.max(0, Math.floor(Number(form.quantity) || 0)))

const estimatedShares = computed(() => {
    const price = selectedPrice.value
    const amount = orderAmount.value
    if (price <= 0 || amount < price) return 0
    return Math.floor(amount / price)
})

const executedAmount = computed(() => estimatedShares.value * selectedPrice.value)
const effectScale = computed(() => {
    const shares = estimatedShares.value
    if (shares >= 100) return 'large'
    if (shares >= 40) return 'medium'
    if (shares >= 1) return 'small'
    return 'none'
})

const visibleTradeActions = computed<TradeAction[]>(() => {
    if (form.tradeMode === 'speculation') {
        return ['buy', 'short']
    }
    return TRADE_ACTIONS
})

// const orderHeadline = computed(() => {
//     if (actionKind.value === 'company') {
//         return '会社行動を実行'
//     }

//     return `${MODE_LABELS[form.tradeMode]} / ${TRADE_LABELS[form.tradeAction]}`
// })

const selectedTargetLabel = computed(() => selectedStockChoice.value?.title ?? '市場株')
// const selectedTargetSubLabel = computed(() => selectedStockChoice.value?.subtitle ?? '')

const executionEstimateText = computed(() => {
    if (actionKind.value !== 'trade') return '未計算'
    if (estimatedShares.value <= 0 || executedAmount.value <= 0) {
        return '注文額不足'
    }
    return `${formatCurrency(executedAmount.value)} / 約${estimatedShares.value}株`
})

// const tradeMetaSummary = computed(() => {
//     if (actionKind.value !== 'trade') return ''
//     if (estimatedShares.value <= 0) {
//         return `${selectedTargetLabel.value} / ${MODE_LABELS[form.tradeMode]} / ${TRADE_LABELS[form.tradeAction]}`
//     }

//     return `${selectedTargetLabel.value}を約${estimatedShares.value}株ぶん ${TRADE_LABELS[form.tradeAction]}`
// })

const companySummaryItems = computed(() => [
    { label: '実行者', value: props.currentPlayer.name },
    { label: '対象', value: '自社へ実行' },
    { label: '内容', value: form.companyAction },
])

const canSubmitTrade = computed(() => {
    if (actionKind.value !== 'trade') return false
    if (estimatedShares.value <= 0) return false
    if (form.tradeAction === 'sell') return selectedHolding.value.quantity > 0
    if (form.tradeAction === 'cover') return selectedShort.value.quantity > 0
    return true
})

const canSubmitCompany = computed(() => actionKind.value === 'company' && form.companyAction !== 'なし')
const canSubmitWait = computed(() => actionKind.value === 'wait')
const canSubmit = computed(() => canSubmitTrade.value || canSubmitCompany.value || canSubmitWait.value)

const tradeImpactSummary = computed(() => {
    if (estimatedShares.value <= 0) {
        return 'まだ影響を計算できません'
    }

    const sizeText =
        effectScale.value === 'large'
            ? '強め'
            : effectScale.value === 'medium'
              ? '中くらい'
              : '小さめ'

    if (form.tradeAction === 'buy') {
        return `${selectedTargetLabel.value}に${sizeText}の買い圧力`
    }

    if (form.tradeAction === 'sell') {
        return `${selectedTargetLabel.value}に${sizeText}の売り圧力`
    }

    if (form.tradeAction === 'short') {
        return `${selectedTargetLabel.value}に${sizeText}の下落圧力`
    }

    return `${selectedTargetLabel.value}の下落圧力を${sizeText}で解消`
})


const impactOverviewTitle = computed(() => {
    if (actionKind.value === 'wait') {
        return '取引せず様子見'
    }

    if (actionKind.value === 'company') {
        return '会社行動の影響を確認'
    }

    return tradeImpactSummary.value
})

const impactOverviewSub = computed(() => {
    if (actionKind.value === 'wait') {
        return 'このターンはポジションを増やさず、外部変動だけを見る'
    }

    if (actionKind.value === 'company') {
        return '会社行動はルール確定後に価格影響を細かく反映'
    }

    if (estimatedShares.value <= 0) {
        return '注文額が入ると概算約定と影響の強さを表示'
    }

    return `概算約定 ${executionEstimateText.value}`
})

const waitImpactPreview = computed<StockImpactItem[]>(() =>
    stockChoices.value.map((choice) => ({
        key: choice.key,
        title: choice.title,
        subtitle: choice.subtitle,
        level: 'neutral' as StockImpactLevel,
        headline: '大きな直接影響なし',
        detail: '待機なのでこの行動そのものでは値動きを起こさない',
    })),
)

// const tradeActionChips = computed(() => {
//     if (actionKind.value !== 'trade') return []
//     return [
//         selectedTargetLabel.value,
//         MODE_LABELS[form.tradeMode],
//         TRADE_LABELS[form.tradeAction],
//         orderAmount.value > 0 ? `${orderAmount.value.toLocaleString()}円` : '金額未入力',
//     ]
// })

const stockImpactPreview = computed<StockImpactItem[]>(() => {
    const items = stockChoices.value.map((choice) => ({
        key: choice.key,
        title: choice.title,
        subtitle: choice.subtitle,
        level: 'neutral' as StockImpactLevel,
        headline: 'ほぼ変化なし',
        detail: 'この行動の直接影響は小さめ',
    }))

    if (actionKind.value === 'wait') {
        return waitImpactPreview.value
    }

    if (actionKind.value !== 'trade' || estimatedShares.value <= 0) {
        return items.map((item) => ({
            ...item,
            headline: '入力待ち',
            detail: '注文額が入ると影響プレビューを表示',
        }))
    }

    const targetKey = form.stockKey
    const targetIndex = items.findIndex((item) => item.key === targetKey)
    const marketIndex = items.findIndex((item) => item.key === 'market')
    const targetIsCompany = targetKey === 'p1' || targetKey === 'p2'
    const impactLabel = effectScale.value === 'large' ? '大' : effectScale.value === 'medium' ? '中' : '小'

    const setImpact = (key: StockKey, level: StockImpactLevel, headline: string, detail: string) => {
        const index = items.findIndex((item) => item.key === key)
        if (index >= 0) {
            items[index] = { ...items[index], level, headline, detail }
        }
    }

    if (form.tradeAction === 'buy') {
        setImpact(
            targetKey,
            targetKey === 'market' ? 'strong-up' : 'up',
            targetKey === 'market' ? '上昇しやすい' : '買いで上がりやすい',
            `${impactLabel}サイズの買い注文で需要が増える`,
        )

        if (targetIsCompany) {
            setImpact('market', 'down', 'やや下がりやすい', '会社株が買われると市場株は逆方向へ触れやすい')
        } else {
            setImpact(ownStockKey.value, 'neutral', '様子見', '市場株の買いは会社株へ直撃しない')
            setImpact(rivalStockKey.value, 'neutral', '様子見', '市場株の買いは相手株へ直撃しない')
        }
    }

    if (form.tradeAction === 'sell') {
        setImpact(
            targetKey,
            targetKey === 'market' ? 'strong-down' : 'down',
            targetKey === 'market' ? '下がりやすい' : '売りで下がりやすい',
            `${impactLabel}サイズの売り注文で需給が悪化する`,
        )

        if (targetIsCompany) {
            setImpact('market', 'up', 'やや上がりやすい', '会社株の売りで市場株が相対的に買われやすい')
        } else {
            setImpact(ownStockKey.value, 'neutral', '様子見', '市場株の売りは会社株へ直撃しない')
            setImpact(rivalStockKey.value, 'neutral', '様子見', '市場株の売りは相手株へ直撃しない')
        }
    }

    if (form.tradeAction === 'short') {
        setImpact(
            targetKey,
            'strong-down',
            '下落しやすい',
            `${impactLabel}サイズの空売りで売り圧力が強まる`,
        )

        if (targetIsCompany) {
            setImpact('market', 'up', 'やや上がりやすい', '会社株の弱さで市場株が相対的に持ち直しやすい')
        } else {
            setImpact(ownStockKey.value, 'neutral', '様子見', '市場株への空売りは会社株へ直撃しない')
            setImpact(rivalStockKey.value, 'neutral', '様子見', '市場株への空売りは相手株へ直撃しない')
        }
    }

    if (form.tradeAction === 'cover') {
        setImpact(
            targetKey,
            'up',
            '下げ圧が弱まる',
            `${impactLabel}サイズの買い戻しで価格が戻りやすい`,
        )

        if (targetIsCompany) {
            setImpact('market', 'down', 'やや下がりやすい', '会社株の戻りで市場株は逆方向に振れやすい')
        } else {
            setImpact(ownStockKey.value, 'neutral', '様子見', '市場株の買い戻しは会社株へ直撃しない')
            setImpact(rivalStockKey.value, 'neutral', '様子見', '市場株の買い戻しは相手株へ直撃しない')
        }
    }

    if (targetIsCompany) {
        const otherCompanyKey = targetKey === ownStockKey.value ? rivalStockKey.value : ownStockKey.value
        setImpact(otherCompanyKey, 'neutral', 'ほぼ横ばい', '今回の注文は直接は刺さらない')
    }

    if (!targetIsCompany && marketIndex >= 0) {
        const ownKey = ownStockKey.value
        const rivalKey = rivalStockKey.value
        if (targetIndex !== marketIndex) {
            setImpact(ownKey, 'neutral', 'ほぼ横ばい', '市場注文の主戦場は会社株ではない')
            setImpact(rivalKey, 'neutral', 'ほぼ横ばい', '市場注文の主戦場は会社株ではない')
        }
    }

    return items
})

function formatCurrency(value: number): string {
    return `${Math.round(value).toLocaleString()}円`
}

function nextCompanyAction(): CompanyAction {
    return companyActions.value[0] ?? 'なし'
}

function setActionKind(kind: 'trade' | 'company' | 'wait'): void {
    actionKind.value = kind

    if (kind === 'trade') {
        form.companyAction = 'なし'
        return
    }

    if (kind === 'wait') {
        form.companyAction = 'なし'
        form.quantity = 0
        return
    }

    form.stockKey = ownStockKey.value
    if (form.companyAction === 'なし' || form.companyAction === '自社株買い') {
        form.companyAction = nextCompanyAction()
    }
}

function isTradeDisabled(action: TradeAction): boolean {
    if (actionKind.value !== 'trade') return true

    if (form.tradeMode === 'speculation') {
        return action !== 'buy' && action !== 'short'
    }

    if (action === 'sell') return selectedHolding.value.quantity <= 0
    if (action === 'cover') return selectedShort.value.quantity <= 0
    return false
}

function selectTradeAction(action: TradeAction): void {
    if (isTradeDisabled(action)) return
    form.tradeAction = action
}

function stepAmount(diff: number): void {
    form.quantity = Math.max(0, orderAmount.value + diff)
}

function addPreset(amount: number): void {
    form.quantity = orderAmount.value + amount
}

function resetAmount(): void {
    form.quantity = 0
}

function submitTurn(): void {
    if (!canSubmit.value) return

    if (actionKind.value === 'wait') {
        emit('confirm', {
            ...form,
            metaAction: 'wait',
            stockKey: ownStockKey.value,
            quantity: 0,
            companyAction: 'なし',
        })
        return
    }

    emit('confirm', {
        ...form,
        stockKey: actionKind.value === 'company' ? ownStockKey.value : form.stockKey,
        quantity: orderAmount.value,
        companyAction: actionKind.value === 'company' ? form.companyAction : 'なし',
    })
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
            form.stockKey = ownStockKey.value
        }
    },
)
</script>


<template>
    <section class="action-panel" :class="`mode-${actionKind}`">
        <div class="panel-head">
            <div>
                <div class="panel-title">行動入力</div>
                <div class="panel-subtitle">画面内で完結するよう、確認を主役にした横並びレイアウトへ圧縮</div>
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
                <div class="helper-line">概算 {{ executionEstimateText }}</div>
            </article>

            <article class="card summary-card span-3 impact-summary-card">
                <div class="card-title-row"><span class="step">5</span><span>確認</span></div>

                <div class="summary-card-body impact-summary-body compact-impact-body">
                    <div class="summary-banner compact-summary-banner">
                        <div class="summary-banner-title">今回の影響まとめ</div>
                        <strong class="summary-banner-main compact-banner-main">{{ impactOverviewTitle }}</strong>
                        <span class="summary-banner-sub compact-banner-sub">{{ impactOverviewSub }}</span>
                    </div>

                    <div class="impact-glance-board compact-impact-grid">
                        <article
                            v-for="item in stockImpactPreview"
                            :key="item.key"
                            class="impact-glance-card"
                            :class="item.level"
                        >
                            <div class="impact-glance-top compact-glance-top">
                                <div>
                                    <div class="impact-glance-title">{{ item.title }}</div>
                                    <div class="impact-glance-subtitle">{{ item.subtitle }}</div>
                                </div>
                                <div class="impact-direction-badge small-badge" :class="item.level">
                                    <span v-if="item.level === 'strong-up'">↑↑</span>
                                    <span v-else-if="item.level === 'up'">↑</span>
                                    <span v-else-if="item.level === 'down'">↓</span>
                                    <span v-else-if="item.level === 'strong-down'">↓↓</span>
                                    <span v-else>→</span>
                                </div>
                            </div>
                            <div class="impact-glance-headline">{{ item.headline }}</div>
                            <div class="impact-glance-detail one-line-detail">{{ item.detail }}</div>
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
                <div class="helper-line">増資は下押し、配当と設備投資は自社株へ追い風</div>
            </article>

            <article class="card summary-card span-6 company-summary-card">
                <div class="card-title-row"><span class="step">3</span><span>確認</span></div>
                <div class="summary-card-body company-summary-body compact-impact-body">
                    <div class="summary-banner compact-summary-banner">
                        <div class="summary-banner-title">今回の見立て</div>
                        <strong class="summary-banner-main compact-banner-main">{{ impactOverviewTitle }}</strong>
                        <span class="summary-banner-sub compact-banner-sub">会社行動の細かい反映はルール確定後に調整</span>
                    </div>
                    <div class="summary-badges company-summary-grid compact-company-grid">
                        <div v-for="item in companySummaryItems" :key="item.label" class="summary-badge">
                            <span class="summary-badge-label">{{ item.label }}</span>
                            <strong class="summary-badge-value">{{ item.value }}</strong>
                        </div>
                    </div>
                </div>
                <button type="button" class="confirm-button" :disabled="!canSubmitCompany" @click="submitTurn">この内容で決定</button>
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
                <div class="summary-card-body impact-summary-body compact-impact-body">
                    <div class="summary-banner compact-summary-banner">
                        <div class="summary-banner-title">今回の影響まとめ</div>
                        <strong class="summary-banner-main compact-banner-main">{{ impactOverviewTitle }}</strong>
                        <span class="summary-banner-sub compact-banner-sub">{{ impactOverviewSub }}</span>
                    </div>
                    <div class="impact-glance-board compact-impact-grid">
                        <article
                            v-for="item in waitImpactPreview"
                            :key="item.key"
                            class="impact-glance-card"
                            :class="item.level"
                        >
                            <div class="impact-glance-top compact-glance-top">
                                <div>
                                    <div class="impact-glance-title">{{ item.title }}</div>
                                    <div class="impact-glance-subtitle">{{ item.subtitle }}</div>
                                </div>
                                <div class="impact-direction-badge small-badge neutral">→</div>
                            </div>
                            <div class="impact-glance-headline">{{ item.headline }}</div>
                            <div class="impact-glance-detail one-line-detail">{{ item.detail }}</div>
                        </article>
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
.confirm-button:disabled { opacity: 0.42; cursor: not-allowed; }

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

.preset-block { min-height: 28px; border-radius: 9px; }
.mini-clear-button { padding: 2px 7px; border-radius: 999px; line-height: 1; }
.helper-line { line-height: 1.2; }

.amount-box {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) 32px;
    gap: 5px;
}

.amount-step { min-height: 32px; }
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

.impact-summary-body { grid-template-rows: auto minmax(0, 1fr); }
.compact-impact-body { align-content: start; }
.compact-summary-banner { padding: 6px 7px; gap: 3px; }
.compact-banner-main { font-size: 10px; }
.compact-banner-sub { font-size: 8px; }
.summary-banner {
    border-radius: 10px;
    padding: 6px 7px;
    display: grid;
    gap: 2px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.07);
}
.summary-banner-title { color: rgba(193, 214, 255, 0.7); font-size: 8px; font-weight: 700; }
.summary-banner-main { color: #f7fbff; font-size: 11px; font-weight: 800; line-height: 1.15; }
.summary-banner-sub { color: rgba(220, 234, 255, 0.78); font-size: 8px; line-height: 1.15; }

.impact-glance-board {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 5px;
    min-height: 0;
}

.impact-glance-card {
    min-width: 0;
    border-radius: 10px;
    padding: 6px 7px;
    display: grid;
    gap: 3px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
}

.impact-glance-card.strong-up { border-color: rgba(79, 210, 149, 0.5); background: rgba(39, 116, 78, 0.18); }
.impact-glance-card.up { border-color: rgba(96, 182, 133, 0.42); background: rgba(30, 85, 58, 0.16); }
.impact-glance-card.down { border-color: rgba(255, 154, 154, 0.34); background: rgba(98, 41, 41, 0.16); }
.impact-glance-card.strong-down { border-color: rgba(255, 123, 123, 0.52); background: rgba(122, 36, 36, 0.18); }

.impact-glance-top {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 4px;
}

.impact-glance-title { color: #f4f8ff; font-size: 10px; font-weight: 800; line-height: 1.05; }
.impact-glance-subtitle { color: rgba(211, 226, 255, 0.66); font-size: 7px; line-height: 1.05; }
.impact-glance-headline { color: #f7fbff; font-size: 9px; font-weight: 800; line-height: 1.1; }
.impact-glance-detail { color: rgba(220, 234, 255, 0.76); font-size: 7px; line-height: 1.1; }
.one-line-detail {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.small-badge {
    min-width: 26px;
    height: 16px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: 800;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(3, 10, 24, 0.48);
}

.confirm-button {
    min-height: 30px;
    background: linear-gradient(180deg, rgba(110, 161, 255, 0.9), rgba(77, 126, 233, 0.92));
    border-color: rgba(147, 186, 255, 0.55);
    font-size: 10px;
}

.summary-badges {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 5px;
}
.summary-badge {
    border-radius: 9px;
    padding: 5px 6px;
    background: rgba(255, 255, 255, 0.045);
    border: 1px solid rgba(255, 255, 255, 0.06);
    display: grid;
    gap: 1px;
}
.summary-badge-label { color: rgba(193, 214, 255, 0.7); font-size: 8px; font-weight: 700; line-height: 1; }
.summary-badge-value { color: #f4f8ff; font-size: 9px; font-weight: 800; line-height: 1.15; }
.company-summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }

@media (max-width: 1500px) {
    .panel-grid { gap: 5px; }
    .card { padding: 5px; }
    .stock-choice { min-height: 38px; }
    .segment-button { min-height: 28px; font-size: 9px; }
    .impact-glance-card { padding: 5px 6px; }
    .impact-glance-title { font-size: 9px; }
    .impact-glance-headline { font-size: 8px; }
    .impact-glance-detail { font-size: 6.5px; }
}
</style>
