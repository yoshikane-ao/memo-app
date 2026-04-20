import type {
  GameState,
  LogEntry,
  PlayerId,
  PlayerState,
  SpeculationPosition,
  StockKey,
  TradePositionEntry,
  TurnActionPayload,
} from '../types';
import {
  AD_CAMPAIGN_ACTION,
  BUYBACK_ACTION,
  CAPITAL_INCREASE_ACTION,
  FACILITY_INVESTMENT_ACTION,
  NO_COMPANY_ACTION,
} from '../types';
import {
  calculateTradePositionCloseImpactAmount,
  calculateTradePositionPnL,
  calculateTradePositionSettlementCash,
  formatCurrency,
  formatSignedCurrency,
} from './gameCalculations';
import {
  calculateTradeImpactAmounts,
  MIN_TRADE_ORDER_AMOUNT,
  resolvePriceAfterDelta,
} from './tradeImpact';
import {
  type BattleStockHistoryRuntime,
  findStockByKey,
  formatPositionUnits,
  normalizePositionUnits,
  resolveOwnStockKey,
  syncPlayerBooksFromPositions,
} from './tradeBattleState';

export type BattleSequenceRuntime = {
  logSequence: number;
  positionSequence: number;
};

type RuntimeState = Pick<GameState, 'turn' | 'stocks' | 'players'>;

type ConsumedPositionEntry = {
  id: string;
  stockKey: StockKey;
  side: TradePositionEntry['side'];
  quantity: number;
  entryPrice: number;
  entryHistoryPointId?: number;
  orderAmount: number;
};

type PushLog = (
  logs: LogEntry[],
  type: LogEntry['type'],
  label: string,
  message: string,
  tone: LogEntry['tone'],
) => void;

