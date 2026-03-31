import type {
  CompanyAction,
  CooldownAction,
  PlayerId,
  PlayerState,
  StockKey,
  StockState,
  TradeAction,
  TradeMode,
  TurnActionPayload,
} from '../api/types/game'
import {
  BUYBACK_ACTION,
  COMPANY_ACTIONS,
  MODE_LABELS,
  NO_COMPANY_ACTION,
  STOCK_LABELS,
  TRADE_ACTIONS,
  TRADE_LABELS,
} from '../api/types/game'

export type BattleActionKind = 'trade' | 'company' | 'wait'

export type StockImpactLevel = 'strong-up' | 'up' | 'neutral' | 'down' | 'strong-down'

export type StockImpactItem = {
  key: StockKey
  title: string
  subtitle: string
  level: StockImpactLevel
  headline: string
  detail: string
}

export type PreviewSummaryItem = {
  label: string
  value: string
}

export type BattleActionDraft = {
  actionKind: BattleActionKind
  stockKey: StockKey
  tradeAction: TradeAction
  tradeMode: TradeMode
  quantity: number
  companyAction: CompanyAction
}

export type BattleActionPreview = {
  actionKind: BattleActionKind
  bannerTitle: string
  overviewTitle: string
  overviewSub: string
  stockImpactPreview: StockImpactItem[]
  companySummaryItems: PreviewSummaryItem[]
  actionChips: string[]
  decisionLabel: string
}

export type BattleStockChoice = {
  key: StockKey
  title: string
  subtitle: string
}

export type BattleActionProjection = {
  draft: BattleActionDraft
  stockChoices: BattleStockChoice[]
  companyActions: CooldownAction[]
  visibleTradeActions: TradeAction[]
  selectedPrice: number
  selectedHoldingQuantity: number
  selectedShortQuantity: number
  availableCash: number
  orderAmount: number
  estimatedShares: number
  executedAmount: number
  requiredCashAmount: number
  isCashInsufficient: boolean
  executionEstimateText: string
  canSubmitTrade: boolean
  canSubmitCompany: boolean
  canSubmitWait: boolean
  canSubmit: boolean
  preview: BattleActionPreview
}

export type BattleConfirmedAction = TurnActionPayload & {
  metaAction?: 'wait'
}

const NONE_COMPANY_ACTION = NO_COMPANY_ACTION
const HIDDEN_COMPANY_ACTION = BUYBACK_ACTION

function formatCurrency(value: number): string {
  return `${Math.round(value).toLocaleString()}円`
}

function ownStockKey(playerId: PlayerId): StockKey {
  return playerId === 'player1' ? 'p1' : 'p2'
}

function rivalStockKey(playerId: PlayerId): StockKey {
  return playerId === 'player1' ? 'p2' : 'p1'
}

function normalizeQuantity(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.floor(value))
}

function stockChoicesForPlayer(playerId: PlayerId): BattleStockChoice[] {
  const ownKey = ownStockKey(playerId)
  const rivalKey = rivalStockKey(playerId)

  return [
    {
      key: ownKey,
      title: '自社株',
      subtitle: STOCK_LABELS[ownKey],
    },
    {
      key: rivalKey,
      title: '相手株',
      subtitle: STOCK_LABELS[rivalKey],
    },
    {
      key: 'market',
      title: '市場株',
      subtitle: '共通マーケット',
    },
  ]
}

function companyActionsForBattle(): CooldownAction[] {
  return COMPANY_ACTIONS.filter(
    (action) => action !== NONE_COMPANY_ACTION && action !== HIDDEN_COMPANY_ACTION,
  ) as CooldownAction[]
}

function visibleTradeActionsForMode(tradeMode: TradeMode): TradeAction[] {
  return tradeMode === 'speculation' ? ['buy', 'short'] : TRADE_ACTIONS
}

function resolveOrderQuantity(openPrice: number, orderAmount: number): number {
  if (openPrice <= 0 || orderAmount < openPrice) {
    return 0
  }

  return Math.floor(orderAmount / openPrice)
}

function normalizeDraftForPlayer(
  draft: BattleActionDraft,
  playerId: PlayerId,
  companyActions: CompanyAction[],
): BattleActionDraft {
  const nextDraft: BattleActionDraft = {
    ...draft,
    quantity: normalizeQuantity(draft.quantity),
  }

  if (nextDraft.actionKind === 'wait') {
    nextDraft.quantity = 0
    nextDraft.companyAction = NONE_COMPANY_ACTION
    return nextDraft
  }

  if (nextDraft.actionKind === 'company') {
    nextDraft.stockKey = ownStockKey(playerId)
    if (
      nextDraft.companyAction === NONE_COMPANY_ACTION
      || nextDraft.companyAction === HIDDEN_COMPANY_ACTION
    ) {
      nextDraft.companyAction = companyActions[0] ?? NONE_COMPANY_ACTION
    }
    return nextDraft
  }

  nextDraft.companyAction = NONE_COMPANY_ACTION

  if (
    nextDraft.tradeMode === 'speculation'
    && (nextDraft.tradeAction === 'sell' || nextDraft.tradeAction === 'cover')
  ) {
    nextDraft.tradeAction = 'buy'
  }

  return nextDraft
}

