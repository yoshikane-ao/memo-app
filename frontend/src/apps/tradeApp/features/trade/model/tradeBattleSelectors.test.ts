import { describe, expect, it } from 'vitest';

import { createInitialGameState } from './mockGame';
import { AD_CAMPAIGN_ACTION, type StockKey } from '../types';
import { buildBattleActionProjection, createDefaultBattleActionDraft } from './tradeBattle';
import { findPlayerById, initializeBattleState } from './tradeBattleState';
import {
  buildActivePositionMarkers,
  buildBattleResult,
  buildPendingClosePreview,
  buildPendingCloseSummary,
  buildProjectedBoardPrices,
  cloneStockSnapshots,
  createCurrentPriceMap,
  hasProjectedChartMovement,
} from './tradeBattleSelectors';

function createBattleState() {
  const state = createInitialGameState();
  const stockHistory = {
    pointCounters: { p1: 0, p2: 0, market: 0 } as Record<StockKey, number>,
    pointIds: { p1: [], p2: [], market: [] } as Record<StockKey, number[]>,
  };

  initializeBattleState(state, { stockHistory });

  return { state, stockHistory };
}

describe('tradeBattleSelectors', () => {
  it('builds pending close previews and formatted summaries from live positions', () => {
    const { state } = createBattleState();
    const player1 = findPlayerById(state, 'player1');
    const marketStock = state.stocks.find((stock) => stock.key === 'market')!;

    player1.positions = [
      {
        id: 'position-1',
        stockKey: 'market',
        side: 'buy',
        quantity: 1,
        entryPrice: 1_000_000,
        entryHistoryPointId: 1,
        orderAmount: 10_000,
        openedTurn: 1,
      },
    ];
    marketStock.currentPrice = 1_000_200;

    const preview = buildPendingClosePreview({
      isGameOver: false,
      pendingClosePositionId: 'position-1',
      player: player1,
      stocks: state.stocks,
    });
    const summary = buildPendingCloseSummary(preview);

    expect(preview).toMatchObject({
      positionId: 'position-1',
      stockKey: 'market',
      executionPrice: 1_000_200,
      realizedPnl: 200,
      returnedCash: 10_200,
    });
    expect(preview?.priceMap).toEqual({
      p1: 999_900,
      p2: 999_900,
      market: 1_000_000,
    });
    expect(summary).toEqual({
      stockName: marketStock.name,
      side: 'buy',
      executionPriceText: '1,000,200円',
      projectedPnlText: '+200円',
      returnedCashText: '10,200円',
    });
  });

  it('projects company and trade actions onto the board price map', () => {
    const { state } = createBattleState();
    const player1 = findPlayerById(state, 'player1');

    player1.companyFunds = 1_000;
    player1.companyActionCharges[AD_CAMPAIGN_ACTION] = 2;
    state.stocks.forEach((stock) => {
      stock.cpuPool = [];
    });

    const companyDraft = {
      ...createDefaultBattleActionDraft(),
      actionKind: 'company' as const,
      companyAction: AD_CAMPAIGN_ACTION,
    };
    const tradeDraft = {
      ...createDefaultBattleActionDraft(),
      quantity: 10_000,
    };
    const tradeProjection = buildBattleActionProjection(player1, state.stocks, tradeDraft);

    const companyProjected = buildProjectedBoardPrices({
      isGameOver: false,
      pendingClosePreview: null,
      currentPlayer: player1,
      actionDraft: companyDraft,
      actionProjection: tradeProjection,
      stocks: state.stocks,
    });
    const tradeProjected = buildProjectedBoardPrices({
      isGameOver: false,
      pendingClosePreview: null,
      currentPlayer: player1,
      actionDraft: tradeDraft,
      actionProjection: tradeProjection,
      stocks: state.stocks,
    });

    expect(companyProjected).toEqual({
      p1: 1_000_100,
      p2: 1_000_000,
      market: 1_000_000,
    });
    expect(tradeProjected).toEqual({
      p1: 1_005_000,
      p2: 1_005_000,
      market: 1_010_000,
    });
  });

  it('builds battle results and active position markers from pure state', () => {
    const { state, stockHistory } = createBattleState();
    const player1 = findPlayerById(state, 'player1');

    player1.name = 'Alpha';
    player1.positions = [
      {
        id: 'position-1',
        stockKey: 'market',
        side: 'buy',
        quantity: 1,
        entryPrice: 1_000_000,
        entryHistoryPointId: 1,
        orderAmount: 10_000,
        openedTurn: 1,
      },
    ];

    const result = buildBattleResult({
      isGameOver: true,
      leftPlayer: player1,
      rightPlayer: { ...findPlayerById(state, 'player2'), name: 'Beta' },
      leftVictoryValue: 120_000,
      rightVictoryValue: 110_000,
    });
    const markers = buildActivePositionMarkers({
      players: state.players,
      stocks: state.stocks,
      stockHistoryPointIds: stockHistory.pointIds,
      pendingClosePreview: null,
      pendingClosePositionId: 'position-1',
    });

    expect(result).toEqual({
      title: 'Alpha の勝利',
      tone: 'player1',
    });
    expect(markers).toEqual([
      {
        id: 'position-marker-position-1',
        stockKey: 'market',
        playerId: 'player1',
        positionId: 'position-1',
        pnl: 0,
        side: 'buy',
        isPendingClose: true,
        executionPrice: 1_000_000,
        historyIndex: 0,
        turn: 1,
        orderAmount: 10_000,
      },
    ]);
  });

  it('creates immutable stock snapshots and detects projected movement', () => {
    const { state } = createBattleState();
    const priceMap = createCurrentPriceMap(state.stocks);
    const snapshots = cloneStockSnapshots(state.stocks);

    snapshots[0].history.push(999_900);

    expect(priceMap).toEqual({
      p1: 1_000_000,
      p2: 1_000_000,
      market: 1_000_000,
    });
    expect(state.stocks[0].history).toEqual([1_000_000]);
    expect(
      hasProjectedChartMovement(
        {
          p1: 1_000_100,
        },
        state.stocks,
      ),
    ).toBe(true);
    expect(
      hasProjectedChartMovement(
        {
          p1: 1_000_000,
        },
        state.stocks,
      ),
    ).toBe(false);
  });
});
