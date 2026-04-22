export type StockKey = 'p1' | 'p2' | 'market';
export type PlayerId = 'player1' | 'player2';

export type MarketCondition = 'bull' | 'bear' | 'sideways';

export const NO_COMPANY_ACTION = 'なし' as const;
export const CAPITAL_INCREASE_ACTION = '増資' as const;
export const AD_CAMPAIGN_ACTION = '広告' as const;
export const BUYBACK_ACTION = '自社買い' as const;
export const FACILITY_INVESTMENT_ACTION = '設備投資' as const;
export const DEFAULT_MANAGEMENT_STAKE_SHARES = 30 as const;
export const COMPANY_ACTION_INITIAL_CHARGES = 2 as const;
export const INITIAL_FEINT_TOKENS = 2 as const;

export type CompanyAction =
  | typeof NO_COMPANY_ACTION
  | typeof CAPITAL_INCREASE_ACTION
  | typeof AD_CAMPAIGN_ACTION
  | typeof BUYBACK_ACTION
  | typeof FACILITY_INVESTMENT_ACTION;

export type CooldownAction = Exclude<CompanyAction, typeof NO_COMPANY_ACTION>;

export type TradeAction = 'buy' | 'sell';
export type TradeMode = 'investment' | 'speculation';
export type OrderType = 'market' | 'forward';

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

export type CpuSentiment = 'bullish' | 'bearish' | 'neutral';

export interface CpuParticipant {
  id: string;
  sentiment: CpuSentiment;
  capital: number;
  active: boolean;
}

export interface CpuStats {
  participantCount: number;
  withdrawalCount: number;
  investmentTotal: number;
  weakParticipantCount: number;
  strongParticipantCount: number;
  p1ParticipantCount: number;
  p2ParticipantCount: number;
  p1InvestmentTotal: number;
  p2InvestmentTotal: number;
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
  cpuPool: CpuParticipant[];
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
  companyActionCharges: Record<CooldownAction, number>;
  feintTokens: number;
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

export type ForwardOrderStatus = 'pending' | 'settled' | 'canceled';

export interface ForwardOrder {
  id: string;
  playerId: PlayerId;
  stockKey: StockKey;
  tradeAction: TradeAction;
  tradeMode: TradeMode;
  orderAmount: number;
  reservationFee: number;
  placedTurn: number;
  triggerTurn: number;
  status: ForwardOrderStatus;
}

export type EventEffectKind =
  | 'market_boom'
  | 'market_crash'
  | 'cpu_withdrawal_spike'
  | 'cpu_participation_surge'
  | 'short_squeeze'
  | 'dividend_leak'
  | 'speculation_delay';

export interface EventCard {
  id: string;
  title: string;
  description: string;
  effect: EventEffectKind;
  targetStockKey?: StockKey;
}

export type RevealedEventStatus = 'revealed' | 'fired' | 'expired';

export interface RevealedEvent {
  card: EventCard;
  revealedTurn: number;
  triggerTurn: number;
  status: RevealedEventStatus;
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
  rngSeed: number;
  rngCursor: number;
  forwardOrders: ForwardOrder[];
  eventDeck: EventCard[];
  revealedEvents: RevealedEvent[];
  speculationDelayActive: boolean;
}

export interface TurnActionPayload {
  stockKey: StockKey;
  tradeAction: TradeAction;
  tradeMode: TradeMode;
  quantity: number;
  companyAction: CompanyAction;
  orderType?: OrderType;
}

export const STOCK_KEYS: StockKey[] = ['p1', 'p2', 'market'];

export const STOCK_LABELS: Record<StockKey, string> = {
  p1: 'Player1会社',
  p2: 'Player2会社',
  market: 'マーケット',
};

export const TRADE_ACTIONS: TradeAction[] = ['buy', 'sell'];

export const TRADE_LABELS: Record<TradeAction, string> = {
  buy: '買い',
  sell: '売り',
};

export const TRADE_MODES: TradeMode[] = ['investment', 'speculation'];

export const MODE_LABELS: Record<TradeMode, string> = {
  investment: '通常',
  speculation: '短期',
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
