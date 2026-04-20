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
} from '../types';
import {
  BUYBACK_ACTION,
  COMPANY_ACTIONS,
  MODE_LABELS,
  NO_COMPANY_ACTION,
  STOCK_LABELS,
  TRADE_LABELS,
} from '../types';
import {
  MIN_TRADE_ORDER_AMOUNT,
  calculateTradePriceImpact,
  resolvePriceAfterDelta,
  resolveTradeImpactPattern,
} from './tradeImpact';

export type BattleActionKind = 'trade' | 'company' | 'wait';

export type StockImpactLevel = 'strong-up' | 'up' | 'neutral' | 'down' | 'strong-down';

export type StockImpactItem = {
  key: StockKey;
  title: string;
  subtitle: string;
  level: StockImpactLevel;
  headline: string;
  detail: string;
};

export type PreviewSummaryItem = {
  label: string;
  value: string;
};

export type BattleActionDraft = {
  actionKind: BattleActionKind;
  stockKey: StockKey;
  tradeAction: TradeAction;
  tradeMode: TradeMode;
  quantity: number;
  companyAction: CompanyAction;
};

export type BattleActionPreview = {
  actionKind: BattleActionKind;
  bannerTitle: string;
  overviewTitle: string;
  overviewSub: string;
  stockImpactPreview: StockImpactItem[];
  companySummaryItems: PreviewSummaryItem[];
  actionChips: string[];
  decisionLabel: string;
};

export type BattleStockChoice = {
  key: StockKey;
  title: string;
  subtitle: string;
};

export type BattleActionProjection = {
  draft: BattleActionDraft;
  stockChoices: BattleStockChoice[];
  companyActions: CooldownAction[];
  visibleTradeActions: TradeAction[];
  selectedPrice: number;
  projectedExecutionPrice: number;
  selectedHoldingQuantity: number;
  selectedShortQuantity: number;
  availableCash: number;
  orderAmount: number;
  estimatedShares: number;
  executedAmount: number;
  requiredCashAmount: number;
  isCashInsufficient: boolean;
  executionEstimateText: string;
  canSubmitTrade: boolean;
  canSubmitCompany: boolean;
  canSubmitWait: boolean;
  canSubmit: boolean;
  preview: BattleActionPreview;
};

export type BattleConfirmedAction = TurnActionPayload & {
  metaAction?: 'wait';
};

const NONE_COMPANY_ACTION = NO_COMPANY_ACTION;
const HIDDEN_COMPANY_ACTION = BUYBACK_ACTION;

function formatCurrency(value: number): string {
  return `${Math.round(value).toLocaleString('ja-JP')}円`;
}