function effectScale(estimatedShares: number): 'none' | 'small' | 'medium' | 'large' {
  if (estimatedShares >= 100) return 'large'
  if (estimatedShares >= 40) return 'medium'
  if (estimatedShares >= 1) return 'small'
  return 'none'
}

function createNeutralImpact(choice: BattleStockChoice): StockImpactItem {
  return {
    key: choice.key,
    title: choice.title,
    subtitle: choice.subtitle,
    level: 'neutral',
    headline: 'まだ大きな変化はありません',
    detail: '行動を選ぶと、この銘柄への値動き予測を表示します。',
  }
}

function setImpact(
  items: StockImpactItem[],
  key: StockKey,
  level: StockImpactLevel,
  headline: string,
  detail: string,
): void {
  const index = items.findIndex((item) => item.key === key)
  if (index < 0) {
    return
  }

  items[index] = {
    ...items[index],
    level,
    headline,
    detail,
  }
}

function impactSizeLabel(scale: ReturnType<typeof effectScale>): string {
  if (scale === 'large') return '強め'
  if (scale === 'medium') return '中くらい'
  if (scale === 'small') return '小さめ'
  return 'ほぼ'
}

function buildTradeImpactSummary(
  targetLabel: string,
  tradeAction: TradeAction,
  estimatedShares: number,
): string {
  if (estimatedShares <= 0) {
    return '注文額が小さく、このターンは約定しません'
  }

  const sizeText = impactSizeLabel(effectScale(estimatedShares))

  if (tradeAction === 'buy') {
    return `${targetLabel}に${sizeText}の買い圧力`
  }

  if (tradeAction === 'sell') {
    return `${targetLabel}に${sizeText}の売り圧力`
  }

  if (tradeAction === 'short') {
    return `${targetLabel}に${sizeText}の下押し圧力`
  }

  return `${targetLabel}の買い戻しが${sizeText}`
}

function buildTradeImpactPreview(
  draft: BattleActionDraft,
  stockChoices: BattleStockChoice[],
  estimatedShares: number,
): StockImpactItem[] {
  const items = stockChoices.map((choice) => createNeutralImpact(choice))

  if (estimatedShares <= 0) {
    return items
  }

  const targetKey = draft.stockKey
  const targetIsCompany = targetKey === 'p1' || targetKey === 'p2'
  const ownKey = stockChoices[0]?.key ?? 'p1'
  const rivalKey = stockChoices[1]?.key ?? 'p2'
  const sizeText = impactSizeLabel(effectScale(estimatedShares))

  if (draft.tradeAction === 'buy') {
    setImpact(
      items,
      targetKey,
      targetKey === 'market' ? 'strong-up' : 'up',
      targetKey === 'market' ? '市場全体が上がりやすい' : '買いで上がりやすい',
      `${sizeText}の買い注文で価格が上向きやすくなります。`,
    )

    if (targetIsCompany) {
      setImpact(
        items,
        'market',
        'down',
        '市場へ資金が抜けやすい',
        '会社株に資金が向かうため、市場株はやや重くなります。',
      )
      setImpact(
        items,
        targetKey === ownKey ? rivalKey : ownKey,
        'neutral',
        '直接の影響は小さい',
        'この行動では別の会社株への波及は限定的です。',
      )
    } else {
      setImpact(items, ownKey, 'neutral', '会社株への影響は小さい', '市場株の買いでは個別株への波及は限定的です。')
      setImpact(items, rivalKey, 'neutral', '会社株への影響は小さい', '市場株の買いでは個別株への波及は限定的です。')
    }
  }

  if (draft.tradeAction === 'sell') {
    setImpact(
      items,
      targetKey,
      targetKey === 'market' ? 'strong-down' : 'down',
      targetKey === 'market' ? '市場全体が下がりやすい' : '売りで下がりやすい',
      `${sizeText}の売り注文で価格が下向きやすくなります。`,
    )

    if (targetIsCompany) {
      setImpact(
        items,
        'market',
        'up',
        '市場へ資金が戻りやすい',
        '会社株の売りで資金が市場へ戻り、市場株はやや上がりやすくなります。',
      )
      setImpact(
        items,
        targetKey === ownKey ? rivalKey : ownKey,
        'neutral',
        '直接の影響は小さい',
        'この行動では別の会社株への波及は限定的です。',
      )
    } else {
      setImpact(items, ownKey, 'neutral', '会社株への影響は小さい', '市場株の売りでは個別株への波及は限定的です。')
      setImpact(items, rivalKey, 'neutral', '会社株への影響は小さい', '市場株の売りでは個別株への波及は限定的です。')
    }
  }

  if (draft.tradeAction === 'short') {
    setImpact(
      items,
      targetKey,
      'strong-down',
      '空売りで下がりやすい',
      `${sizeText}の空売りで下押し圧力が強まりやすくなります。`,
    )

    if (targetIsCompany) {
      setImpact(
        items,
        'market',
        'up',
        '市場へ逃避資金が向かいやすい',
        '会社株の弱さが目立つと、市場株へ資金が移りやすくなります。',
      )
      setImpact(
        items,
        targetKey === ownKey ? rivalKey : ownKey,
        'neutral',
        '直接の影響は小さい',
        'この行動では別の会社株への波及は限定的です。',
      )
    } else {
      setImpact(items, ownKey, 'neutral', '会社株への影響は小さい', '市場株への空売りでは個別株への波及は限定的です。')
      setImpact(items, rivalKey, 'neutral', '会社株への影響は小さい', '市場株への空売りでは個別株への波及は限定的です。')
    }
  }

  if (draft.tradeAction === 'cover') {
    setImpact(
      items,
      targetKey,
      'up',
      '買い戻しで反発しやすい',
      `${sizeText}の買い戻しで価格が戻りやすくなります。`,
    )

    if (targetIsCompany) {
      setImpact(
        items,
        'market',
        'down',
        '市場資金はやや細りやすい',
        '会社株の買い戻しが入るため、市場株はやや重くなります。',
      )
      setImpact(
        items,
        targetKey === ownKey ? rivalKey : ownKey,
        'neutral',
        '直接の影響は小さい',
        'この行動では別の会社株への波及は限定的です。',
      )
    } else {
      setImpact(items, ownKey, 'neutral', '会社株への影響は小さい', '市場株の買い戻しでは個別株への波及は限定的です。')
      setImpact(items, rivalKey, 'neutral', '会社株への影響は小さい', '市場株の買い戻しでは個別株への波及は限定的です。')
    }
  }

  return items
}

