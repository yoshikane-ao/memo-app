import type { PlayerId, PlayerState, StockKey, StockState, TradePositionEntry } from '../types';

export interface PlayerSnapshot {
  totalAssets: number;
  unrealizedPnL: number;
  longValue: number;
  shortCollateralValue: number;
  speculationCommittedCash: number;
  longPnL: number;
  shortPnL: number;
  speculationPnL: number;
  managementEvaluation: number;
}

type PositionPnLInput = Pick<TradePositionEntry, 'side' | 'entryPrice' | 'orderAmount'>;

export function getPriceMap(stocks: StockState[]): Record<StockKey, number> {
  return stocks.reduce(
    (acc, stock) => {
      acc[stock.key] = stock.currentPrice;
      return acc;
    },
    { p1: 0, p2: 0, market: 0 } as Record<StockKey, number>,
  );
}

function getOwnStockKey(playerId: PlayerId): StockKey {
  return playerId === 'player1' ? 'p1' : 'p2';
}

export function calculateManagementEvaluation(player: PlayerState, stocks: StockState[]): number {
  const ownStockKey = getOwnStockKey(player.id);
  const currentOwnStockPrice = stocks.find((stock) => stock.key === ownStockKey)?.currentPrice ?? 0;
  return (currentOwnStockPrice - player.startingOwnStockPrice) * player.managementStakeShares;
}

export function calculatePlayerVictoryValue(player: PlayerState, stocks: StockState[]): number {
  const ownStockKey = getOwnStockKey(player.id);
  const currentOwnStockPrice = stocks.find((stock) => stock.key === ownStockKey)?.currentPrice ?? 0;
  return player.cash + currentOwnStockPrice;
}

export function calculatePlayerSnapshot(player: PlayerState, stocks: StockState[]): PlayerSnapshot {
  const priceMap = getPriceMap(stocks);

  let longValue = 0;
  let shortCollateralValue = 0;
  let speculationCommittedCash = 0;
  let longPnL = 0;
  let shortPnL = 0;
  let speculationPnL = 0;

  for (const [key, position] of Object.entries(player.holdings) as [
    StockKey,
    PlayerState['holdings'][StockKey],
  ][]) {
    const currentPrice = priceMap[key];
    longValue += currentPrice * position.quantity;
    longPnL += (currentPrice - position.avgPrice) * position.quantity;
  }

  for (const [key, position] of Object.entries(player.shorts) as [
    StockKey,
    PlayerState['shorts'][StockKey],
  ][]) {
    const currentPrice = priceMap[key];
    shortCollateralValue += position.avgPrice * position.quantity;
    shortPnL += (position.avgPrice - currentPrice) * position.quantity;
  }

  for (const position of player.speculation) {
    const currentPrice = priceMap[position.stockKey];
    speculationCommittedCash += position.committedCash;
    speculationPnL +=
      position.side === 'buy'
        ? (currentPrice - position.entryPrice) * position.quantity
        : (position.entryPrice - currentPrice) * position.quantity;
  }

  const managementEvaluation = calculateManagementEvaluation(player, stocks);
  const unrealizedPnL = longPnL + shortPnL + speculationPnL;
  const totalAssets =
    player.cash +
    longValue +
    shortCollateralValue +
    speculationCommittedCash +
    shortPnL +
    speculationPnL +
    managementEvaluation;

  return {
    totalAssets,
    unrealizedPnL,
    longValue,
    shortCollateralValue,
    speculationCommittedCash,
    longPnL,
    shortPnL,
    speculationPnL,
    managementEvaluation,
  };
}

export function calculateTradePositionPnL(
  position: PositionPnLInput,
  currentPrice: number,
): number {
  if (!Number.isFinite(currentPrice)) {
    return 0;
  }

  const rawPnL =
    position.side === 'buy'
      ? currentPrice - position.entryPrice
      : position.entryPrice - currentPrice;

  return Math.round(rawPnL);
}

export function calculateTradePositionSettlementCash(
  position: PositionPnLInput,
  currentPrice: number,
): number {
  return Math.round(position.orderAmount + calculateTradePositionPnL(position, currentPrice));
}

export function calculateTradePositionCloseImpactAmount(
  position: PositionPnLInput,
  currentPrice: number,
): number {
  return Math.abs(calculateTradePositionPnL(position, currentPrice));
}

export function formatCurrency(value: number): string {
  return `${Math.round(value).toLocaleString('ja-JP')}円`;
}

export function formatSignedNumber(value: number): string {
  const rounded = Math.round(value);
  if (rounded > 0) return `+${rounded.toLocaleString('ja-JP')}`;
  if (rounded < 0) return `-${Math.abs(rounded).toLocaleString('ja-JP')}`;
  return '±0';
}

export function formatSignedCurrency(value: number): string {
  const rounded = Math.round(value);
  if (rounded > 0) return `+${rounded.toLocaleString('ja-JP')}円`;
  if (rounded < 0) return `-${Math.abs(rounded).toLocaleString('ja-JP')}円`;
  return '±0円';
}

export function describeDelta(value: number): {
  arrow: string;
  label: string;
  className: 'is-up' | 'is-down' | 'is-flat';
} {
  if (value > 0) {
    return {
      arrow: '↗',
      label: '上昇',
      className: 'is-up',
    };
  }

  if (value < 0) {
    return {
      arrow: '↘',
      label: '下落',
      className: 'is-down',
    };
  }

  return {
    arrow: '→',
    label: '横ばい',
    className: 'is-flat',
  };
}