export function createTradeBattleRuntime(options: {
  state: RuntimeState;
  sequences: BattleSequenceRuntime;
  stockHistory: BattleStockHistoryRuntime;
}) {
  const { state, sequences, stockHistory } = options;

  const getStock = (stockKey: StockKey) => findStockByKey(state, stockKey);

  const pushLog: PushLog = (logs, type, label, message, tone) => {
    sequences.logSequence += 1;
    logs.push({
      id: sequences.logSequence,
      turn: state.turn,
      type,
      label,
      message,
      tone,
    });
  };

  const createTradePosition = (
    stockKey: StockKey,
    side: TradePositionEntry['side'],
    quantity: number,
    entryPrice: number,
    entryHistoryPointId: number,
    orderAmount: number,
  ): TradePositionEntry => {
    sequences.positionSequence += 1;

    return {
      id: `position-${sequences.positionSequence}`,
      stockKey,
      side,
      quantity: normalizePositionUnits(quantity),
      entryPrice,
      entryHistoryPointId,
      orderAmount,
      openedTurn: state.turn,
    };
  };

  const appendTradePosition = (
    player: PlayerState,
    stockKey: StockKey,
    side: TradePositionEntry['side'],
    quantity: number,
    entryPrice: number,
    entryHistoryPointId: number,
    orderAmount: number,
  ) => {
    player.positions.push(
      createTradePosition(stockKey, side, quantity, entryPrice, entryHistoryPointId, orderAmount),
    );
    syncPlayerBooksFromPositions(player);
  };

  const extractTradePositionById = (
    player: PlayerState,
    positionId: string,
  ): ConsumedPositionEntry | null => {
    const targetPosition = player.positions.find((position) => position.id === positionId);
    if (!targetPosition) {
      return null;
    }

    player.positions = player.positions.filter((position) => position.id !== positionId);
    syncPlayerBooksFromPositions(player);

    return {
      id: targetPosition.id,
      stockKey: targetPosition.stockKey,
      side: targetPosition.side,
      quantity: targetPosition.quantity,
      entryPrice: targetPosition.entryPrice,
      entryHistoryPointId: targetPosition.entryHistoryPointId,
      orderAmount: targetPosition.orderAmount,
    };
  };

  const moveStockPrice = (stockKey: StockKey, rawDelta: number): number => {
    const stock = getStock(stockKey);
    const before = stock.currentPrice;
    const resolved = resolvePriceAfterDelta(
      before,
      stock.basePrice,
      stock.bubbleUpper,
      stock.bubbleLower,
      rawDelta,
    );

    stock.previousPrice = before;
    stock.currentPrice = resolved.nextPrice;
    stock.history = [
      ...stock.history.slice(-(12 - resolved.historyTrail.length)),
      ...resolved.historyTrail,
    ];
    const nextHistoryPointIds = resolved.historyTrail.map(() => {
      stockHistory.pointCounters[stockKey] += 1;
      return stockHistory.pointCounters[stockKey];
    });
    stockHistory.pointIds[stockKey] = [
      ...stockHistory.pointIds[stockKey].slice(-(12 - nextHistoryPointIds.length)),
      ...nextHistoryPointIds,
    ];

    return resolved.nextPrice - before;
  };

  const applyTradePriceEffect = (
    playerId: PlayerId,
    stockKey: StockKey,
    tradeAction: TurnActionPayload['tradeAction'],
    executedAmount: number,
  ) => {
    const targetStock = getStock(stockKey);
    const impactAmounts = calculateTradeImpactAmounts(
      playerId,
      stockKey,
      tradeAction,
      executedAmount,
      targetStock.currentPrice,
      targetStock.basePrice,
    );

    if (impactAmounts.p1 !== 0) moveStockPrice('p1', impactAmounts.p1);
    if (impactAmounts.p2 !== 0) moveStockPrice('p2', impactAmounts.p2);
    if (impactAmounts.market !== 0) moveStockPrice('market', impactAmounts.market);
  };

  const resolveOrderQuantity = (openPrice: number, rawAmount: number): number => {
    const amount = Math.max(0, Math.floor(rawAmount));
    if (amount < MIN_TRADE_ORDER_AMOUNT || openPrice <= 0) {
      return 0;
    }

    return normalizePositionUnits(amount / openPrice);
  };

  const settleSpeculation = (player: PlayerState, logs: LogEntry[]) => {
    const settled: SpeculationPosition[] = [];
    const remaining: SpeculationPosition[] = [];

    for (const position of player.speculation) {
      if (position.settlementTurn <= state.turn) {
        settled.push(position);
      } else {
        remaining.push(position);
      }
    }

    player.speculation = remaining;

    for (const position of settled) {
      const currentPrice = getStock(position.stockKey).currentPrice;
      const pnl =
        position.side === 'buy'
          ? (currentPrice - position.entryPrice) * position.quantity
          : (position.entryPrice - currentPrice) * position.quantity;

      player.cash += position.committedCash + pnl;

      pushLog(
        logs,
        'system',
        '短期決済',
        `${player.name}の${getStock(position.stockKey).name} ${position.side === 'buy' ? '買い' : '売り'}ポジション 約${formatPositionUnits(position.quantity)}口を決済しました。返却 ${formatCurrency(position.committedCash)} / 損益 ${formatSignedCurrency(pnl)}`,
        pnl >= 0 ? 'up' : 'warn',
      );
    }
  };

  const closeOpenPosition = (
    player: PlayerState,
    positionId: string,
    logs: LogEntry[],
  ): boolean => {
    const position = player.positions.find((item) => item.id === positionId);
    if (!position) {
      pushLog(
        logs,
        'system',
        'ポジション不足',
        `${player.name}が決済しようとしたポジションが見つかりません。`,
        'warn',
      );
      return false;
    }

    const stock = getStock(position.stockKey);
    const closeAction = position.side === 'buy' ? 'sell' : 'buy';
    const executionPrice = stock.currentPrice;
    const settled = extractTradePositionById(player, positionId);

    if (!settled) {
      pushLog(
        logs,
        'system',
        'ポジション不足',
        `${player.name}の${stock.name}ポジションを決済できませんでした。`,
        'warn',
      );
      return false;
    }

    if (settled.side === 'buy') {
      const returnedCash = calculateTradePositionSettlementCash(settled, executionPrice);
      const pnl = calculateTradePositionPnL(settled, executionPrice);
      const closeImpactAmount = calculateTradePositionCloseImpactAmount(settled, executionPrice);
      player.cash += returnedCash;

      pushLog(
        logs,
        'player',
        'ポジション決済',
        `${player.name}が${stock.name}の買いポジションを決済。回収 ${formatCurrency(returnedCash)} / 損益 ${formatSignedCurrency(pnl)}`,
        pnl >= 0 ? 'up' : 'warn',
      );
      applyTradePriceEffect(player.id, settled.stockKey, closeAction, closeImpactAmount);
      return true;
    }

    const realized = calculateTradePositionPnL(settled, executionPrice);
    const returnedCash = calculateTradePositionSettlementCash(settled, executionPrice);
    const closeImpactAmount = calculateTradePositionCloseImpactAmount(settled, executionPrice);
    player.cash += returnedCash;
    stock.shortInterest = Math.max(0, stock.shortInterest - settled.quantity);

    pushLog(
      logs,
      'player',
      'ポジション決済',
      `${player.name}が${stock.name}の売りポジションを決済。回収 ${formatCurrency(returnedCash)} / 損益 ${formatSignedCurrency(realized)}`,
      realized >= 0 ? 'up' : 'warn',
    );
    applyTradePriceEffect(player.id, settled.stockKey, closeAction, closeImpactAmount);
    return true;
  };

  const applyPlayerOrder = (player: PlayerState, payload: TurnActionPayload, logs: LogEntry[]) => {
    const stock = getStock(payload.stockKey);
    const openPrice = stock.currentPrice;
    const orderAmount = Math.max(0, Math.floor(payload.quantity));
    const quantity = resolveOrderQuantity(openPrice, orderAmount);
    const requiredCash = orderAmount;

    if (quantity <= 0) {
      const shortageMessage =
        orderAmount > 0 && orderAmount < MIN_TRADE_ORDER_AMOUNT
          ? `${player.name}の注文額 ${formatCurrency(orderAmount)} は最低注文額 ${formatCurrency(MIN_TRADE_ORDER_AMOUNT)} を下回っています。`
          : `${player.name}の注文額 ${formatCurrency(orderAmount)} では ${stock.name} を約定できません。`;
      pushLog(logs, 'system', '注文額不足', shortageMessage, 'warn');
      return;
    }

    if (player.cash < requiredCash) {
      pushLog(
        logs,
        'system',
        '資金不足',
        `${player.name}は${stock.name}の注文に必要な現金が不足しています。`,
        'warn',
      );
      return;
    }

    if (payload.tradeMode === 'speculation') {
      if (payload.tradeAction !== 'buy' && payload.tradeAction !== 'sell') {
        pushLog(logs, 'system', '短期ルール', '短期では買いか売りのみ選べます。', 'warn');
        return;
      }

      applyTradePriceEffect(player.id, payload.stockKey, payload.tradeAction, orderAmount);
      const executionPrice = getStock(payload.stockKey).currentPrice;
      const executedUnits = resolveOrderQuantity(executionPrice, orderAmount);
      if (executedUnits <= 0) {
        pushLog(
          logs,
          'system',
          '注文額不足',
          `${player.name}の注文額 ${formatCurrency(orderAmount)} では ${stock.name} を建てられません。`,
          'warn',
        );
        return;
      }

      player.cash -= requiredCash;
      player.speculation.push({
        stockKey: payload.stockKey,
        side: payload.tradeAction,
        quantity: executedUnits,
        entryPrice: executionPrice,
        committedCash: requiredCash,
        settlementTurn: state.turn + 2,
      });

      if (payload.tradeAction === 'buy') {
        pushLog(
          logs,
          'player',
          '短期',
          `${player.name}が${stock.name}を買いで ${formatCurrency(orderAmount)} 注文。約定 ${formatCurrency(executionPrice)} / 約${formatPositionUnits(executedUnits)}口`,
          'up',
        );
        return;
      }

      stock.shortInterest += executedUnits;
      pushLog(
        logs,
        'player',
        '短期',
        `${player.name}が${stock.name}を売りで ${formatCurrency(orderAmount)} 注文。約定 ${formatCurrency(executionPrice)} / 約${formatPositionUnits(executedUnits)}口`,
        'down',
      );
      return;
    }

    if (payload.tradeAction === 'buy') {
      applyTradePriceEffect(player.id, payload.stockKey, payload.tradeAction, requiredCash);
      const executionPrice = getStock(payload.stockKey).currentPrice;
      const entryHistoryPointId =
        stockHistory.pointIds[payload.stockKey][
          stockHistory.pointIds[payload.stockKey].length - 1
        ] ?? stockHistory.pointCounters[payload.stockKey];
      const executedUnits = resolveOrderQuantity(executionPrice, requiredCash);
      if (executedUnits <= 0) {
        pushLog(
          logs,
          'system',
          '注文額不足',
          `${player.name}の注文額 ${formatCurrency(orderAmount)} では ${stock.name} を建てられません。`,
          'warn',
        );
        return;
      }

      player.cash -= requiredCash;
      appendTradePosition(
        player,
        payload.stockKey,
        'buy',
        executedUnits,
        executionPrice,
        entryHistoryPointId,
        requiredCash,
      );

      pushLog(
        logs,
        'player',
        '買い',
        `${player.name}が${stock.name}を ${formatCurrency(requiredCash)} で買い。約定 ${formatCurrency(executionPrice)} / 約${formatPositionUnits(executedUnits)}口`,
        'up',
      );
      return;
    }

    applyTradePriceEffect(player.id, payload.stockKey, payload.tradeAction, requiredCash);
    const executionPrice = getStock(payload.stockKey).currentPrice;
    const entryHistoryPointId =
      stockHistory.pointIds[payload.stockKey][stockHistory.pointIds[payload.stockKey].length - 1] ??
      stockHistory.pointCounters[payload.stockKey];
    const executedUnits = resolveOrderQuantity(executionPrice, requiredCash);
    if (executedUnits <= 0) {
      pushLog(
        logs,
        'system',
        '注文額不足',
        `${player.name}の注文額 ${formatCurrency(orderAmount)} では ${stock.name} を売りで建てられません。`,
        'warn',
      );
      return;
    }

    player.cash -= requiredCash;
    appendTradePosition(
      player,
      payload.stockKey,
      'sell',
      executedUnits,
      executionPrice,
      entryHistoryPointId,
      requiredCash,
    );
    stock.shortInterest += executedUnits;

    pushLog(
      logs,
      'player',
      '売り',
      `${player.name}が${stock.name}を ${formatCurrency(requiredCash)} で売り。約定 ${formatCurrency(executionPrice)} / 約${formatPositionUnits(executedUnits)}口`,
      'down',
    );
  };

  const applyCompanyAction = (
    player: PlayerState,
    action: TurnActionPayload['companyAction'],
    logs: LogEntry[],
  ) => {
    if (action === NO_COMPANY_ACTION) {
      return;
    }

    if (player.cooldowns[action] > 0) {
      pushLog(
        logs,
        'system',
        'クールダウン',
        `${player.name}の${action}はあと${player.cooldowns[action]}ターン使えません。`,
        'warn',
      );
      return;
    }

    if (action === BUYBACK_ACTION) {
      pushLog(
        logs,
        'system',
        '未使用の追加操作',
        'この操作は現在のルールでは使用できません。',
        'warn',
      );
      return;
    }

    const stockKey = resolveOwnStockKey(player.id);

    switch (action) {
      case CAPITAL_INCREASE_ACTION:
        player.companyFunds += 1500;
        moveStockPrice(stockKey, -12);
        player.cooldowns[action] = 3;
        pushLog(
          logs,
          'player',
          '追加操作',
          `${player.name}が資金調整を実行。予備資金 +${formatCurrency(1500)}、自分レートはやや下向きです。`,
          'warn',
        );
        break;
      case AD_CAMPAIGN_ACTION: {
        const cost = 600;
        if (player.companyFunds < cost) {
          pushLog(
            logs,
            'system',
            '予備資金不足',
            `${player.name}は注目集めに必要な予備資金が不足しています。`,
            'warn',
          );
          return;
        }

        player.companyFunds -= cost;
        player.cash += 220;
        moveStockPrice(stockKey, 6);
        player.cooldowns[action] = 2;
        pushLog(
          logs,
          'player',
          '追加操作',
          `${player.name}が注目集めを実行。予備資金 -${formatCurrency(cost)}、現金 +${formatCurrency(220)}。`,
          'up',
        );
        break;
      }
      case FACILITY_INVESTMENT_ACTION: {
        const cost = 700;
        if (player.companyFunds < cost) {
          pushLog(
            logs,
            'system',
            '予備資金不足',
            `${player.name}は安定化に必要な予備資金が不足しています。`,
            'warn',
          );
          return;
        }

        player.companyFunds -= cost;
        moveStockPrice(stockKey, 4);
        player.cooldowns[action] = 2;
        pushLog(
          logs,
          'player',
          '追加操作',
          `${player.name}が安定化を実行。自分レートが上向きました。`,
          'up',
        );
        break;
      }
    }
  };

  return {
    pushLog,
    settleSpeculation,
    closeOpenPosition,
    applyPlayerOrder,
    applyCompanyAction,
  };
}
