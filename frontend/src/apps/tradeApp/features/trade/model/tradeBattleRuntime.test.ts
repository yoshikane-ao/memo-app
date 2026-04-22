import { describe, expect, it } from 'vitest';

import { createInitialGameState } from './mockGame';
import {
  AD_CAMPAIGN_ACTION,
  BUYBACK_ACTION,
  CAPITAL_INCREASE_ACTION,
  FACILITY_INVESTMENT_ACTION,
  NO_COMPANY_ACTION,
  type GameState,
  type PlayerState,
  type StockKey,
  type TurnActionPayload,
} from '../types';
import { findPlayerById, findStockByKey, initializeBattleState } from './tradeBattleState';
import { createTradeBattleRuntime } from './tradeBattleRuntime';

function createRuntimeContext(options?: { keepCpuPool?: boolean }): {
  state: GameState;
  runtime: ReturnType<typeof createTradeBattleRuntime>;
  player1: PlayerState;
  getStock: (stockKey: StockKey) => ReturnType<typeof findStockByKey>;
  stockHistory: {
    pointCounters: Record<StockKey, number>;
    pointIds: Record<StockKey, number[]>;
  };
} {
  const state = createInitialGameState();
  state.rngSeed = 1;
  const stockHistory = {
    pointCounters: { p1: 0, p2: 0, market: 0 },
    pointIds: { p1: [], p2: [], market: [] },
  };
  const sequences = initializeBattleState(state, { stockHistory, seed: 1 });

  if (!options?.keepCpuPool) {
    state.stocks.forEach((stock) => {
      stock.cpuPool = [];
    });
  }

  const runtime = createTradeBattleRuntime({
    state,
    sequences: {
      logSequence: sequences.logSequence,
      positionSequence: sequences.positionSequence,
      forwardSequence: sequences.forwardSequence,
    },
    stockHistory,
  });

  return {
    state,
    runtime,
    player1: findPlayerById(state, 'player1'),
    getStock: (stockKey) => findStockByKey(state, stockKey),
    stockHistory,
  };
}

function createOrderPayload(overrides: Partial<TurnActionPayload>): TurnActionPayload {
  return {
    stockKey: 'market',
    tradeAction: 'buy',
    tradeMode: 'investment',
    quantity: 10000,
    companyAction: NO_COMPANY_ACTION,
    ...overrides,
  };
}

