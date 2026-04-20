export type {
  CompanyAction,
  CooldownAction,
  GameState,
  GuestLabel,
  HoldingPosition,
  LogEntry,
  LogTone,
  LogType,
  MarketCondition,
  PlayerId,
  PlayerState,
  SpeculationPosition,
  StockKey,
  StockState,
  TradeAction,
  TradeMode,
  TradePositionEntry,
  TurnActionPayload,
} from './types';
export {
  AD_CAMPAIGN_ACTION,
  BUYBACK_ACTION,
  CAPITAL_INCREASE_ACTION,
  COMPANY_ACTIONS,
  COOLDOWN_ACTIONS,
  DEFAULT_MANAGEMENT_STAKE_SHARES,
  FACILITY_INVESTMENT_ACTION,
  MODE_LABELS,
  NO_COMPANY_ACTION,
  STOCK_KEYS,
  STOCK_LABELS,
  TRADE_ACTIONS,
  TRADE_LABELS,
  TRADE_MODES,
} from './types';

export type { PlayerIdentity, PlayerSlot } from './model/playerIdentity';
export { createCpuIdentity, createGuestIdentity } from './model/playerIdentity';

export type { PlayerSnapshot } from './model/gameCalculations';
export {
  calculateManagementEvaluation,
  calculatePlayerSnapshot,
  calculatePlayerVictoryValue,
  calculateTradePositionCloseImpactAmount,
  calculateTradePositionPnL,
  calculateTradePositionSettlementCash,
  describeDelta,
  formatCurrency,
  formatSignedCurrency,
  formatSignedNumber,
  getPriceMap,
} from './model/gameCalculations';

export type {
  BattleActionDraft,
  BattleActionKind,
  BattleActionPreview,
  BattleActionProjection,
  BattleConfirmedAction,
  BattleStockChoice,
  PreviewSummaryItem,
  StockImpactItem,
  StockImpactLevel,
} from './model/tradeBattle';
export {
  buildBattleActionProjection,
  buildBattleConfirmedAction,
  createDefaultBattleActionDraft,
  isBattleTurnComplete,
  resolveEffectiveTradeAction,
  resolveNextBattlePlayer,
  resolveTurnLeadPlayer,
} from './model/tradeBattle';

export type {
  DynamicPriceLines,
  PriceLineEvent,
  TradeImpactAmounts,
  TradeImpactPattern,
} from './model/tradeImpact';
export {
  MIN_STOCK_PRICE,
  MIN_TRADE_ORDER_AMOUNT,
  PRICE_STEP_RATIO,
  STOCK_PRICE_TICK,
  calculateDynamicPriceLines,
  calculateTradeImpactAmounts,
  calculateTradePriceImpact,
  ceilToStockPriceTick,
  floorToStockPriceTick,
  isPositiveTradeAction,
  normalizeStockPriceDelta,
  resolvePriceAfterDelta,
  resolvePriceStep,
  resolveTradeImpactPattern,
  roundToStockPriceTick,
} from './model/tradeImpact';

export type { BattleStockHistoryRuntime } from './model/tradeBattleState';
export {
  DEFAULT_STARTING_CASH,
  MAX_BATTLE_TURNS,
  STARTING_COMPANY_FUNDS,
  advanceBattleTurnState,
  createEmptyBook,
  findPlayerById,
  findStockByKey,
  formatPositionUnits,
  initializeBattleState,
  normalizePositionUnits,
  reducePlayerCooldowns,
  resetBook,
  resolveOwnStockKey,
  syncPlayerBooksFromPositions,
} from './model/tradeBattleState';

export type { BattleSequenceRuntime } from './model/tradeBattleRuntime';
export { createTradeBattleRuntime } from './model/tradeBattleRuntime';

export type {
  BattleClosePreview,
  BattleResultSummary,
  ChartOrderMarker,
  PendingCloseSummary,
} from './model/tradeBattleSelectors';
export {
  buildActivePositionMarkers,
  buildBattleResult,
  buildPendingClosePreview,
  buildPendingCloseSummary,
  buildProjectedBoardPrices,
  cloneStockSnapshots,
  createCurrentPriceMap,
  hasProjectedChartMovement,
} from './model/tradeBattleSelectors';

export type {
  BattleMode,
  FirstPlayer,
  GameStartSettings,
  MarketStartingPriceMode,
  ResolvedFirstPlayer,
  StartingCashMode,
  TradeSessionSnapshot,
  TradeSetupDraft,
  TradeStartViewModel,
} from './model/tradeSetup';
export {
  DEFAULT_MARKET_STOCK_STARTING_PRICE,
  DEFAULT_PLAYER_STOCK_STARTING_PRICE,
  RANDOM_MARKET_STOCK_MAX,
  RANDOM_MARKET_STOCK_MIN,
  buildTradeSessionSnapshot,
  buildTradeStartViewModel,
  createDefaultTradeSetupDraft,
  normalizeCash,
  normalizeCpuCount,
  normalizeMarketStartingPrice,
  normalizeNonNegativeInt,
  resolveSetupProfile,
  syncIdentitiesForBattleMode,
} from './model/tradeSetup';

export { createInitialGameState } from './infrastructure/mockGame';

export { default as TradeBattleContainer } from './containers/TradeBattleContainer.vue';
export { default as TradeStartContainer } from './containers/TradeStartContainer.vue';
