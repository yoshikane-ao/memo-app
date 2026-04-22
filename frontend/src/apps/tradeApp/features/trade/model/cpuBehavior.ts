import type {
  CpuParticipant,
  CpuSentiment,
  LogEntry,
  PlayerId,
  StockKey,
  StockState,
  TradeAction,
} from '../types';
import type { SeededRng } from './rng';

export type CpuReactionPushLog = (
  logs: LogEntry[],
  label: string,
  message: string,
  tone: LogEntry['tone'],
) => void;

export interface CpuReactionContext {
  rng: SeededRng;
  stocks: StockState[];
  logs: LogEntry[];
  pushLog: CpuReactionPushLog;
  applyPriceMove: (stockKey: StockKey, rawDelta: number) => number;
}

export interface CpuReactionRange {
  lowerDelta: number;
  centerDelta: number;
  upperDelta: number;
}

interface CpuReactionOutcome {
  deltaByStock: Record<StockKey, number>;
  participationChange: { stockKey: StockKey; delta: number }[];
  sentimentShift: { stockKey: StockKey; from: CpuSentiment; to: CpuSentiment; count: number }[];
}

const STOCK_KEY_LABELS: Record<StockKey, string> = {
  p1: 'Player1',
  p2: 'Player2',
  market: 'マーケット',
};

function withAllKeys(initial: number): Record<StockKey, number> {
  return { p1: initial, p2: initial, market: initial };
}

function shouldActivateMore(action: TradeAction, sentiment: CpuSentiment): boolean {
  if (sentiment === 'bullish') return action === 'buy';
  if (sentiment === 'bearish') return action === 'sell';
  return false;
}

function shouldWithdraw(action: TradeAction, sentiment: CpuSentiment): boolean {
  if (sentiment === 'bullish') return action === 'sell';
  if (sentiment === 'bearish') return action === 'buy';
  return false;
}

function pickInactiveCpu(
  pool: CpuParticipant[],
  rng: SeededRng,
  matcher?: (cpu: CpuParticipant) => boolean,
): CpuParticipant | null {
  const candidates = pool.filter((cpu) => !cpu.active && (matcher ? matcher(cpu) : true));
  if (candidates.length === 0) return null;
  return rng.pick(candidates);
}

function pickActiveCpu(
  pool: CpuParticipant[],
  rng: SeededRng,
  matcher?: (cpu: CpuParticipant) => boolean,
): CpuParticipant | null {
  const candidates = pool.filter((cpu) => cpu.active && (matcher ? matcher(cpu) : true));
  if (candidates.length === 0) return null;
  return rng.pick(candidates);
}

function tradeDirection(action: TradeAction): 1 | -1 {
  return action === 'buy' ? 1 : -1;
}

export function simulateCpuReactions(params: {
  ctx: CpuReactionContext;
  actingPlayerId: PlayerId;
  actingStockKey: StockKey;
  action: TradeAction;
  executedAmount: number;
}): CpuReactionOutcome {
  const { ctx, actingPlayerId, actingStockKey, action, executedAmount } = params;
  const { rng, stocks, pushLog, applyPriceMove, logs } = ctx;
  const direction = tradeDirection(action);
  const outcome: CpuReactionOutcome = {
    deltaByStock: withAllKeys(0),
    participationChange: [],
    sentimentShift: [],
  };

  const actingStock = stocks.find((stock) => stock.key === actingStockKey);
  if (!actingStock) {
    return outcome;
  }

  const intensityRaw = Math.min(1, Math.max(0, executedAmount / 30000));
  const jitter = rng.nextFloat(0.6, 1.4);
  const reactionsCount = Math.max(1, Math.round(intensityRaw * 4 * jitter + rng.nextFloat(0, 1.2)));

  let totalDelta = 0;

  for (let i = 0; i < reactionsCount; i += 1) {
    const candidate = rng.next();
    const pool = actingStock.cpuPool;

    if (candidate < 0.42) {
      const activated = pickInactiveCpu(pool, rng, (cpu) =>
        shouldActivateMore(action, cpu.sentiment),
      );
      if (activated) {
        activated.active = true;
        outcome.participationChange.push({ stockKey: actingStockKey, delta: 1 });
        const capitalImpact = Math.round(activated.capital * 0.05 * direction);
        totalDelta += capitalImpact;
      }
    } else if (candidate < 0.62) {
      const inverter = pickInactiveCpu(pool, rng, (cpu) => shouldWithdraw(action, cpu.sentiment));
      if (inverter) {
        inverter.active = true;
        outcome.participationChange.push({ stockKey: actingStockKey, delta: 1 });
        const contrarianImpact = Math.round(inverter.capital * 0.03 * -direction);
        totalDelta += contrarianImpact;
      }
    } else if (candidate < 0.78) {
      const retreating = pickActiveCpu(pool, rng, (cpu) => shouldWithdraw(action, cpu.sentiment));
      if (retreating) {
        retreating.active = false;
        outcome.participationChange.push({ stockKey: actingStockKey, delta: -1 });
        const releaseImpact = Math.round(retreating.capital * 0.02 * -direction);
        totalDelta += releaseImpact;
      }
    } else if (candidate < 0.92) {
      const follower = pickActiveCpu(pool, rng, (cpu) => shouldActivateMore(action, cpu.sentiment));
      if (follower) {
        const additionalImpact = Math.round(follower.capital * 0.04 * direction);
        totalDelta += additionalImpact;
      }
    }
  }

  if (totalDelta !== 0) {
    const appliedDelta = applyPriceMove(actingStockKey, totalDelta);
    outcome.deltaByStock[actingStockKey] = appliedDelta;
    const verb = appliedDelta > 0 ? '押し上げ' : '押し下げ';
    const activeAfter = pool2Active(actingStock.cpuPool);
    pushLog(
      logs,
      'CPU反応',
      `${STOCK_KEY_LABELS[actingStockKey]} 銘柄に参加者 ${activeAfter}人、値を${verb}ました。`,
      appliedDelta > 0 ? 'up' : appliedDelta < 0 ? 'down' : 'neutral',
    );
  }

  void actingPlayerId;
  return outcome;
}

