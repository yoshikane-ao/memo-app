import type {
  CpuStats,
  ForwardOrder,
  PlayerId,
  PlayerState,
  StockKey,
  StockState,
  TradeAction,
  TradePositionEntry,
  TurnActionPayload,
} from '../types';
import { AD_CAMPAIGN_ACTION, CAPITAL_INCREASE_ACTION, FACILITY_INVESTMENT_ACTION } from '../types';
import { estimateCpuReactionRange, type CpuReactionRange } from './cpuBehavior';
import {
  calculateTradePositionCloseImpactAmount,
  calculateTradePositionPnL,
  calculateTradePositionSettlementCash,
  formatCurrency,
  formatSignedCurrency,
} from './gameCalculations';
import type { BattleActionDraft, BattleActionProjection } from './tradeBattle';
import { calculateTradeImpactAmounts, resolvePriceAfterDelta } from './tradeImpact';
import { resolveOwnStockKey } from './tradeBattleState';

export type BattleClosePreview = {
  positionId: string;
  stockKey: StockKey;
  stockName: string;
  side: TradePositionEntry['side'];
  executionPrice: number;
  realizedPnl: number;
  returnedCash: number;
  priceMap: Record<StockKey, number>;
};

export type PendingCloseSummary = {
  stockName: string;
  side: TradePositionEntry['side'];
  executionPriceText: string;
  projectedPnlText: string;
  returnedCashText: string;
};

export type BattleResultSummary = {
  title: string;
  tone: 'player1' | 'player2' | 'draw';
};

export type ChartOrderMarker = {
  id: string;
  stockKey: StockKey;
  playerId: PlayerId;
  positionId?: string;
  pnl?: number;
  side: 'buy' | 'sell';
  isPendingClose?: boolean;
  executionPrice: number;
  historyIndex: number;
  turn: number;
  orderAmount?: number;
};

function getStock(stocks: StockState[], stockKey: StockKey): StockState {
  const stock = stocks.find((item) => item.key === stockKey);
  if (!stock) {
    throw new Error(`Stock not found: ${stockKey}`);
  }

  return stock;
}

export function createCurrentPriceMap(stocks: StockState[]): Record<StockKey, number> {
  return stocks.reduce<Record<StockKey, number>>(
    (acc, stock) => {
      acc[stock.key] = stock.currentPrice;
      return acc;
    },
    { p1: 0, p2: 0, market: 0 },
  );
}

export function cloneStockSnapshots(stocks: StockState[]): StockState[] {
  return stocks.map((stock) => ({
    ...stock,
    history: [...stock.history],
  }));
}

export function hasProjectedChartMovement(
  projectedPrices: Partial<Record<StockKey, number>> | null,
  stocks: StockState[],
): projectedPrices is Partial<Record<StockKey, number>> {
  if (!projectedPrices) {
    return false;
  }

  const currentPrices = createCurrentPriceMap(stocks);

  return (['market', 'p1', 'p2'] as StockKey[]).some((key) => {
    const projectedPrice = projectedPrices[key];
    if (projectedPrice == null) {
      return false;
    }

    return Math.round(projectedPrice) !== Math.round(currentPrices[key]);
  });
}

function moveProjectedPrice(
  priceMap: Record<StockKey, number>,
  stock: StockState,
  rawDelta: number,
): void {
  priceMap[stock.key] = resolvePriceAfterDelta(
    priceMap[stock.key],
    stock.basePrice,
    stock.bubbleUpper,
    stock.bubbleLower,
    rawDelta,
  ).nextPrice;
}

function applyProjectedTradeEffectToPriceMap(
  priceMap: Record<StockKey, number>,
  stocks: StockState[],
  playerId: PlayerId,
  stockKey: StockKey,
  tradeAction: TurnActionPayload['tradeAction'],
  orderAmount: number,
): void {
  const stock = getStock(stocks, stockKey);
  const impactAmounts = calculateTradeImpactAmounts(
    playerId,
    stockKey,
    tradeAction,
    orderAmount,
    priceMap[stockKey],
    stock.basePrice,
  );

  if (impactAmounts.p1 !== 0) {
    moveProjectedPrice(priceMap, getStock(stocks, 'p1'), impactAmounts.p1);
  }
  if (impactAmounts.p2 !== 0) {
    moveProjectedPrice(priceMap, getStock(stocks, 'p2'), impactAmounts.p2);
  }
  if (impactAmounts.market !== 0) {
    moveProjectedPrice(priceMap, getStock(stocks, 'market'), impactAmounts.market);
  }
}

