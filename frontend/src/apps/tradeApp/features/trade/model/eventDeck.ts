import type { EventCard, StockKey } from '../types';
import { shuffleWithRng, type SeededRng } from './rng';

export const EVENT_REVEAL_TURNS = [3, 6, 9] as const;
export const EVENT_LEAD_TIME = 2;

const BASE_EVENT_DECK: EventCard[] = [
  {
    id: 'event-market-boom',
    title: 'マーケット急騰',
    description: '2T後、マーケット銘柄に強い上昇圧力。',
    effect: 'market_boom',
    targetStockKey: 'market',
  },
  {
    id: 'event-market-crash',
    title: 'マーケット急落',
    description: '2T後、マーケット銘柄に売り圧力。',
    effect: 'market_crash',
    targetStockKey: 'market',
  },
  {
    id: 'event-cpu-withdrawal',
    title: 'CPU撤退の連鎖',
    description: '2T後、活動中CPUの撤退率が跳ね上がります。',
    effect: 'cpu_withdrawal_spike',
  },
  {
    id: 'event-cpu-surge',
    title: '個人投資家の参入',
    description: '2T後、撤退していたCPUが一斉に参入します。',
    effect: 'cpu_participation_surge',
  },
  {
    id: 'event-short-squeeze',
    title: 'ショートスクイーズ',
    description: '2T後、売り建玉の多い銘柄が急騰します。',
    effect: 'short_squeeze',
  },
  {
    id: 'event-speculation-delay',
    title: '短期決済遅延',
    description: '2T後、そのターンの短期ポジション決済が1T遅延します。',
    effect: 'speculation_delay',
  },
];

export function buildEventDeck(rng: SeededRng): EventCard[] {
  return shuffleWithRng(BASE_EVENT_DECK, rng);
}

export function selectEventsToRevealForTurn(turn: number): number {
  const index = EVENT_REVEAL_TURNS.indexOf(turn as (typeof EVENT_REVEAL_TURNS)[number]);
  return index;
}

export function resolveShortSqueezeTarget(shortInterestMap: Record<StockKey, number>): StockKey {
  const entries = Object.entries(shortInterestMap) as [StockKey, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}
