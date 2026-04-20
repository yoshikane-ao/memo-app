export type StockKey = 'p1' | 'p2' | 'market';
export type PlayerId = 'player1' | 'player2';

export type MarketCondition = 'bull' | 'bear' | 'sideways';

export const NO_COMPANY_ACTION = '\u306A\u3057' as const;
export const CAPITAL_INCREASE_ACTION = '\u5897\u8CC7' as const;
export const AD_CAMPAIGN_ACTION = '\u5E83\u544A' as const;
export const BUYBACK_ACTION = '\u81EA\u793E\u8CB7\u3044' as const;
export const FACILITY_INVESTMENT_ACTION = '\u8A2D\u5099\u6295\u8CC7' as const;
export const DEFAULT_MANAGEMENT_STAKE_SHARES = 30 as const;

export type CompanyAction =
  | typeof NO_COMPANY_ACTION
  | typeof CAPITAL_INCREASE_ACTION
  | typeof AD_CAMPAIGN_ACTION
  | typeof BUYBACK_ACTION
  | typeof FACILITY_INVESTMENT_ACTION;

export type CooldownAction = Exclude<CompanyAction, typeof NO_COMPANY_ACTION>;

export type TradeAction = 'buy' | 'sell';
export type TradeMode = 'investment' | 'speculation';

export type LogType = 'player' | 'cpu' | 'system' | 'market';
export type LogTone = 'up' | 'down' | 'neutral' | 'warn';

export interface HoldingPosition {
  quantity: number;
  avgPrice: number;
}

export interface SpeculationPosition {
  stockKey: StockKey;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  committedCash: number;
  settlementTurn: number;
}

export interface TradePositionEntry {
  id: string;
  stockKey: StockKey;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  entryHistoryPointId?: number;
  orderAmount: number;
  openedTurn: number;
}

export interface StockState {
  key: StockKey;
  name: string;
  basePrice: number;
  currentPrice: number;
  previousPrice: number;
  bubbleUpper: number;
  bubbleLower: number;
  history: number[];
  shortInterest: number;
  correlationNote: string;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  cash: number;
  companyFunds: number;
  managementStakeShares: number;
  startingOwnStockPrice: number;
  holdings: Record<StockKey, HoldingPosition>;
  shorts: Record<StockKey, HoldingPosition>;
  positions: TradePositionEntry[];
  speculation: SpeculationPosition[];
  cooldowns: Record<CooldownAction, number>;
  recentCashChange: number;
  recentNetChange: number;
  marketBias: number;
  lastSnapshotAssets: number;
  lastSnapshotCash: number;
}

export interface LogEntry {
  id: number;
  turn: number;
  type: LogType;
  label: string;
  message: string;
  tone: LogTone;
}

export interface GameState {
  title: string;
  turn: number;
  marketCondition: MarketCondition;
  victoryCondition: string;
  currentPlayer: PlayerId;
  initialTotalAssets: number;
  stocks: StockState[];
  players: PlayerState[];
  logs: LogEntry[];
}

export interface TurnActionPayload {
  stockKey: StockKey;
  tradeAction: TradeAction;
  tradeMode: TradeMode;
  quantity: number;
  companyAction: CompanyAction;
}

export const STOCK_KEYS: StockKey[] = ['p1', 'p2', 'market'];

export const STOCK_LABELS: Record<StockKey, string> = {
  p1: 'Player1\u4F1A\u793E',
  p2: 'Player2\u4F1A\u793E',
  market: '\u30DE\u30FC\u30B1\u30C3\u30C8',
};

export const TRADE_ACTIONS: TradeAction[] = ['buy', 'sell'];

export const TRADE_LABELS: Record<TradeAction, string> = {
  buy: '\u8CB7\u3044',
  sell: '\u58F2\u308A',
};

export const TRADE_MODES: TradeMode[] = ['investment', 'speculation'];

export const MODE_LABELS: Record<TradeMode, string> = {
  investment: '\u901A\u5E38',
  speculation: '\u77ED\u671F',
};

export const COMPANY_ACTIONS: CompanyAction[] = [
  NO_COMPANY_ACTION,
  CAPITAL_INCREASE_ACTION,
  AD_CAMPAIGN_ACTION,
  BUYBACK_ACTION,
  FACILITY_INVESTMENT_ACTION,
];

export const COOLDOWN_ACTIONS: CooldownAction[] = [
  CAPITAL_INCREASE_ACTION,
  AD_CAMPAIGN_ACTION,
  BUYBACK_ACTION,
  FACILITY_INVESTMENT_ACTION,
];

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

export type {
  DynamicPriceLines,
  PriceLineEvent,
  TradeImpactAmounts,
  TradeImpactPattern,
} from './model/tradeImpact';

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

export type { GuestLabel, PlayerIdentity, PlayerSlot } from './model/playerIdentity';

export type {
  CreateTradeProfileInput,
  RecordBattleInput,
  TradeProfile,
  TradeProfileIcon,
  TradeProfileId,
  TradeProfileStats,
  TradeProfileStyle,
  TradeProfileTheme,
} from './model/useTradeProfileStore';

export type { BattleStockHistoryRuntime } from './model/tradeBattleState';

export type { BattleSequenceRuntime } from './model/tradeBattleRuntime';

export type {
  BattleClosePreview,
  BattleResultSummary,
  ChartOrderMarker,
  PendingCloseSummary,
} from './model/tradeBattleSelectors';

export type PlayerPanelPositionRow = {
  id: string;
  targetLabel: string;
  orderAmountText: string;
  directionText: string;
  pnl: number;
  projectedPnl: number;
  projectedPnlLabel: string;
  isPendingClose: boolean;
  closeButtonLabel: string;
};

import type { TradeImpactPattern as _TradeImpactPattern } from './model/tradeImpact';
export type ActionPanelImpactPatterns = Record<StockKey, _TradeImpactPattern>;
