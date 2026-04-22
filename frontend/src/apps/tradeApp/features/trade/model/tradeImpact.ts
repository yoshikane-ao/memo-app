import type { PlayerId, StockKey, TradeAction } from '../types';

export type TradeImpactPattern = Record<StockKey, number>;
export type TradeImpactAmounts = Record<StockKey, number>;
export type PriceLineEvent = 'none' | 'bubble' | 'bottom';
export type DynamicPriceLines = {
  cashRatio: number;
  investedRatio: number;
  assetHeat: number;
  bubbleBand: number;
  bottomBand: number;
  bubbleLine: number;
  bottomReboundLine: number;
};
export const MIN_TRADE_ORDER_AMOUNT = 1000;
export const STOCK_PRICE_TICK = 100;
export const MIN_STOCK_PRICE = STOCK_PRICE_TICK;
export const PRICE_STEP_RATIO = 0.01;
export const SLIPPAGE_REFERENCE_AMOUNT = 10000;

function ownStockKey(playerId: PlayerId): StockKey {
  return playerId === 'player1' ? 'p1' : 'p2';
}

function rivalStockKey(playerId: PlayerId): StockKey {
  return playerId === 'player1' ? 'p2' : 'p1';
}

function resolveBuyPattern(playerId: PlayerId, targetKey: StockKey): TradeImpactPattern {
  const ownKey = ownStockKey(playerId);
  const rivalKey = rivalStockKey(playerId);

  if (targetKey === ownKey) {
    // 自分レート買い:
    // 自分 +100% / 相手 -25% / マーケット -50%
    return playerId === 'player1'
      ? { p1: 1, p2: -0.25, market: -0.5 }
      : { p1: -0.25, p2: 1, market: -0.5 };
  }

  if (targetKey === rivalKey) {
    // 相手レート買い:
    // 自分 -50% / 相手 +100% / マーケット -50%
    return playerId === 'player1'
      ? { p1: -0.5, p2: 1, market: -0.5 }
      : { p1: 1, p2: -0.5, market: -0.5 };
  }

  // マーケット買い:
  // 自分 +50% / 相手 +50% / マーケット +100%
  return { p1: 0.5, p2: 0.5, market: 1 };
}

function reversePattern(pattern: TradeImpactPattern): TradeImpactPattern {
  const reverseDirection = (value: number): number => {
    if (value === 0) {
      return 0;
    }

    return value * -1;
  };

  return {
    p1: reverseDirection(pattern.p1),
    p2: reverseDirection(pattern.p2),
    market: reverseDirection(pattern.market),
  };
}

export function isPositiveTradeAction(action: TradeAction): boolean {
  return action === 'buy';
}

export function resolveTradeImpactPattern(
  playerId: PlayerId,
  targetKey: StockKey,
  tradeAction: TradeAction,
): TradeImpactPattern {
  const basePattern = resolveBuyPattern(playerId, targetKey);
  return isPositiveTradeAction(tradeAction) ? basePattern : reversePattern(basePattern);
}

export function roundToStockPriceTick(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_STOCK_PRICE;
  }

  return Math.max(MIN_STOCK_PRICE, Math.round(value / STOCK_PRICE_TICK) * STOCK_PRICE_TICK);
}

export function floorToStockPriceTick(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_STOCK_PRICE;
  }

  return Math.max(MIN_STOCK_PRICE, Math.floor(value / STOCK_PRICE_TICK) * STOCK_PRICE_TICK);
}

export function ceilToStockPriceTick(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_STOCK_PRICE;
  }

  return Math.max(MIN_STOCK_PRICE, Math.ceil(value / STOCK_PRICE_TICK) * STOCK_PRICE_TICK);
}

export function normalizeStockPriceDelta(rawDelta: number): number {
  if (!Number.isFinite(rawDelta) || rawDelta === 0) {
    return 0;
  }

  const sign = rawDelta > 0 ? 1 : -1;
  const absoluteDelta = Math.abs(rawDelta);
  const normalizedDelta = Math.max(
    STOCK_PRICE_TICK,
    Math.round(absoluteDelta / STOCK_PRICE_TICK) * STOCK_PRICE_TICK,
  );

  return sign * normalizedDelta;
}

export function resolvePriceStep(basePrice: number): number {
  void basePrice;
  return STOCK_PRICE_TICK;
}

function roundToPriceStep(value: number, basePrice: number): number {
  const step = resolvePriceStep(basePrice);
  return Math.max(step, Math.round(value / step) * step);
}

export function calculateTradePriceImpact(
  executedAmount: number,
  _currentPrice: number,
  _basePrice: number,
): number {
  if (!Number.isFinite(executedAmount) || executedAmount <= 0) {
    return 0;
  }

  if (executedAmount <= SLIPPAGE_REFERENCE_AMOUNT) {
    return Math.round(executedAmount);
  }

  // 基準額超過分は √ 逓減で、大口ほどインパクトを抑える（富者優位緩和）
  const excess = executedAmount - SLIPPAGE_REFERENCE_AMOUNT;
  const dampened = Math.sqrt(excess * SLIPPAGE_REFERENCE_AMOUNT);
  return Math.round(SLIPPAGE_REFERENCE_AMOUNT + dampened);
}

export function calculateTradeImpactAmounts(
  playerId: PlayerId,
  targetKey: StockKey,
  tradeAction: TradeAction,
  executedAmount: number,
  currentTargetPrice: number,
  targetBasePrice: number,
): TradeImpactAmounts {
  const normalizedImpact = calculateTradePriceImpact(
    executedAmount,
    currentTargetPrice,
    targetBasePrice,
  );

  if (normalizedImpact <= 0) {
    return {
      p1: 0,
      p2: 0,
      market: 0,
    };
  }

  const pattern = resolveTradeImpactPattern(playerId, targetKey, tradeAction);

  return {
    p1: pattern.p1 * normalizedImpact,
    p2: pattern.p2 * normalizedImpact,
    market: pattern.market * normalizedImpact,
  };
}

export function calculateDynamicPriceLines(
  _basePrice: number,
  _initialTotalAssets: number,
  _currentTotalAssets: number,
  _currentAvailableCash: number,
): DynamicPriceLines {
  return {
    cashRatio: 0,
    investedRatio: 0,
    assetHeat: 0,
    bubbleBand: 0,
    bottomBand: 0,
    bubbleLine: 0,
    bottomReboundLine: 0,
  };
}

export function resolvePriceAfterDelta(
  currentPrice: number,
  basePrice: number,
  _bubbleUpper: number,
  _bubbleLower: number,
  rawDelta: number,
): {
  nextPrice: number;
  historyTrail: number[];
  event: PriceLineEvent;
} {
  const priceStep = resolvePriceStep(basePrice);
  const normalizedDelta =
    !Number.isFinite(rawDelta) || rawDelta === 0
      ? 0
      : Math.sign(rawDelta) *
        Math.max(priceStep, Math.round(Math.abs(rawDelta) / priceStep) * priceStep);
  const rawNextPrice = currentPrice + normalizedDelta;
  const nextPrice = roundToPriceStep(Math.max(priceStep, rawNextPrice), basePrice);
  const historyTrail = [nextPrice];
  const event: PriceLineEvent = 'none';

  return {
    nextPrice,
    historyTrail,
    event,
  };
}
