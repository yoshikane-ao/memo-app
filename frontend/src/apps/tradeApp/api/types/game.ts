export type StockKey = 'p1' | 'p2' | 'market'
export type PlayerId = 'player1' | 'player2'

export type MarketCondition = 'bull' | 'bear' | 'sideways'

export type CompanyAction = 'なし' | '増資' | '配当' | '自社株買い' | '設備投資'
export type CooldownAction = Exclude<CompanyAction, 'なし'>

export type TradeAction = 'buy' | 'sell' | 'short' | 'cover'
export type TradeMode = 'investment' | 'speculation'

export type LogType = 'player' | 'cpu' | 'system' | 'market'
export type LogTone = 'up' | 'down' | 'neutral' | 'warn'

export interface HoldingPosition {
  quantity: number
  avgPrice: number
}

export interface SpeculationPosition {
  stockKey: StockKey
  side: 'buy' | 'short'
  quantity: number
  entryPrice: number
  settlementTurn: number
}

export interface StockState {
  key: StockKey
  name: string
  currentPrice: number
  previousPrice: number
  bubbleUpper: number
  bubbleLower: number
  history: number[]
  shortInterest: number
  correlationNote: string
}

export interface PlayerState {
  id: PlayerId
  name: string
  cash: number
  companyFunds: number
  holdings: Record<StockKey, HoldingPosition>
  shorts: Record<StockKey, HoldingPosition>
  speculation: SpeculationPosition[]
  cooldowns: Record<CooldownAction, number>
  recentCashChange: number
  recentNetChange: number
  marketBias: number
  lastSnapshotAssets: number
  lastSnapshotCash: number
}

export interface LogEntry {
  id: number
  turn: number
  type: LogType
  label: string
  message: string
  tone: LogTone
}

export interface GameState {
  title: string
  turn: number
  marketCondition: MarketCondition
  victoryCondition: string
  currentPlayer: PlayerId
  stocks: StockState[]
  players: PlayerState[]
  logs: LogEntry[]
}

export interface TurnActionPayload {
  stockKey: StockKey
  tradeAction: TradeAction
  tradeMode: TradeMode
  quantity: number
  companyAction: CompanyAction
}

export const STOCK_KEYS: StockKey[] = ['p1', 'p2', 'market']

export const STOCK_LABELS: Record<StockKey, string> = {
  p1: 'プレイヤー1会社株',
  p2: 'プレイヤー2会社株',
  market: '市場株',
}

export const TRADE_ACTIONS: TradeAction[] = ['buy', 'sell', 'short', 'cover']

export const TRADE_LABELS: Record<TradeAction, string> = {
  buy: '買う',
  sell: '売る',
  short: '空売り',
  cover: '買い戻し',
}

export const TRADE_MODES: TradeMode[] = ['investment', 'speculation']

export const MODE_LABELS: Record<TradeMode, string> = {
  investment: '投資',
  speculation: '投機',
}

export const COMPANY_ACTIONS: CompanyAction[] = [
  'なし',
  '増資',
  '配当',
  '自社株買い',
  '設備投資',
]

export const COOLDOWN_ACTIONS: CooldownAction[] = [
  '増資',
  '配当',
  '自社株買い',
  '設備投資',
]