function buildWaitPreview(stockChoices: BattleStockChoice[]): BattleActionPreview {
  return {
    actionKind: 'wait',
    bannerTitle: '今回の影響まとめ',
    overviewTitle: 'このターンは待機',
    overviewSub: 'ポジションを増やさず、次ターンの値動きを見る選択です。',
    stockImpactPreview: stockChoices.map((choice) => ({
      key: choice.key,
      title: choice.title,
      subtitle: choice.subtitle,
      level: 'neutral',
      headline: '大きな影響は出ません',
      detail: '待機のため、このターンは新しい売買圧力が発生しません。',
    })),
    companySummaryItems: [],
    actionChips: ['待つ'],
    decisionLabel: 'このターンは待つ',
  }
}

function buildCompanyPreview(
  currentPlayer: PlayerState,
  companyAction: CompanyAction,
): BattleActionPreview {
  return {
    actionKind: 'company',
    bannerTitle: '今回の会社行動',
    overviewTitle: companyAction,
    overviewSub: '会社資金と自社株への影響を伴う行動です。',
    stockImpactPreview: [],
    companySummaryItems: [
      { label: '実行者', value: currentPlayer.name },
      { label: '対象株', value: '自社株' },
      { label: '会社行動', value: companyAction },
    ],
    actionChips: [currentPlayer.name, companyAction],
    decisionLabel: 'この内容で実行',
  }
}

function buildTradePreview(
  draft: BattleActionDraft,
  stockChoices: BattleStockChoice[],
  orderAmount: number,
  executedAmount: number,
  estimatedShares: number,
): BattleActionPreview {
  const selectedChoice = stockChoices.find((choice) => choice.key === draft.stockKey) ?? stockChoices[0]
  const executionEstimateText =
    estimatedShares <= 0 || executedAmount <= 0
      ? '注文額不足'
      : `${formatCurrency(executedAmount)} / 約${estimatedShares}株`

  return {
    actionKind: 'trade',
    bannerTitle: '今回の影響まとめ',
    overviewTitle: buildTradeImpactSummary(selectedChoice.title, draft.tradeAction, estimatedShares),
    overviewSub:
      estimatedShares <= 0
        ? '注文額が不足しているため、このターンは約定しません。'
        : `執行見込み ${executionEstimateText}`,
    stockImpactPreview: buildTradeImpactPreview(draft, stockChoices, estimatedShares),
    companySummaryItems: [],
    actionChips: [
      selectedChoice.title,
      MODE_LABELS[draft.tradeMode],
      TRADE_LABELS[draft.tradeAction],
      orderAmount > 0 ? `${orderAmount.toLocaleString()}円` : '注文額 0円',
    ],
    decisionLabel: 'この内容で注文',
  }
}

