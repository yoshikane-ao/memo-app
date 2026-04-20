import { describe, expect, it } from 'vitest';

import { createInitialGameState } from '../infrastructure/mockGame';
import {
  AD_CAMPAIGN_ACTION,
  NO_COMPANY_ACTION,
  type GameState,
  type PlayerState,
  type StockKey,
  type TurnActionPayload,
} from '../types';
import { findPlayerById, findStockByKey, initializeBattleState } from './tradeBattleState';
import { createTradeBattleRuntime } from './tradeBattleRuntime';

function createRuntimeContext(): {
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
  const stockHistory = {
    pointCounters: { p1: 0, p2: 0, market: 0 },
    pointIds: { p1: [], p2: [], market: [] },
  };
  const sequences = initializeBattleState(state, { stockHistory });
  const runtime = createTradeBattleRuntime({
    state,
    sequences: {
      logSequence: sequences.logSequence,
      positionSequence: sequences.positionSequence,
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
    const { runtime, player1, getStock, stockHistory } = createRuntimeContext();
    const logs: GameState['logs'] = [];

    runtime.applyPlayerOrder(player1, createOrderPayload({}), logs);

    expect(player1.cash).toBe(90000);
    expect(player1.positions).toHaveLength(1);
    expect(player1.positions[0]).toMatchObject({
      stockKey: 'market',
      side: 'buy',
      orderAmount: 10000,
      entryHistoryPointId: 2,
    });
    expect(player1.holdings.market.quantity).toBeGreaterThan(0);
    expect(player1.shorts.market.quantity).toBe(0);
    expect(getStock('p1').currentPrice).toBe(1005000);
    expect(getStock('p2').currentPrice).toBe(1005000);
    expect(getStock('market').currentPrice).toBe(1010000);
    expect(stockHistory.pointCounters).toEqual({ p1: 2, p2: 2, market: 2 });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      type: 'player',
      label: '買い',
      tone: 'up',
    });
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
    expect(logs).toHaveLength(1);
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
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      type: 'player',
      label: 'ポジション決済',
    });
  });

  it('applies company actions through the runtime instead of the screen component', () => {
    const { runtime, player1, getStock } = createRuntimeContext();
    player1.companyFunds = 1000;
    player1.cooldowns[AD_CAMPAIGN_ACTION] = 0;

    const logs: GameState['logs'] = [];
    runtime.applyCompanyAction(player1, AD_CAMPAIGN_ACTION, logs);

    expect(player1.companyFunds).toBe(400);
    expect(player1.cash).toBe(100220);
    expect(player1.cooldowns[AD_CAMPAIGN_ACTION]).toBe(2);
    expect(getStock('p1').currentPrice).toBe(1000100);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      type: 'player',
      label: '追加操作',
      tone: 'up',
    });
  });
});
