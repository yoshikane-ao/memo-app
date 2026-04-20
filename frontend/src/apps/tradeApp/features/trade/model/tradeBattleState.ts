import {
  COOLDOWN_ACTIONS,
  DEFAULT_MANAGEMENT_STAKE_SHARES,
  STOCK_KEYS,
  type GameState,
  type HoldingPosition,
  type PlayerId,
  type PlayerState,
  type StockKey,
  type StockState,
} from '../types';
import {
  DEFAULT_MARKET_STOCK_STARTING_PRICE,
  DEFAULT_PLAYER_STOCK_STARTING_PRICE,
  type GameStartSettings,
} from './tradeSetup';
import {
  isBattleTurnComplete,
  resolveNextBattlePlayer,
  resolveTurnLeadPlayer,
} from './tradeBattle';

export const DEFAULT_STARTING_CASH = 100000;
export const STARTING_COMPANY_FUNDS = 3000;
export const MAX_BATTLE_TURNS = 10;
const INITIAL_LOG_SEQUENCE = 1000;
const INITIAL_POSITION_SEQUENCE = 0;

export type BattleStockHistoryRuntime = {
  pointCounters: Record<StockKey, number>;
  pointIds: Record<StockKey, number[]>;
};

export function createEmptyBook(): Record<StockKey, HoldingPosition> {
  return {
    p1: { quantity: 0, avgPrice: 0 },
    p2: { quantity: 0, avgPrice: 0 },
    market: { quantity: 0, avgPrice: 0 },
  };
}

export function resetBook(book: Record<StockKey, HoldingPosition>): void {
  for (const key of STOCK_KEYS) {
    book[key].quantity = 0;
    book[key].avgPrice = 0;
  }
}

export function normalizePositionUnits(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.round(value * 10000) / 10000;
}