function pool2Active(pool: CpuParticipant[]): number {
  return pool.reduce((acc, cpu) => (cpu.active ? acc + 1 : acc), 0);
}

export function estimateCpuReactionRange(params: {
  actingStock: StockState;
  action: TradeAction;
  executedAmount: number;
}): CpuReactionRange {
  const { actingStock, action, executedAmount } = params;
  const direction = tradeDirection(action);
  const pool = actingStock.cpuPool;

  const bullishActive = pool.filter((cpu) => cpu.active && cpu.sentiment === 'bullish').length;
  const bearishActive = pool.filter((cpu) => cpu.active && cpu.sentiment === 'bearish').length;
  const neutralActive = pool.filter((cpu) => cpu.active && cpu.sentiment === 'neutral').length;
  const activeCount = bullishActive + bearishActive + neutralActive;

  const alignment =
    action === 'buy' ? bullishActive - bearishActive : bearishActive - bullishActive;

  const intensity = Math.min(1, Math.max(0, executedAmount / 30000));
  const baseMagnitude = 60 + intensity * 240;
  const alignmentBoost = alignment * 40;
  const neutralWash = neutralActive * 10;

  const center = direction * Math.round(baseMagnitude + alignmentBoost);
  const spread = Math.round(neutralWash + intensity * 180 + activeCount * 8);

  return {
    lowerDelta: center - spread,
    centerDelta: center,
    upperDelta: center + spread,
  };
}

export type CompanyCpuInfluence =
  | { kind: 'participation_boost'; count: number; biasTowards: CpuSentiment }
  | { kind: 'withdrawal_recall'; count: number }
  | { kind: 'sentiment_shift'; from: CpuSentiment; to: CpuSentiment; count: number };

export function applyCompanyCpuInfluence(params: {
  pool: CpuParticipant[];
  influence: CompanyCpuInfluence;
  rng: SeededRng;
}): { activatedCount: number; withdrawnRecovered: number; shifted: number } {
  const { pool, influence, rng } = params;

  if (influence.kind === 'participation_boost') {
    let activated = 0;
    for (let i = 0; i < influence.count; i += 1) {
      const target = pickInactiveCpu(pool, rng);
      if (!target) break;
      target.active = true;
      if (rng.chance(0.6)) {
        target.sentiment = influence.biasTowards;
      }
      activated += 1;
    }
    return { activatedCount: activated, withdrawnRecovered: 0, shifted: 0 };
  }

  if (influence.kind === 'withdrawal_recall') {
    let recalled = 0;
    for (let i = 0; i < influence.count; i += 1) {
      const target = pickInactiveCpu(pool, rng);
      if (!target) break;
      target.active = true;
      recalled += 1;
    }
    return { activatedCount: 0, withdrawnRecovered: recalled, shifted: 0 };
  }

  let shifted = 0;
  for (let i = 0; i < influence.count; i += 1) {
    const target = pickActiveCpu(pool, rng, (cpu) => cpu.sentiment === influence.from);
    if (!target) break;
    target.sentiment = influence.to;
    shifted += 1;
  }
  return { activatedCount: 0, withdrawnRecovered: 0, shifted };
}