export function buildPendingClosePreview(options: {
  isGameOver: boolean;
  pendingClosePositionId: string | null;
  player: PlayerState;
  stocks: StockState[];
}): BattleClosePreview | null {
  const { isGameOver, pendingClosePositionId, player, stocks } = options;

  if (isGameOver || pendingClosePositionId == null) {
    return null;
  }

  const position = player.positions.find((item) => item.id === pendingClosePositionId);
  if (!position) {
    return null;
  }

  const priceMap = createCurrentPriceMap(stocks);
  const executionPrice = priceMap[position.stockKey];
  const realizedPnl = calculateTradePositionPnL(position, executionPrice);
  const closeAction = position.side === 'buy' ? 'sell' : 'buy';
  const closeImpactAmount = calculateTradePositionCloseImpactAmount(position, executionPrice);

  applyProjectedTradeEffectToPriceMap(
    priceMap,
    stocks,
    player.id,
    position.stockKey,
    closeAction,
    closeImpactAmount,
  );

  return {
    positionId: position.id,
    stockKey: position.stockKey,
    stockName: getStock(stocks, position.stockKey).name,
    side: position.side,
    executionPrice,
    realizedPnl,
    returnedCash: calculateTradePositionSettlementCash(position, executionPrice),
    priceMap,
  };
}

export function buildProjectedBoardPrices(options: {
  isGameOver: boolean;
  pendingClosePreview: BattleClosePreview | null;
  currentPlayer: PlayerState;
  actionDraft: BattleActionDraft;
  actionProjection: BattleActionProjection;
  stocks: StockState[];
}): Partial<Record<StockKey, number>> | null {
  const { isGameOver, pendingClosePreview, currentPlayer, actionDraft, actionProjection, stocks } =
    options;

  if (isGameOver) {
    return null;
  }

  if (pendingClosePreview) {
    return pendingClosePreview.priceMap;
  }

  const priceMap = createCurrentPriceMap(stocks);

  if (actionDraft.actionKind === 'wait') {
    return priceMap;
  }

  if (actionDraft.actionKind === 'company') {
    const targetKey = resolveOwnStockKey(currentPlayer.id);
    const targetStock = getStock(stocks, targetKey);

    if (
      actionDraft.companyAction === CAPITAL_INCREASE_ACTION &&
      (currentPlayer.companyActionCharges[CAPITAL_INCREASE_ACTION] ?? 0) > 0
    ) {
      moveProjectedPrice(priceMap, targetStock, -18);
    } else if (
      actionDraft.companyAction === AD_CAMPAIGN_ACTION &&
      (currentPlayer.companyActionCharges[AD_CAMPAIGN_ACTION] ?? 0) > 0 &&
      currentPlayer.companyFunds >= 900
    ) {
      moveProjectedPrice(priceMap, targetStock, 9);
    } else if (
      actionDraft.companyAction === FACILITY_INVESTMENT_ACTION &&
      (currentPlayer.companyActionCharges[FACILITY_INVESTMENT_ACTION] ?? 0) > 0 &&
      currentPlayer.companyFunds >= 1050
    ) {
      moveProjectedPrice(priceMap, targetStock, 6);
    }

    return priceMap;
  }

  if (!actionProjection.canSubmitTrade) {
    return null;
  }

  applyProjectedTradeEffectToPriceMap(
    priceMap,
    stocks,
    currentPlayer.id,
    actionProjection.draft.stockKey,
    actionProjection.draft.tradeAction,
    actionProjection.orderAmount,
  );

  return priceMap;
}

export function buildBattleResult(options: {
  isGameOver: boolean;
  leftPlayer: PlayerState;
  rightPlayer: PlayerState;
  leftVictoryValue: number;
  rightVictoryValue: number;
}): BattleResultSummary | null {
  const { isGameOver, leftPlayer, rightPlayer, leftVictoryValue, rightVictoryValue } = options;

  if (!isGameOver) {
    return null;
  }

  if (leftVictoryValue > rightVictoryValue) {
    return {
      title: `${leftPlayer.name} \u306e\u52dd\u5229`,
      tone: 'player1',
    };
  }

  if (rightVictoryValue > leftVictoryValue) {
    return {
      title: `${rightPlayer.name} \u306e\u52dd\u5229`,
      tone: 'player2',
    };
  }

  return {
    title: '\u5f15\u304d\u5206\u3051',
    tone: 'draw',
  };
}

export function buildPendingCloseSummary(
  pendingClosePreview: BattleClosePreview | null,
): PendingCloseSummary | null {
  if (!pendingClosePreview) {
    return null;
  }

  return {
    stockName: pendingClosePreview.stockName,
    side: pendingClosePreview.side,
    executionPriceText: formatCurrency(pendingClosePreview.executionPrice),
    projectedPnlText: formatSignedCurrency(pendingClosePreview.realizedPnl),
    returnedCashText: formatCurrency(pendingClosePreview.returnedCash),
  };
}