describe('tradeBattleRuntime', () => {
  it('opens an investment buy position and synchronizes books', () => {
    const { runtime, player1, getStock } = createRuntimeContext();
    const logs: GameState['logs'] = [];

    runtime.applyPlayerOrder(player1, createOrderPayload({}), logs);

    expect(player1.cash).toBe(90000);
    expect(player1.positions).toHaveLength(1);
    expect(player1.positions[0]).toMatchObject({
      stockKey: 'market',
      side: 'buy',
      orderAmount: 10000,
    });
    expect(player1.holdings.market.quantity).toBeGreaterThan(0);
    expect(player1.shorts.market.quantity).toBe(0);
    expect(getStock('p1').currentPrice).toBe(1005000);
    expect(getStock('p2').currentPrice).toBe(1005000);
    expect(getStock('market').currentPrice).toBe(1010000);
    expect(logs.some((log) => log.label === '買い' && log.tone === 'up')).toBe(true);
  });

  it('settles matured speculation positions and returns committed cash', () => {
    const { state, runtime, player1, getStock } = createRuntimeContext();
    runtime.applyPlayerOrder(
      player1,
      createOrderPayload({
        tradeMode: 'speculation',
      }),
      [],
    );

    const settledPosition = player1.speculation[0];
    getStock('market').currentPrice = settledPosition.entryPrice + 10000;
    state.turn = settledPosition.settlementTurn;

    const logs: GameState['logs'] = [];
    runtime.settleSpeculation(player1, logs);

    expect(player1.speculation).toHaveLength(0);
    expect(player1.cash).toBeGreaterThan(100000);
    expect(logs[0]).toMatchObject({
      type: 'system',
      label: '短期決済',
    });
  });

  it('closes open short positions and releases short interest', () => {
    const { runtime, player1, getStock } = createRuntimeContext();
    runtime.applyPlayerOrder(
      player1,
      createOrderPayload({
        tradeAction: 'sell',
      }),
      [],
    );

    const positionId = player1.positions[0]?.id;
    expect(positionId).toBeTruthy();
    getStock('market').currentPrice = 980000;

    const logs: GameState['logs'] = [];
    const didClose = runtime.closeOpenPosition(player1, positionId!, logs);

    expect(didClose).toBe(true);
    expect(player1.cash).toBe(110000);
    expect(player1.positions).toHaveLength(0);
    expect(getStock('market').shortInterest).toBe(0);
    expect(logs.some((log) => log.label === 'ポジション決済')).toBe(true);
  });

  it('consumes charges for ad campaign and applies CPU participation boost', () => {
    const { runtime, player1, getStock } = createRuntimeContext({ keepCpuPool: true });
    player1.companyFunds = 2000;
    const chargesBefore = player1.companyActionCharges[AD_CAMPAIGN_ACTION];

    const logs: GameState['logs'] = [];
    runtime.applyCompanyAction(player1, AD_CAMPAIGN_ACTION, logs);

    expect(player1.companyFunds).toBe(2000 - 900);
    expect(player1.cash).toBe(100000 + 330);
    expect(player1.companyActionCharges[AD_CAMPAIGN_ACTION]).toBe(chargesBefore - 1);
    expect(getStock('p1').currentPrice).toBeGreaterThan(1000000);
    expect(logs[0]).toMatchObject({
      type: 'player',
      label: '追加操作',
      tone: 'up',
    });
  });

  it('executes buyback, consumes a charge, and moves own stock up', () => {
    const { runtime, player1, getStock } = createRuntimeContext();
    player1.companyFunds = 2000;
    const beforePrice = getStock('p1').currentPrice;
    const chargesBefore = player1.companyActionCharges[BUYBACK_ACTION];

    const logs: GameState['logs'] = [];
    runtime.applyCompanyAction(player1, BUYBACK_ACTION, logs);

    expect(player1.companyFunds).toBe(2000 - 1200);
    expect(player1.companyActionCharges[BUYBACK_ACTION]).toBe(chargesBefore - 1);
    expect(getStock('p1').currentPrice).toBeGreaterThan(beforePrice);
    expect(logs[0]).toMatchObject({
      type: 'player',
      label: '追加操作',
      tone: 'up',
    });
  });

  it('rejects buyback when companyFunds are insufficient', () => {
    const { runtime, player1, getStock } = createRuntimeContext();
    player1.companyFunds = 500;
    const beforePrice = getStock('p1').currentPrice;
    const chargesBefore = player1.companyActionCharges[BUYBACK_ACTION];

    const logs: GameState['logs'] = [];
    runtime.applyCompanyAction(player1, BUYBACK_ACTION, logs);

    expect(player1.companyFunds).toBe(500);
    expect(player1.companyActionCharges[BUYBACK_ACTION]).toBe(chargesBefore);
    expect(getStock('p1').currentPrice).toBe(beforePrice);
    expect(logs[0]).toMatchObject({
      type: 'system',
      label: '予備資金不足',
      tone: 'warn',
    });
  });

  it('rejects company action when charges are exhausted', () => {
    const { runtime, player1 } = createRuntimeContext();
    player1.companyFunds = 5000;
    player1.companyActionCharges[BUYBACK_ACTION] = 0;

    const logs: GameState['logs'] = [];
    runtime.applyCompanyAction(player1, BUYBACK_ACTION, logs);

    expect(player1.companyFunds).toBe(5000);
    expect(logs[0]).toMatchObject({
      type: 'system',
      label: 'チャージ切れ',
      tone: 'warn',
    });
  });

  it('is deterministic under identical seed and inputs', () => {
    function runSession() {
      const { runtime, player1, getStock } = createRuntimeContext({ keepCpuPool: true });
      const logs: GameState['logs'] = [];
      runtime.applyPlayerOrder(player1, createOrderPayload({ quantity: 20000 }), logs);
      runtime.applyPlayerOrder(
        player1,
        createOrderPayload({ stockKey: 'p1', tradeAction: 'sell', quantity: 8000 }),
        logs,
      );
      return {
        cash: player1.cash,
        marketPrice: getStock('market').currentPrice,
        p1Price: getStock('p1').currentPrice,
      };
    }
    const a = runSession();
    const b = runSession();
    expect(a).toEqual(b);
  });

  it('rejects the action when capital increase has zero charges', () => {
    const { runtime, player1 } = createRuntimeContext();
    player1.companyActionCharges[CAPITAL_INCREASE_ACTION] = 0;
    const logs: GameState['logs'] = [];
    runtime.applyCompanyAction(player1, CAPITAL_INCREASE_ACTION, logs);
    expect(logs[0]).toMatchObject({ label: 'チャージ切れ', tone: 'warn' });
  });

  it('places a forward order and deducts reservation fee', () => {
    const { runtime, state, player1 } = createRuntimeContext();
    const cashBefore = player1.cash;
    const logs: GameState['logs'] = [];

    runtime.placeForwardOrder(player1, createOrderPayload({ quantity: 10000 }), logs);

    expect(state.forwardOrders).toHaveLength(1);
    const order = state.forwardOrders[0];
    expect(order.status).toBe('pending');
    expect(order.triggerTurn).toBe(state.turn + 2);
    expect(order.reservationFee).toBe(300);
    expect(player1.cash).toBe(cashBefore - 300);
  });

  it('settles forward orders at trigger turn and applies execution', () => {
    const { runtime, state, player1 } = createRuntimeContext();
    runtime.placeForwardOrder(player1, createOrderPayload({ quantity: 10000 }), []);
    const order = state.forwardOrders[0];
    const cashBeforeSettle = player1.cash;

    state.turn = order.triggerTurn;
    const logs: GameState['logs'] = [];
    runtime.settleForwardOrdersForTurn(logs);

    const settled = state.forwardOrders.find((o) => o.id === order.id);
    expect(settled?.status).toBe('settled');
    expect(player1.positions).toHaveLength(1);
    expect(player1.cash).toBe(cashBeforeSettle - 10000);
  });

  it('cancels pending forward order by spending a feint token', () => {
    const { runtime, state, player1 } = createRuntimeContext();
    runtime.placeForwardOrder(player1, createOrderPayload({ quantity: 10000 }), []);
    const order = state.forwardOrders[0];
    const tokensBefore = player1.feintTokens;

    const logs: GameState['logs'] = [];
    const didCancel = runtime.cancelForwardOrderWithFeint(player1, order.id, logs);

    expect(didCancel).toBe(true);
    expect(order.status).toBe('canceled');
    expect(player1.feintTokens).toBe(tokensBefore - 1);
  });

  it('rejects cancelling forward order when no feint tokens remain', () => {
    const { runtime, state, player1 } = createRuntimeContext();
    runtime.placeForwardOrder(player1, createOrderPayload({ quantity: 10000 }), []);
    const order = state.forwardOrders[0];
    player1.feintTokens = 0;

    const logs: GameState['logs'] = [];
    const didCancel = runtime.cancelForwardOrderWithFeint(player1, order.id, logs);
    expect(didCancel).toBe(false);
    expect(order.status).toBe('pending');
  });

  it('reveals scheduled events at configured turns', () => {
    const { runtime, state } = createRuntimeContext();
    state.turn = 3;
    const logs: GameState['logs'] = [];
    runtime.revealEventsForTurn(logs);
    expect(state.revealedEvents).toHaveLength(1);
    expect(state.revealedEvents[0].status).toBe('revealed');
  });

  it('fires due events and applies their effect', () => {
    const { runtime, state } = createRuntimeContext();
    state.turn = 3;
    runtime.revealEventsForTurn([]);
    const revealed = state.revealedEvents[0];
    state.turn = revealed.triggerTurn;
    const logs: GameState['logs'] = [];
    runtime.fireDueEvents(logs);
    expect(state.revealedEvents[0].status).toBe('fired');
  });

  it('rejects company action while charges present but funds insufficient for facility investment', () => {
    const { runtime, player1 } = createRuntimeContext();
    player1.companyFunds = 300;
    const chargesBefore = player1.companyActionCharges[FACILITY_INVESTMENT_ACTION];
    const logs: GameState['logs'] = [];
    runtime.applyCompanyAction(player1, FACILITY_INVESTMENT_ACTION, logs);
    expect(player1.companyActionCharges[FACILITY_INVESTMENT_ACTION]).toBe(chargesBefore);
    expect(logs[0]).toMatchObject({ label: '予備資金不足', tone: 'warn' });
  });
});
