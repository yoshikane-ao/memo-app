import { describe, expect, it } from 'vitest';
import {
  AD_CAMPAIGN_ACTION,
  BUYBACK_ACTION,
  CAPITAL_INCREASE_ACTION,
  FACILITY_INVESTMENT_ACTION,
  type GameState,
  type PlayerState,
} from '../types';
import { createInitialGameState } from './mockGame';
import {
  advanceBattleTurnState,
  formatPositionUnits,
  initializeBattleState,
  normalizePositionUnits,
  syncPlayerBooksFromPositions,
} from './tradeBattleState';

function createGameState(): GameState {
  return createInitialGameState();
}

function createPlayer(): PlayerState {
  return createGameState().players[0];
}

describe('tradeBattleState', () => {
  it('initializes battle state from session settings and resets runtime counters', () => {
    const state = createGameState();
    const runtime = {
      pointCounters: { p1: 99, p2: 99, market: 99 },
      pointIds: { p1: [99], p2: [99], market: [99] },
    };

    state.turn = 8;
    state.currentPlayer = 'player2';
    state.logs = [{ id: 1, turn: 8, type: 'system', label: 'x', message: 'y', tone: 'warn' }];
    state.players[0].positions = [
      {
        id: 'position-1',
        stockKey: 'p1',
        side: 'buy',
        quantity: 2,
        entryPrice: 9000,
        entryHistoryPointId: 3,
        orderAmount: 18000,
        openedTurn: 4,
      },
    ];
    state.players[0].cooldowns[CAPITAL_INCREASE_ACTION] = 2;
    state.players[0].cooldowns[AD_CAMPAIGN_ACTION] = 1;
    state.players[0].cooldowns[BUYBACK_ACTION] = 3;
    state.players[0].cooldowns[FACILITY_INVESTMENT_ACTION] = 2;

    const result = initializeBattleState(state, {
      settings: {
        battleMode: 'pvp',
        player1Name: 'Alpha',
        player2Name: 'Beta',
        firstPlayer: 'p1',
        marketCpuCount: 0,
        player1StartingCash: 120000,
        player2StartingCash: 95000,
        marketStartingPrice: 14000,
      },
      stockHistory: runtime,
    });

    expect(result).toEqual({
      isGameOver: false,
      logSequence: 1000,
      positionSequence: 0,
    });
    expect(state.turn).toBe(1);
    expect(state.currentPlayer).toBe('player1');
    expect(state.logs).toEqual([]);
    expect(state.initialTotalAssets).toBe(215000);
    expect(state.players[0].name).toBe('Alpha');
    expect(state.players[1].name).toBe('Beta');
    expect(state.players[0].cash).toBe(120000);
    expect(state.players[1].cash).toBe(95000);
    expect(state.players[0].companyFunds).toBe(3000);
    expect(state.players[0].positions).toEqual([]);
    expect(state.players[0].holdings.p1).toEqual({ quantity: 0, avgPrice: 0 });
    expect(state.players[0].cooldowns).toEqual({
      [CAPITAL_INCREASE_ACTION]: 0,
      [AD_CAMPAIGN_ACTION]: 0,
      [BUYBACK_ACTION]: 0,
      [FACILITY_INVESTMENT_ACTION]: 0,
    });
    expect(state.stocks.find((stock) => stock.key === 'market')?.currentPrice).toBe(14000);
    expect(state.stocks.find((stock) => stock.key === 'p1')?.currentPrice).toBe(1000000);
    expect(runtime.pointCounters).toEqual({ p1: 1, p2: 1, market: 1 });
    expect(runtime.pointIds).toEqual({ p1: [1], p2: [1], market: [1] });
  });

  it('synchronizes holdings and shorts from open positions', () => {
    const player = createPlayer();
    player.positions = [
      {
        id: 'buy-1',
        stockKey: 'market',
        side: 'buy',
        quantity: 2,
        entryPrice: 10000,
        orderAmount: 20000,
        openedTurn: 1,
      },
      {
        id: 'buy-2',
        stockKey: 'market',
        side: 'buy',
        quantity: 1,
        entryPrice: 13000,
        orderAmount: 13000,
        openedTurn: 2,
      },
      {
        id: 'sell-1',
        stockKey: 'p1',
        side: 'sell',
        quantity: 1.5,
        entryPrice: 9000,
        orderAmount: 13500,
        openedTurn: 2,
      },
    ];

    syncPlayerBooksFromPositions(player);

    expect(player.holdings.market.quantity).toBe(3);
    expect(player.holdings.market.avgPrice).toBeCloseTo(11000, 4);
    expect(player.shorts.p1.quantity).toBe(1.5);
    expect(player.shorts.p1.avgPrice).toBe(9000);
  });

  it('advances to the other player during the first action of a turn', () => {
    const state = createGameState();
    state.turn = 1;
    state.currentPlayer = 'player1';
    state.marketCondition = 'bull';

    expect(advanceBattleTurnState(state)).toEqual({
      didAdvance: true,
      isGameOver: false,
    });
    expect(state.turn).toBe(1);
    expect(state.currentPlayer).toBe('player2');
    expect(state.marketCondition).toBe('bull');
  });

  it('moves to the next turn and rotates market condition on turn four', () => {
    const state = createGameState();
    state.turn = 3;
    state.currentPlayer = 'player2';
    state.marketCondition = 'bull';

    expect(advanceBattleTurnState(state)).toEqual({
      didAdvance: true,
      isGameOver: false,
    });
    expect(state.turn).toBe(4);
    expect(state.currentPlayer).toBe('player2');
    expect(state.marketCondition).toBe('sideways');
  });

  it('ends the battle after the final completed turn', () => {
    const state = createGameState();
    state.turn = 10;
    state.currentPlayer = 'player1';

    expect(advanceBattleTurnState(state)).toEqual({
      didAdvance: false,
      isGameOver: true,
    });
    expect(state.turn).toBe(10);
    expect(state.currentPlayer).toBe('player1');
  });

  it('normalizes and formats position units safely', () => {
    expect(normalizePositionUnits(Number.NaN)).toBe(0);
    expect(normalizePositionUnits(1.234567)).toBe(1.2346);
    expect(formatPositionUnits(1.5)).toBe('1.50');
  });
});