export function buildActivePositionMarkers(options: {
  players: PlayerState[];
  stocks: StockState[];
  stockHistoryPointIds: Record<StockKey, number[]>;
  pendingClosePreview: BattleClosePreview | null;
  pendingClosePositionId: string | null;
}): ChartOrderMarker[] {
  const { players, stocks, stockHistoryPointIds, pendingClosePreview, pendingClosePositionId } =
    options;

  const currentPriceMap = createCurrentPriceMap(stocks);

  return players.flatMap((player) =>
    player.positions.flatMap((position) => {
      if (position.entryHistoryPointId == null) {
        return [];
      }

      const historyIndex = stockHistoryPointIds[position.stockKey].findIndex(
        (pointId) => pointId === position.entryHistoryPointId,
      );
      if (historyIndex < 0) {
        return [];
      }

      const executionPrice =
        pendingClosePreview?.positionId === position.id
          ? pendingClosePreview.executionPrice
          : currentPriceMap[position.stockKey];

      return [
        {
          id: `position-marker-${position.id}`,
          stockKey: position.stockKey,
          playerId: player.id,
          positionId: position.id,
          pnl: calculateTradePositionPnL(position, executionPrice),
          side: position.side,
          isPendingClose: pendingClosePositionId === position.id,
          executionPrice: position.entryPrice,
          historyIndex,
          turn: position.openedTurn,
          orderAmount: position.orderAmount,
        },
      ];
    }),
  );
}

export function buildCpuStats(stocks: StockState[]): CpuStats {
  let participantCount = 0;
  let withdrawalCount = 0;
  let investmentTotal = 0;
  let weakParticipantCount = 0;
  let strongParticipantCount = 0;
  let p1ParticipantCount = 0;
  let p2ParticipantCount = 0;
  let p1InvestmentTotal = 0;
  let p2InvestmentTotal = 0;

  for (const stock of stocks) {
    for (const cpu of stock.cpuPool) {
      if (!cpu.active) {
        withdrawalCount += 1;
        continue;
      }
      participantCount += 1;
      investmentTotal += cpu.capital;
      if (cpu.sentiment === 'bullish') strongParticipantCount += 1;
      else if (cpu.sentiment === 'bearish') weakParticipantCount += 1;

      if (stock.key === 'p1') {
        p1ParticipantCount += 1;
        p1InvestmentTotal += cpu.capital;
      } else if (stock.key === 'p2') {
        p2ParticipantCount += 1;
        p2InvestmentTotal += cpu.capital;
      }
    }
  }

  return {
    participantCount,
    withdrawalCount,
    investmentTotal,
    weakParticipantCount,
    strongParticipantCount,
    p1ParticipantCount,
    p2ParticipantCount,
    p1InvestmentTotal,
    p2InvestmentTotal,
  };
}

export type CpuReactionProjection = {
  stockKey: StockKey;
  action: TradeAction;
  range: CpuReactionRange;
};

export function buildCpuReactionProjection(params: {
  stocks: StockState[];
  actionDraft: BattleActionDraft;
  orderAmount: number;
}): CpuReactionProjection | null {
  const { stocks, actionDraft, orderAmount } = params;
  if (actionDraft.actionKind !== 'trade' || orderAmount <= 0) return null;
  const stock = stocks.find((item) => item.key === actionDraft.stockKey);
  if (!stock) return null;
  return {
    stockKey: actionDraft.stockKey,
    action: actionDraft.tradeAction,
    range: estimateCpuReactionRange({
      actingStock: stock,
      action: actionDraft.tradeAction,
      executedAmount: orderAmount,
    }),
  };
}

export type ForwardOrderRow = {
  id: string;
  playerId: PlayerId;
  stockKey: StockKey;
  triggerTurn: number;
  remainingTurns: number;
  tradeAction: TradeAction;
  orderAmount: number;
  reservationFee: number;
  status: ForwardOrder['status'];
};

export function buildForwardOrderRows(params: {
  state: { forwardOrders: ForwardOrder[]; turn: number };
}): ForwardOrderRow[] {
  const { forwardOrders, turn } = params.state;
  return forwardOrders
    .filter((order) => order.status === 'pending')
    .map((order) => ({
      id: order.id,
      playerId: order.playerId,
      stockKey: order.stockKey,
      triggerTurn: order.triggerTurn,
      remainingTurns: Math.max(0, order.triggerTurn - turn),
      tradeAction: order.tradeAction,
      orderAmount: order.orderAmount,
      reservationFee: order.reservationFee,
      status: order.status,
    }));
}
