import type {
  EventCard,
  ForwardOrder,
  GameState,
  LogEntry,
  PlayerId,
  PlayerState,
  RevealedEvent,
  SpeculationPosition,
  StockKey,
  TradeAction,
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
  findPlayerById,
  findStockByKey,
  formatPositionUnits,
  normalizePositionUnits,
  resolveOwnStockKey,
  syncPlayerBooksFromPositions,
} from './tradeBattleState';
import { createSeededRng, type SeededRng } from './rng';
import {
  applyCompanyCpuInfluence,
  simulateCpuReactions,
  type CpuReactionContext,
} from './cpuBehavior';
import {
  calculateForwardOrderFee,
  canPlaceForwardOrder,
  createForwardOrder,
  markForwardOrderSettled,
} from './forwardOrders';

export type BattleSequenceRuntime = {
  logSequence: number;
  positionSequence: number;
  forwardSequence: number;
};

type RuntimeState = Pick<
  GameState,
  | 'turn'
  | 'stocks'
  | 'players'
  | 'rngSeed'
  | 'rngCursor'
  | 'forwardOrders'
  | 'revealedEvents'
  | 'eventDeck'
  | 'speculationDelayActive'
>;

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
  const rng: SeededRng = createSeededRng(state.rngSeed, state.rngCursor);

  const syncRng = () => {
    state.rngCursor = rng.getCursor();
  };

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
    if (!targetPosition) return null;

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

  const buildCpuContext = (logs: LogEntry[]): CpuReactionContext => ({
    rng,
    stocks: state.stocks,
    logs,
    pushLog: (targetLogs, label, message, tone) => pushLog(targetLogs, 'cpu', label, message, tone),
    applyPriceMove: (stockKey, rawDelta) => moveStockPrice(stockKey, rawDelta),
  });

  const triggerCpuReactions = (
    actingPlayerId: PlayerId,
    actingStockKey: StockKey,
    action: TradeAction,
    executedAmount: number,
    logs: LogEntry[],
  ) => {
    simulateCpuReactions({
      ctx: buildCpuContext(logs),
      actingPlayerId,
      actingStockKey,
      action,
      executedAmount,
    });
    syncRng();
  };

  const resolveOrderQuantity = (openPrice: number, rawAmount: number): number => {
    const amount = Math.max(0, Math.floor(rawAmount));
    if (amount < MIN_TRADE_ORDER_AMOUNT || openPrice <= 0) return 0;
    return normalizePositionUnits(amount / openPrice);
  };

  const settleSpeculation = (player: PlayerState, logs: LogEntry[]) => {
    if (state.speculationDelayActive) {
      state.speculationDelayActive = false;
      pushLog(
        logs,
        'system',
        '短期決済遅延',
        `${player.name}の短期ポジション決済が1ターン遅延しました。`,
        'warn',
      );
      for (const position of player.speculation) {
        if (position.settlementTurn <= state.turn) {
          position.settlementTurn = state.turn + 1;
        }
      }
      return;
    }

    const settled: SpeculationPosition[] = [];
    const remaining: SpeculationPosition[] = [];

    for (const position of player.speculation) {
      if (position.settlementTurn <= state.turn) settled.push(position);
      else remaining.push(position);
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
      } else {
        stock.shortInterest += executedUnits;
        pushLog(
          logs,
          'player',
          '短期',
          `${player.name}が${stock.name}を売りで ${formatCurrency(orderAmount)} 注文。約定 ${formatCurrency(executionPrice)} / 約${formatPositionUnits(executedUnits)}口`,
          'down',
        );
      }

      triggerCpuReactions(player.id, payload.stockKey, payload.tradeAction, orderAmount, logs);
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
      triggerCpuReactions(player.id, payload.stockKey, 'buy', requiredCash, logs);
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
    triggerCpuReactions(player.id, payload.stockKey, 'sell', requiredCash, logs);
  };

  const applyCompanyAction = (
    player: PlayerState,
    action: TurnActionPayload['companyAction'],
    logs: LogEntry[],
  ) => {
    if (action === NO_COMPANY_ACTION) return;

    if ((player.companyActionCharges[action] ?? 0) <= 0) {
      pushLog(
        logs,
        'system',
        'チャージ切れ',
        `${player.name}の${action}はもう使用できません（残回数 0）。`,
        'warn',
      );
      return;
    }

    const stockKey = resolveOwnStockKey(player.id);
    const stock = getStock(stockKey);

    switch (action) {
      case CAPITAL_INCREASE_ACTION: {
        player.companyFunds += 2250;
        moveStockPrice(stockKey, -18);
        applyCompanyCpuInfluence({
          pool: stock.cpuPool,
          influence: { kind: 'sentiment_shift', from: 'bullish', to: 'bearish', count: 2 },
          rng,
        });
        player.companyActionCharges[action] -= 1;
        syncRng();
        pushLog(
          logs,
          'player',
          '追加操作',
          `${player.name}が増資を実行。予備資金 +${formatCurrency(2250)}、CPUに弱気シフト。`,
          'warn',
        );
        break;
      }
      case AD_CAMPAIGN_ACTION: {
        const cost = 900;
        if (player.companyFunds < cost) {
          pushLog(
            logs,
            'system',
            '予備資金不足',
            `${player.name}は広告に必要な予備資金が不足しています。`,
            'warn',
          );
          return;
        }
        player.companyFunds -= cost;
        player.cash += 330;
        moveStockPrice(stockKey, 9);
        applyCompanyCpuInfluence({
          pool: stock.cpuPool,
          influence: { kind: 'participation_boost', count: 3, biasTowards: 'bullish' },
          rng,
        });
        player.companyActionCharges[action] -= 1;
        syncRng();
        pushLog(
          logs,
          'player',
          '追加操作',
          `${player.name}が広告を実行。予備資金 -${formatCurrency(cost)}、現金 +${formatCurrency(330)}、参加CPU増。`,
          'up',
        );
        break;
      }
      case FACILITY_INVESTMENT_ACTION: {
        const cost = 1050;
        if (player.companyFunds < cost) {
          pushLog(
            logs,
            'system',
            '予備資金不足',
            `${player.name}は設備投資に必要な予備資金が不足しています。`,
            'warn',
          );
          return;
        }
        player.companyFunds -= cost;
        moveStockPrice(stockKey, 6);
        applyCompanyCpuInfluence({
          pool: stock.cpuPool,
          influence: { kind: 'withdrawal_recall', count: 3 },
          rng,
        });
        player.companyActionCharges[action] -= 1;
        syncRng();
        pushLog(
          logs,
          'player',
          '追加操作',
          `${player.name}が設備投資を実行。撤退CPUが参加復帰。`,
          'up',
        );
        break;
      }
      case BUYBACK_ACTION: {
        const cost = 1200;
        if (player.companyFunds < cost) {
          pushLog(
            logs,
            'system',
            '予備資金不足',
            `${player.name}は自社買いに必要な予備資金が不足しています。`,
            'warn',
          );
          return;
        }
        player.companyFunds -= cost;
        moveStockPrice(stockKey, 15);
        applyCompanyCpuInfluence({
          pool: stock.cpuPool,
          influence: { kind: 'participation_boost', count: 2, biasTowards: 'bullish' },
          rng,
        });
        player.companyActionCharges[action] -= 1;
        syncRng();
        pushLog(
          logs,
          'player',
          '追加操作',
          `${player.name}が自社買いを実行。予備資金 -${formatCurrency(cost)}、強気CPUが参加。`,
          'up',
        );
        break;
      }
    }
  };

  const placeForwardOrder = (
    player: PlayerState,
    payload: TurnActionPayload,
    logs: LogEntry[],
  ): ForwardOrder | null => {
    const orderAmount = Math.max(0, Math.floor(payload.quantity));
    const check = canPlaceForwardOrder(player, orderAmount);
    if (!check.allowed) {
      pushLog(
        logs,
        'system',
        '予約注文拒否',
        check.reason ?? '予約注文を受け付けられません。',
        'warn',
      );
      return null;
    }
    if (orderAmount < MIN_TRADE_ORDER_AMOUNT) {
      pushLog(
        logs,
        'system',
        '予約注文拒否',
        `予約注文の最低額は ${formatCurrency(MIN_TRADE_ORDER_AMOUNT)} です。`,
        'warn',
      );
      return null;
    }

    player.cash -= check.fee;

    sequences.forwardSequence += 1;
    const order = createForwardOrder({
      playerId: player.id,
      stockKey: payload.stockKey,
      tradeAction: payload.tradeAction,
      tradeMode: payload.tradeMode,
      orderAmount,
      placedTurn: state.turn,
      idHint: sequences.forwardSequence,
    });
    state.forwardOrders.push(order);

    pushLog(
      logs,
      'player',
      '予約注文',
      `${player.name}が ${getStock(payload.stockKey).name} の ${payload.tradeAction === 'buy' ? '買い' : '売り'} ${formatCurrency(orderAmount)} を T${order.triggerTurn} に予約（予約料 ${formatCurrency(check.fee)}）。`,
      payload.tradeAction === 'buy' ? 'up' : 'down',
    );
    return order;
  };

  const settleForwardOrdersForTurn = (logs: LogEntry[]) => {
    const pending = state.forwardOrders.filter(
      (order) => order.status === 'pending' && order.triggerTurn <= state.turn,
    );
    for (const order of pending) {
      const player = findPlayerById(state, order.playerId);
      applyPlayerOrder(
        player,
        {
          stockKey: order.stockKey,
          tradeAction: order.tradeAction,
          tradeMode: order.tradeMode,
          quantity: order.orderAmount,
          companyAction: NO_COMPANY_ACTION,
          orderType: 'market',
        },
        logs,
      );
      markForwardOrderSettled(order);
      pushLog(
        logs,
        'system',
        '予約発動',
        `${player.name}の予約注文が発動しました（${getStock(order.stockKey).name} ${order.tradeAction === 'buy' ? '買い' : '売り'} ${formatCurrency(order.orderAmount)}）。`,
        'neutral',
      );
    }
  };

  const cancelForwardOrderWithFeint = (
    player: PlayerState,
    orderId: string,
    logs: LogEntry[],
  ): boolean => {
    const order = state.forwardOrders.find((item) => item.id === orderId);
    if (!order) {
      pushLog(logs, 'system', '予約取消', '予約注文が見つかりません。', 'warn');
      return false;
    }
    if (order.playerId !== player.id) {
      pushLog(logs, 'system', '予約取消', '自分の予約注文のみ取消可能です。', 'warn');
      return false;
    }
    if (order.status !== 'pending') {
      pushLog(logs, 'system', '予約取消', '既に発動または取消済みです。', 'warn');
      return false;
    }
    if (player.feintTokens <= 0) {
      pushLog(logs, 'system', '予約取消', 'ブラフチップが残っていません。', 'warn');
      return false;
    }

    player.feintTokens -= 1;
    order.status = 'canceled';
    pushLog(
      logs,
      'player',
      'ブラフ発動',
      `${player.name}が予約注文（T${order.triggerTurn}）を取消。予約料 ${formatCurrency(order.reservationFee)} は没収。`,
      'warn',
    );
    return true;
  };

  const revealEventsForTurn = (logs: LogEntry[]) => {
    const REVEAL_TURNS = [3, 6, 9];
    if (!REVEAL_TURNS.includes(state.turn)) return;
    const card = state.eventDeck.shift();
    if (!card) return;

    const revealed: RevealedEvent = {
      card,
      revealedTurn: state.turn,
      triggerTurn: state.turn + 2,
      status: 'revealed',
    };
    state.revealedEvents.push(revealed);

    pushLog(
      logs,
      'market',
      'イベント予告',
      `T${revealed.triggerTurn} に「${card.title}」が発動します。${card.description}`,
      'neutral',
    );
  };

  const applyEventEffect = (card: EventCard, logs: LogEntry[]) => {
    switch (card.effect) {
      case 'market_boom':
        moveStockPrice('market', 900);
        pushLog(
          logs,
          'market',
          'イベント発動',
          `マーケット急騰：マーケット銘柄が跳ね上がりました。`,
          'up',
        );
        break;
      case 'market_crash':
        moveStockPrice('market', -900);
        pushLog(
          logs,
          'market',
          'イベント発動',
          `マーケット急落：マーケット銘柄が崩れました。`,
          'down',
        );
        break;
      case 'cpu_withdrawal_spike': {
        let withdrawn = 0;
        for (const stock of state.stocks) {
          const active = stock.cpuPool.filter((cpu) => cpu.active);
          const target = Math.ceil(active.length * 0.35);
          for (let i = 0; i < target; i += 1) {
            if (active.length === 0) break;
            const idx = rng.nextInt(0, active.length);
            active[idx].active = false;
            active.splice(idx, 1);
            withdrawn += 1;
          }
        }
        syncRng();
        pushLog(
          logs,
          'market',
          'イベント発動',
          `CPU撤退の連鎖：計 ${withdrawn} 人が市場から撤退しました。`,
          'warn',
        );
        break;
      }
      case 'cpu_participation_surge': {
        let activated = 0;
        for (const stock of state.stocks) {
          const inactive = stock.cpuPool.filter((cpu) => !cpu.active);
          const target = Math.ceil(inactive.length * 0.6);
          for (let i = 0; i < target; i += 1) {
            if (inactive.length === 0) break;
            const idx = rng.nextInt(0, inactive.length);
            inactive[idx].active = true;
            inactive.splice(idx, 1);
            activated += 1;
          }
        }
        syncRng();
        pushLog(
          logs,
          'market',
          'イベント発動',
          `個人投資家の参入：計 ${activated} 人が参加しました。`,
          'up',
        );
        break;
      }
      case 'short_squeeze': {
        const shortMap: Record<StockKey, number> = {
          p1: getStock('p1').shortInterest,
          p2: getStock('p2').shortInterest,
          market: getStock('market').shortInterest,
        };
        let targetKey: StockKey = 'market';
        let maxShort = -1;
        (Object.keys(shortMap) as StockKey[]).forEach((key) => {
          if (shortMap[key] > maxShort) {
            maxShort = shortMap[key];
            targetKey = key;
          }
        });
        moveStockPrice(targetKey, 1200);
        pushLog(
          logs,
          'market',
          'イベント発動',
          `ショートスクイーズ：${getStock(targetKey).name} が急騰しました。`,
          'up',
        );
        break;
      }
      case 'speculation_delay':
        state.speculationDelayActive = true;
        pushLog(
          logs,
          'market',
          'イベント発動',
          '短期決済遅延：次回の短期決済は1ターン遅れます。',
          'warn',
        );
        break;
      case 'dividend_leak': {
        const beneficiary = rng.chance(0.5) ? 'player1' : 'player2';
        const player = findPlayerById(state, beneficiary);
        player.cash += 4000;
        syncRng();
        pushLog(
          logs,
          'market',
          'イベント発動',
          `配当リーク：${player.name} に現金 +${formatCurrency(4000)}。`,
          'up',
        );
        break;
      }
    }
  };

  const fireDueEvents = (logs: LogEntry[]) => {
    const due = state.revealedEvents.filter(
      (event) => event.status === 'revealed' && event.triggerTurn <= state.turn,
    );
    for (const event of due) {
      applyEventEffect(event.card, logs);
      event.status = 'fired';
    }
  };

  return {
    pushLog,
    settleSpeculation,
    closeOpenPosition,
    applyPlayerOrder,
    applyCompanyAction,
    placeForwardOrder,
    settleForwardOrdersForTurn,
    cancelForwardOrderWithFeint,
    revealEventsForTurn,
    fireDueEvents,
    syncRng,
  };
}

export { calculateForwardOrderFee };
