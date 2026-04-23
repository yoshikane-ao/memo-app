import { describe, expect, it } from 'vitest';
import type { PlayerState, StockState } from '../types';
import {
  AD_CAMPAIGN_ACTION,
  BUYBACK_ACTION,
  CAPITAL_INCREASE_ACTION,
  FACILITY_INVESTMENT_ACTION,
} from '../types';
import {
  calculateManagementEvaluation,
  calculateTradePositionCloseImpactAmount,
  calculatePlayerSnapshot,
  calculatePlayerVictoryValue,
  calculateTradePositionPnL,
  calculateTradePositionSettlementCash,
} from './gameCalculations';

function createStocks(): StockState[] {
  return [
    {
      key: 'p1',
      name: 'プレイヤー1レート',
      basePrice: 100,
      currentPrice: 100,
      previousPrice: 100,
      bubbleUpper: 180,
      bubbleLower: 60,
      history: [100],
      shortInterest: 0,
      correlationNote: '',
      cpuPool: [],
    },
    {
      key: 'p2',
      name: 'プレイヤー2レート',
      basePrice: 90,
      currentPrice: 90,
      previousPrice: 90,
      bubbleUpper: 170,
      bubbleLower: 55,
      history: [90],
      shortInterest: 0,
      correlationNote: '',
      cpuPool: [],
    },
    {
      key: 'market',
      name: 'マーケット',
      basePrice: 80,
      currentPrice: 80,
      previousPrice: 80,
      bubbleUpper: 160,
      bubbleLower: 50,
      history: [80],
      shortInterest: 0,
      correlationNote: '',
      cpuPool: [],
    },
  ];
}

function createPlayer(): PlayerState {
  return {
    id: 'player1',
    name: 'プレイヤー1',
    cash: 12000,
    companyFunds: 3000,
    managementStakeShares: 30,
    startingOwnStockPrice: 100,
    holdings: {
      p1: { quantity: 0, avgPrice: 0 },
      p2: { quantity: 0, avgPrice: 0 },
      market: { quantity: 0, avgPrice: 0 },
    },
    shorts: {
      p1: { quantity: 0, avgPrice: 0 },
      p2: { quantity: 0, avgPrice: 0 },
      market: { quantity: 0, avgPrice: 0 },
    },
    positions: [],
    speculation: [],
    companyActionCharges: {
      [CAPITAL_INCREASE_ACTION]: 2,
      [AD_CAMPAIGN_ACTION]: 2,
      [BUYBACK_ACTION]: 2,
      [FACILITY_INVESTMENT_ACTION]: 2,
    },
    feintTokens: 2,
    recentCashChange: 0,
    recentNetChange: 0,
    marketBias: 0,
    lastSnapshotAssets: 0,
    lastSnapshotCash: 12000,
  };
}

describe('calculatePlayerSnapshot', () => {
  it('matches the initial cash at battle start when holdings and valuation are flat', () => {
    const stocks = createStocks();
    const player = createPlayer();

    const snapshot = calculatePlayerSnapshot(player, stocks);

    expect(snapshot.managementEvaluation).toBe(0);
    expect(snapshot.totalAssets).toBe(12000);
  });

  it('adds holdings, open pnl, and management valuation without counting company funds', () => {
    const stocks = createStocks();
    stocks[0].currentPrice = 112;
    stocks[1].currentPrice = 95;
    stocks[2].currentPrice = 70;

    const player = createPlayer();
    player.companyFunds = 50000;
    player.holdings.market = { quantity: 10, avgPrice: 60 };
    player.shorts.p2 = { quantity: 5, avgPrice: 100 };
    player.speculation = [
      {
        stockKey: 'p2',
        side: 'buy',
        quantity: 4,
        entryPrice: 90,
        committedCash: 360,
        settlementTurn: 3,
      },
    ];

    const managementEvaluation = calculateManagementEvaluation(player, stocks);
    const snapshot = calculatePlayerSnapshot(player, stocks);

    expect(managementEvaluation).toBe((112 - 100) * 30);
    expect(snapshot.longValue).toBe(700);
    expect(snapshot.shortCollateralValue).toBe(500);
    expect(snapshot.shortPnL).toBe(25);
    expect(snapshot.speculationCommittedCash).toBe(360);
    expect(snapshot.speculationPnL).toBe(20);
    expect(snapshot.totalAssets).toBe(12000 + 700 + 500 + 360 + 25 + 20 + managementEvaluation);
  });

  it('treats position pnl as order-based price difference for buy positions', () => {
    const pnl = calculateTradePositionPnL(
      {
        side: 'buy',
        entryPrice: 20000,
        orderAmount: 10000,
      },
      10000,
    );
    const settlement = calculateTradePositionSettlementCash(
      {
        side: 'buy',
        entryPrice: 20000,
        orderAmount: 10000,
      },
      10000,
    );

    expect(pnl).toBe(-10000);
    expect(settlement).toBe(0);
  });

  it('keeps a same-price sell position at zero pnl and returns the committed cash', () => {
    const pnl = calculateTradePositionPnL(
      {
        side: 'sell',
        entryPrice: 10000,
        orderAmount: 10000,
      },
      10000,
    );
    const settlement = calculateTradePositionSettlementCash(
      {
        side: 'sell',
        entryPrice: 10000,
        orderAmount: 10000,
      },
      10000,
    );

    expect(pnl).toBe(0);
    expect(settlement).toBe(10000);
  });

  it('uses cash plus own-rate market value for the victory value', () => {
    const stocks = createStocks();
    stocks[0].currentPrice = 112;
    const player = createPlayer();

    expect(calculatePlayerVictoryValue(player, stocks)).toBe(12000 + 112);
  });

  it('allows settlement cash to go negative when a losing position is closed deeply underwater', () => {
    const pnl = calculateTradePositionPnL(
      {
        side: 'buy',
        entryPrice: 20000,
        orderAmount: 10000,
      },
      0,
    );
    const settlement = calculateTradePositionSettlementCash(
      {
        side: 'buy',
        entryPrice: 20000,
        orderAmount: 10000,
      },
      0,
    );

    expect(pnl).toBe(-20000);
    expect(settlement).toBe(-10000);
  });

  it('uses the absolute realized pnl as the close impact amount', () => {
    expect(
      calculateTradePositionCloseImpactAmount(
        {
          side: 'buy',
          entryPrice: 1000,
          orderAmount: 1000,
        },
        101000,
      ),
    ).toBe(100000);

    expect(
      calculateTradePositionCloseImpactAmount(
        {
          side: 'sell',
          entryPrice: 1000,
          orderAmount: 1000,
        },
        21000,
      ),
    ).toBe(20000);
  });
});