export function formatPositionUnits(value: number): string {
  const normalized = normalizePositionUnits(value);
  return normalized.toLocaleString('ja-JP', {
    minimumFractionDigits: normalized % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function resolveOwnStockKey(playerId: PlayerId): StockKey {
  return playerId === 'player1' ? 'p1' : 'p2';
}

export function findPlayerById(state: Pick<GameState, 'players'>, playerId: PlayerId): PlayerState {
  const player = state.players.find((item) => item.id === playerId);
  if (!player) {
    throw new Error(`Player not found: ${playerId}`);
  }

  return player;
}

export function findStockByKey(state: Pick<GameState, 'stocks'>, stockKey: StockKey): StockState {
  const stock = state.stocks.find((item) => item.key === stockKey);
  if (!stock) {
    throw new Error(`Stock not found: ${stockKey}`);
  }

  return stock;
}

export function syncPlayerBooksFromPositions(player: PlayerState): void {
  const holdings = createEmptyBook();
  const shorts = createEmptyBook();

  player.positions.forEach((position) => {
    const book = position.side === 'buy' ? holdings : shorts;
    const slot = book[position.stockKey];
    const nextQuantity = normalizePositionUnits(slot.quantity + position.quantity);
    const totalCost = slot.avgPrice * slot.quantity + position.entryPrice * position.quantity;

    slot.quantity = nextQuantity;
    slot.avgPrice = nextQuantity > 0 ? totalCost / nextQuantity : 0;
  });

  for (const key of STOCK_KEYS) {
    player.holdings[key].quantity = holdings[key].quantity;
    player.holdings[key].avgPrice = holdings[key].avgPrice;
    player.shorts[key].quantity = shorts[key].quantity;
    player.shorts[key].avgPrice = shorts[key].avgPrice;
  }
}

function resolveStartingPrice(
  stockKey: StockKey,
  settings: GameStartSettings | null | undefined,
): number {
  if (stockKey === 'market') {
    return settings?.marketStartingPrice ?? DEFAULT_MARKET_STOCK_STARTING_PRICE;
  }

  return DEFAULT_PLAYER_STOCK_STARTING_PRICE;
}

function calculateCurrentTotalAssets(state: Pick<GameState, 'players'>): number {
  return state.players.reduce((total, player) => total + player.cash, 0);
}

export function initializeBattleState(
  state: GameState,
  options: {
    settings?: GameStartSettings | null;
    stockHistory: BattleStockHistoryRuntime;
  },
): {
  isGameOver: boolean;
  logSequence: number;
  positionSequence: number;
} {
  const settings = options.settings;
  const player1 = findPlayerById(state, 'player1');
  const player2 = findPlayerById(state, 'player2');

  player1.name = settings?.player1Name ?? 'PLAYER 1';
  player2.name = settings?.player2Name ?? 'PLAYER 2';

  state.turn = 1;
  state.currentPlayer = resolveTurnLeadPlayer(state.turn);
  state.logs = [];

  state.stocks.forEach((stock) => {
    const startingPrice = resolveStartingPrice(stock.key, settings);
    stock.basePrice = startingPrice;
    stock.currentPrice = startingPrice;
    stock.previousPrice = startingPrice;
    stock.bubbleUpper = 0;
    stock.bubbleLower = 0;
    stock.history = [startingPrice];
    stock.shortInterest = 0;
    options.stockHistory.pointCounters[stock.key] = 1;
    options.stockHistory.pointIds[stock.key] = [1];
  });

  state.players.forEach((player) => {
    const startingCash =
      player.id === 'player1'
        ? (settings?.player1StartingCash ?? DEFAULT_STARTING_CASH)
        : (settings?.player2StartingCash ?? DEFAULT_STARTING_CASH);

    player.cash = startingCash;
    player.companyFunds = STARTING_COMPANY_FUNDS;
    player.managementStakeShares = DEFAULT_MANAGEMENT_STAKE_SHARES;
    player.startingOwnStockPrice = findStockByKey(
      state,
      resolveOwnStockKey(player.id),
    ).currentPrice;
    player.positions = [];
    player.speculation = [];
    player.marketBias = 0;
    player.recentNetChange = 0;
    player.recentCashChange = 0;

    resetBook(player.holdings);
    resetBook(player.shorts);

    COOLDOWN_ACTIONS.forEach((action) => {
      player.cooldowns[action] = 0;
    });

    player.lastSnapshotAssets = player.cash;
    player.lastSnapshotCash = player.cash;
  });

  state.initialTotalAssets = Math.max(1, calculateCurrentTotalAssets(state));

  return {
    isGameOver: false,
    logSequence: INITIAL_LOG_SEQUENCE,
    positionSequence: INITIAL_POSITION_SEQUENCE,
  };
}

export function reducePlayerCooldowns(player: PlayerState): void {
  COOLDOWN_ACTIONS.forEach((action) => {
    player.cooldowns[action] = Math.max(0, player.cooldowns[action] - 1);
  });
}

export function advanceBattleTurnState(
  state: Pick<GameState, 'turn' | 'currentPlayer' | 'marketCondition'>,
  maxTurns = MAX_BATTLE_TURNS,
): {
  didAdvance: boolean;
  isGameOver: boolean;
} {
  const completedTurn = isBattleTurnComplete(state.currentPlayer, state.turn);
  const nextPlayer = resolveNextBattlePlayer(state.currentPlayer, state.turn);

  if (!completedTurn) {
    state.currentPlayer = nextPlayer;
    return {
      didAdvance: true,
      isGameOver: false,
    };
  }

  if (state.turn >= maxTurns) {
    return {
      didAdvance: false,
      isGameOver: true,
    };
  }

  state.turn += 1;
  state.currentPlayer = nextPlayer;

  if (state.turn % 4 === 0) {
    state.marketCondition =
      state.marketCondition === 'bull'
        ? 'sideways'
        : state.marketCondition === 'sideways'
          ? 'bear'
          : 'bull';
  }

  return {
    didAdvance: true,
    isGameOver: false,
  };
}
