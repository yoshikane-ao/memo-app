import type { CpuParticipant, CpuSentiment, StockKey } from '../types';
import type { SeededRng } from './rng';

export const INITIAL_CPU_COUNT_PER_STOCK = 12;
export const CPU_CAPITAL_MIN = 2000;
export const CPU_CAPITAL_MAX = 8000;

const SENTIMENT_ORDER: CpuSentiment[] = ['bullish', 'bearish', 'neutral'];

export function createCpuPool(
  stockKey: StockKey,
  rng: SeededRng,
  count = INITIAL_CPU_COUNT_PER_STOCK,
): CpuParticipant[] {
  const pool: CpuParticipant[] = [];
  for (let i = 0; i < count; i += 1) {
    const sentiment = rng.pick(SENTIMENT_ORDER);
    const capital = rng.nextInt(CPU_CAPITAL_MIN, CPU_CAPITAL_MAX);
    pool.push({
      id: `cpu-${stockKey}-${i + 1}`,
      sentiment,
      capital,
      active: rng.chance(0.6),
    });
  }
  return pool;
}

export function countActive(pool: CpuParticipant[]): number {
  return pool.reduce((acc, cpu) => (cpu.active ? acc + 1 : acc), 0);
}

export function countWithdrawn(pool: CpuParticipant[]): number {
  return pool.length - countActive(pool);
}

export function countBySentiment(pool: CpuParticipant[], sentiment: CpuSentiment): number {
  return pool.reduce((acc, cpu) => (cpu.active && cpu.sentiment === sentiment ? acc + 1 : acc), 0);
}

export function sumActiveCapital(pool: CpuParticipant[]): number {
  return pool.reduce((acc, cpu) => (cpu.active ? acc + cpu.capital : acc), 0);
}