export function createDefaultBattleActionDraft(): BattleActionDraft {
  return {
    actionKind: 'trade',
    stockKey: 'market',
    tradeAction: 'buy',
    tradeMode: 'investment',
    quantity: 0,
    companyAction: NONE_COMPANY_ACTION,
  }
}

export function buildBattleActionProjection(
  currentPlayer: PlayerState,
  stocks: StockState[],
  draft: BattleActionDraft,
): BattleActionProjection {
  const companyActions = companyActionsForBattle()
  const stockChoices = stockChoicesForPlayer(currentPlayer.id)
  const normalizedDraft = normalizeDraftForPlayer(draft, currentPlayer.id, companyActions)
  const selectedStock = stocks.find((stock) => stock.key === normalizedDraft.stockKey)
  const selectedPrice = selectedStock?.currentPrice ?? 0
  const selectedHoldingQuantity = currentPlayer.holdings[normalizedDraft.stockKey]?.quantity ?? 0
  const selectedShortQuantity = currentPlayer.shorts[normalizedDraft.stockKey]?.quantity ?? 0
  const availableCash = Math.max(0, Math.floor(currentPlayer.cash))
  const orderAmount = normalizeQuantity(normalizedDraft.quantity)
  const estimatedShares = resolveOrderQuantity(selectedPrice, orderAmount)
  const executedAmount = estimatedShares * selectedPrice
  const requiresCashAmount =
    normalizedDraft.tradeAction === 'buy' || normalizedDraft.tradeAction === 'short'
  const requiredCashAmount = requiresCashAmount ? executedAmount : 0
  const isCashInsufficient =
    normalizedDraft.actionKind === 'trade'
    && requiresCashAmount
    && requiredCashAmount > availableCash
  const visibleTradeActions = visibleTradeActionsForMode(normalizedDraft.tradeMode)
  const executionEstimateText =
    normalizedDraft.actionKind !== 'trade'
      ? '未設定'
      : isCashInsufficient
        ? `現金不足 (${formatCurrency(requiredCashAmount)} / 所持 ${formatCurrency(availableCash)})`
      : estimatedShares <= 0 || executedAmount <= 0
        ? '注文額不足'
        : `${formatCurrency(executedAmount)} / 約${estimatedShares}株`

  const canSubmitTrade =
    normalizedDraft.actionKind === 'trade'
    && estimatedShares > 0
    && !isCashInsufficient
    && (
      normalizedDraft.tradeAction === 'sell'
        ? selectedHoldingQuantity > 0
        : normalizedDraft.tradeAction === 'cover'
          ? selectedShortQuantity > 0
          : true
    )

  const canSubmitCompany =
    normalizedDraft.actionKind === 'company'
    && normalizedDraft.companyAction !== NONE_COMPANY_ACTION

  const canSubmitWait = normalizedDraft.actionKind === 'wait'
  const canSubmit = canSubmitTrade || canSubmitCompany || canSubmitWait

  const preview =
    normalizedDraft.actionKind === 'wait'
      ? buildWaitPreview(stockChoices)
      : normalizedDraft.actionKind === 'company'
        ? buildCompanyPreview(currentPlayer, normalizedDraft.companyAction)
        : buildTradePreview(normalizedDraft, stockChoices, orderAmount, executedAmount, estimatedShares)

  return {
    draft: normalizedDraft,
    stockChoices,
    companyActions,
    visibleTradeActions,
    selectedPrice,
    selectedHoldingQuantity,
    selectedShortQuantity,
    availableCash,
    orderAmount,
    estimatedShares,
    executedAmount,
    requiredCashAmount,
    isCashInsufficient,
    executionEstimateText,
    canSubmitTrade,
    canSubmitCompany,
    canSubmitWait,
    canSubmit,
    preview,
  }
}

export function buildBattleConfirmedAction(
  currentPlayer: PlayerState,
  projection: BattleActionProjection,
): BattleConfirmedAction | null {
  if (!projection.canSubmit) {
    return null
  }

  if (projection.draft.actionKind === 'wait') {
    return {
      stockKey: ownStockKey(currentPlayer.id),
      tradeAction: projection.draft.tradeAction,
      tradeMode: projection.draft.tradeMode,
      quantity: 0,
      companyAction: NONE_COMPANY_ACTION,
      metaAction: 'wait',
    }
  }

  return {
    stockKey:
      projection.draft.actionKind === 'company'
        ? ownStockKey(currentPlayer.id)
        : projection.draft.stockKey,
    tradeAction: projection.draft.tradeAction,
    tradeMode: projection.draft.tradeMode,
    quantity: projection.orderAmount,
    companyAction:
      projection.draft.actionKind === 'company'
        ? projection.draft.companyAction
        : NONE_COMPANY_ACTION,
  }
}