function formatUnits(value: number): string {
  const normalized = Math.round(value * 10000) / 10000;
  return normalized.toLocaleString('ja-JP', {
    minimumFractionDigits: normalized % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function ownStockKey(playerId: PlayerId): StockKey {
  return playerId === 'player1' ? 'p1' : 'p2';
}

function rivalStockKey(playerId: PlayerId): StockKey {
  return playerId === 'player1' ? 'p2' : 'p1';
}

function normalizeQuantity(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function stockChoicesForPlayer(playerId: PlayerId): BattleStockChoice[] {
  const ownKey = ownStockKey(playerId);
  const rivalKey = rivalStockKey(playerId);

  return [
    {
      key: ownKey,
      title: '自分レート',
      subtitle: STOCK_LABELS[ownKey],
    },
    {
      key: rivalKey,
      title: '相手レート',
      subtitle: STOCK_LABELS[rivalKey],
    },
    {
      key: 'market',
      title: 'マーケット',
      subtitle: STOCK_LABELS.market,
    },
  ];
}

function companyActionsForBattle(): CooldownAction[] {
  return COMPANY_ACTIONS.filter(
    (action) => action !== NONE_COMPANY_ACTION && action !== HIDDEN_COMPANY_ACTION,
  ) as CooldownAction[];
}

function visibleTradeActionsForMode(tradeMode: TradeMode): TradeAction[] {
  return tradeMode === 'speculation' ? ['buy', 'sell'] : ['buy', 'sell'];
}

export function resolveEffectiveTradeAction(
  _player: PlayerState,
  _stockKey: StockKey,
  tradeAction: TradeAction,
): TradeAction {
  return tradeAction;
}

export function resolveNextBattlePlayer(currentPlayerId: PlayerId, currentTurn: number): PlayerId {
  const leadPlayer = resolveTurnLeadPlayer(currentTurn);

  if (currentPlayerId === leadPlayer) {
    return leadPlayer === 'player1' ? 'player2' : 'player1';
  }

  return resolveTurnLeadPlayer(currentTurn + 1);
}

export function resolveTurnLeadPlayer(turn: number): PlayerId {
  return turn % 2 === 1 ? 'player1' : 'player2';
}

export function isBattleTurnComplete(currentPlayerId: PlayerId, currentTurn: number): boolean {
  return currentPlayerId !== resolveTurnLeadPlayer(currentTurn);
}

function resolveOrderQuantity(executionPrice: number, orderAmount: number): number {
  if (executionPrice <= 0 || orderAmount < MIN_TRADE_ORDER_AMOUNT) {
    return 0;
  }

  return orderAmount / executionPrice;
}

function isPositiveAction(action: TradeAction): boolean {
  return action === 'buy';
}

function resolveProjectedExecutionPrice(
  stock: StockState | undefined,
  tradeAction: TradeAction,
  orderAmount: number,
): { executionPrice: number; priceImpactAmount: number } {
  if (!stock) {
    return {
      executionPrice: 0,
      priceImpactAmount: 0,
    };
  }

  const priceImpactAmount = calculateTradePriceImpact(
    orderAmount,
    stock.currentPrice,
    stock.basePrice,
  );
  if (priceImpactAmount <= 0) {
    return {
      executionPrice: stock.currentPrice,
      priceImpactAmount,
    };
  }

  const direction = isPositiveAction(tradeAction) ? 1 : -1;
  const resolved = resolvePriceAfterDelta(
    stock.currentPrice,
    stock.basePrice,
    stock.bubbleUpper,
    stock.bubbleLower,
    direction * priceImpactAmount,
  );

  return {
    executionPrice: resolved.nextPrice,
    priceImpactAmount,
  };
}

function normalizeDraftForPlayer(
  draft: BattleActionDraft,
  playerId: PlayerId,
  companyActions: CompanyAction[],
): BattleActionDraft {
  const nextDraft: BattleActionDraft = {
    ...draft,
    quantity: normalizeQuantity(draft.quantity),
  };

  if (nextDraft.actionKind === 'wait') {
    nextDraft.quantity = 0;
    nextDraft.companyAction = NONE_COMPANY_ACTION;
    return nextDraft;
  }

  if (nextDraft.actionKind === 'company') {
    nextDraft.stockKey = ownStockKey(playerId);
    if (
      nextDraft.companyAction === NONE_COMPANY_ACTION ||
      nextDraft.companyAction === HIDDEN_COMPANY_ACTION
    ) {
      nextDraft.companyAction = companyActions[0] ?? NONE_COMPANY_ACTION;
    }
    return nextDraft;
  }

  nextDraft.companyAction = NONE_COMPANY_ACTION;

  return nextDraft;
}

function createNeutralImpact(choice: BattleStockChoice): StockImpactItem {
  return {
    key: choice.key,
    title: choice.title,
    subtitle: choice.subtitle,
    level: 'neutral',
    headline: '変動なし',
    detail: 'この操作では価格は動きません。',
  };
}

function setImpact(
  items: StockImpactItem[],
  key: StockKey,
  level: StockImpactLevel,
  headline: string,
  detail: string,
): void {
  const index = items.findIndex((item) => item.key === key);
  if (index < 0) {
    return;
  }

  items[index] = {
    ...items[index],
    level,
    headline,
    detail,
  };
}

function impactLevel(direction: number, priceImpactAmount: number): StockImpactLevel {
  if (direction === 0 || priceImpactAmount <= 0) {
    return 'neutral';
  }

  if (direction > 0) {
    return priceImpactAmount >= 1000 ? 'strong-up' : 'up';
  }

  return priceImpactAmount >= 1000 ? 'strong-down' : 'down';
}

function impactSizeText(priceImpactAmount: number): string {
  if (priceImpactAmount >= 1000) return '大きく';
  if (priceImpactAmount >= 300) return '中くらいに';
  return '小さく';
}

function buildTradeImpactSummary(
  targetLabel: string,
  tradeAction: TradeAction,
  priceImpactAmount: number,
  isOrderAmountValid: boolean,
): string {
  if (!isOrderAmountValid) {
    return `最低注文額は${MIN_TRADE_ORDER_AMOUNT.toLocaleString('ja-JP')}円です`;
  }

  if (priceImpactAmount <= 0) {
    return `${targetLabel} 変動なし`;
  }

  const sign = isPositiveAction(tradeAction) ? '+' : '-';
  return `${targetLabel} ${sign}${priceImpactAmount.toLocaleString('ja-JP')}円`;
}

function buildTradeImpactPreview(
  playerId: PlayerId,
  draft: BattleActionDraft,
  stockChoices: BattleStockChoice[],
  priceImpactAmount: number,
  effectiveTradeAction: TradeAction,
): StockImpactItem[] {
  const items = stockChoices.map((choice) => createNeutralImpact(choice));

  if (priceImpactAmount <= 0) {
    return items;
  }

  const pattern = resolveTradeImpactPattern(playerId, draft.stockKey, effectiveTradeAction);

  stockChoices.forEach((choice) => {
    const direction = pattern[choice.key];
    const appliedImpact = Math.round(Math.abs(priceImpactAmount * direction));
    if (direction === 0) {
      setImpact(
        items,
        choice.key,
        'neutral',
        '変動なし',
        `${choice.title}は今回の操作では動きません。`,
      );
      return;
    }

    setImpact(
      items,
      choice.key,
      impactLevel(direction, appliedImpact),
      direction > 0
        ? `${impactSizeText(appliedImpact)}上がる見込み`
        : `${impactSizeText(appliedImpact)}下がる見込み`,
      `${choice.title}は ${direction > 0 ? '+' : '-'}${appliedImpact.toLocaleString('ja-JP')}円 動く見込みです。`,
    );
  });

  return items;
}

function buildWaitPreview(stockChoices: BattleStockChoice[]): BattleActionPreview {
  return {
    actionKind: 'wait',
    bannerTitle: '今回の見込み',
    overviewTitle: 'このターンは待機',
    overviewSub: 'ポジションを増やさず、次の動きを見ます。',
    stockImpactPreview: stockChoices.map((choice) => ({
      key: choice.key,
      title: choice.title,
      subtitle: choice.subtitle,
      level: 'neutral',
      headline: '変動なし',
      detail: '待機のため、この操作による追加変動はありません。',
    })),
    companySummaryItems: [],
    actionChips: ['待機'],
    decisionLabel: 'このターンは待機',
  };
}

function buildCompanyPreview(
  currentPlayer: PlayerState,
  companyAction: CompanyAction,
): BattleActionPreview {
  return {
    actionKind: 'company',
    bannerTitle: '今回の見込み',
    overviewTitle: companyAction,
    overviewSub: '追加操作の効果を適用します。',
    stockImpactPreview: [],
    companySummaryItems: [
      { label: '実行者', value: currentPlayer.name },
      { label: '対象', value: '自分レート' },
      { label: '操作', value: companyAction },
    ],
    actionChips: [currentPlayer.name, companyAction],
    decisionLabel: 'この内容で実行',
  };
}

function buildTradePreview(
  playerId: PlayerId,
  draft: BattleActionDraft,
  stockChoices: BattleStockChoice[],
  orderAmount: number,
  executedAmount: number,
  estimatedShares: number,
  effectiveTradeAction: TradeAction,
  selectedPrice: number,
  projectedExecutionPrice: number,
  priceImpactAmount: number,
): BattleActionPreview {
  const selectedChoice =
    stockChoices.find((choice) => choice.key === draft.stockKey) ?? stockChoices[0];
  const isOrderAmountValid = orderAmount >= MIN_TRADE_ORDER_AMOUNT;
  const executionEstimateText =
    estimatedShares <= 0 || executedAmount <= 0
      ? orderAmount > 0 && orderAmount < MIN_TRADE_ORDER_AMOUNT
        ? `最低注文額は${MIN_TRADE_ORDER_AMOUNT.toLocaleString('ja-JP')}円です`
        : '注文額不足'
      : priceImpactAmount > 0
        ? `想定約定 ${formatCurrency(projectedExecutionPrice)} / 約${formatUnits(estimatedShares)}口`
        : `現在価格 ${formatCurrency(selectedPrice)} に届くまで値動きなし`;

  return {
    actionKind: 'trade',
    bannerTitle: '今回の見込み',
    overviewTitle: buildTradeImpactSummary(
      selectedChoice.title,
      effectiveTradeAction,
      priceImpactAmount,
      isOrderAmountValid,
    ),
    overviewSub:
      estimatedShares <= 0
        ? executionEstimateText
        : `投入額 ${formatCurrency(orderAmount)} / ${executionEstimateText}`,
    stockImpactPreview: buildTradeImpactPreview(
      playerId,
      draft,
      stockChoices,
      priceImpactAmount,
      effectiveTradeAction,
    ),
    companySummaryItems: [],
    actionChips: [
      selectedChoice.title,
      MODE_LABELS[draft.tradeMode],
      TRADE_LABELS[draft.tradeAction],
      orderAmount > 0 ? `${orderAmount.toLocaleString('ja-JP')}円` : '0円',
    ],
    decisionLabel: 'この内容で注文',
  };
}

export function createDefaultBattleActionDraft(): BattleActionDraft {
  return {
    actionKind: 'trade',
    stockKey: 'market',
    tradeAction: 'buy',
    tradeMode: 'investment',
    quantity: 0,
    companyAction: NONE_COMPANY_ACTION,
  };
}

export function buildBattleActionProjection(
  currentPlayer: PlayerState,
  stocks: StockState[],
  draft: BattleActionDraft,
): BattleActionProjection {
  const companyActions = companyActionsForBattle();
  const stockChoices = stockChoicesForPlayer(currentPlayer.id);
  const normalizedDraft = normalizeDraftForPlayer(draft, currentPlayer.id, companyActions);
  const selectedStock = stocks.find((stock) => stock.key === normalizedDraft.stockKey);
  const selectedPrice = selectedStock?.currentPrice ?? 0;
  const selectedHoldingQuantity = currentPlayer.holdings[normalizedDraft.stockKey]?.quantity ?? 0;
  const selectedShortQuantity = currentPlayer.shorts[normalizedDraft.stockKey]?.quantity ?? 0;
  const effectiveTradeAction = resolveEffectiveTradeAction(
    currentPlayer,
    normalizedDraft.stockKey,
    normalizedDraft.tradeAction,
  );
  const availableCash = Math.max(0, Math.floor(currentPlayer.cash));
  const orderAmount = normalizeQuantity(normalizedDraft.quantity);
  const executedAmount = orderAmount;
  const { executionPrice: projectedExecutionPrice, priceImpactAmount } =
    resolveProjectedExecutionPrice(selectedStock, effectiveTradeAction, executedAmount);
  const requestedQuantity = resolveOrderQuantity(projectedExecutionPrice, orderAmount);
  const projectedExecutedShares = requestedQuantity;
  const requiresCashAmount = effectiveTradeAction === 'buy' || effectiveTradeAction === 'sell';
  const requiredCashAmount = requiresCashAmount ? orderAmount : 0;
  const isCashInsufficient =
    normalizedDraft.actionKind === 'trade' &&
    requiresCashAmount &&
    requiredCashAmount > availableCash;
  const visibleTradeActions = visibleTradeActionsForMode(normalizedDraft.tradeMode);
  const executionEstimateText =
    normalizedDraft.actionKind !== 'trade'
      ? '未設定'
      : orderAmount > 0 && orderAmount < MIN_TRADE_ORDER_AMOUNT
        ? `最低注文額は${MIN_TRADE_ORDER_AMOUNT.toLocaleString('ja-JP')}円です`
        : isCashInsufficient
          ? `現金不足 (${formatCurrency(requiredCashAmount)} / 所持 ${formatCurrency(availableCash)})`
          : projectedExecutedShares <= 0 || executedAmount <= 0
            ? '注文額不足'
            : priceImpactAmount > 0
              ? `想定約定 ${formatCurrency(projectedExecutionPrice)} / 約${formatUnits(projectedExecutedShares)}口`
              : '値動きなし';

  const canSubmitTrade =
    normalizedDraft.actionKind === 'trade' && projectedExecutedShares > 0 && !isCashInsufficient;

  const canSubmitCompany =
    normalizedDraft.actionKind === 'company' &&
    normalizedDraft.companyAction !== NONE_COMPANY_ACTION;

  const canSubmitWait = normalizedDraft.actionKind === 'wait';
  const canSubmit = canSubmitTrade || canSubmitCompany || canSubmitWait;

  const preview =
    normalizedDraft.actionKind === 'wait'
      ? buildWaitPreview(stockChoices)
      : normalizedDraft.actionKind === 'company'
        ? buildCompanyPreview(currentPlayer, normalizedDraft.companyAction)
        : buildTradePreview(
            currentPlayer.id,
            normalizedDraft,
            stockChoices,
            orderAmount,
            executedAmount,
            projectedExecutedShares,
            effectiveTradeAction,
            selectedPrice,
            projectedExecutionPrice,
            priceImpactAmount,
          );

  return {
    draft: normalizedDraft,
    stockChoices,
    companyActions,
    visibleTradeActions,
    selectedPrice,
    projectedExecutionPrice,
    selectedHoldingQuantity,
    selectedShortQuantity,
    availableCash,
    orderAmount,
    estimatedShares: projectedExecutedShares,
    executedAmount,
    requiredCashAmount,
    isCashInsufficient,
    executionEstimateText,
    canSubmitTrade,
    canSubmitCompany,
    canSubmitWait,
    canSubmit,
    preview,
  };
}

export function buildBattleConfirmedAction(
  currentPlayer: PlayerState,
  projection: BattleActionProjection,
): BattleConfirmedAction | null {
  if (!projection.canSubmit) {
    return null;
  }

  if (projection.draft.actionKind === 'wait') {
    return {
      stockKey: ownStockKey(currentPlayer.id),
      tradeAction: projection.draft.tradeAction,
      tradeMode: projection.draft.tradeMode,
      quantity: 0,
      companyAction: NONE_COMPANY_ACTION,
      metaAction: 'wait',
    };
  }

  return {
    stockKey:
      projection.draft.actionKind === 'company'
        ? ownStockKey(currentPlayer.id)
        : projection.draft.stockKey,
    tradeAction: resolveEffectiveTradeAction(
      currentPlayer,
      projection.draft.stockKey,
      projection.draft.tradeAction,
    ),
    tradeMode: projection.draft.tradeMode,
    quantity: projection.orderAmount,
    companyAction:
      projection.draft.actionKind === 'company'
        ? projection.draft.companyAction
        : NONE_COMPANY_ACTION,
  };
}
