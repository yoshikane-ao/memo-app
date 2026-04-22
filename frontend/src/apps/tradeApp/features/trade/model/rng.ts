export interface SeededRng {
  next(): number;
  nextInt(minInclusive: number, maxExclusive: number): number;
  nextFloat(minInclusive: number, maxExclusive: number): number;
  pick<T>(items: readonly T[]): T;
  chance(probability: number): boolean;
  getCursor(): number;
  advance(): void;
}

export function createSeededRng(seed: number, initialCursor = 0): SeededRng {
  const normalizedSeed = Math.abs(Math.trunc(seed)) >>> 0 || 1;
  let cursor = Math.max(0, Math.trunc(initialCursor));

  function next(): number {
    cursor = (cursor + 1) >>> 0;
    let t = (normalizedSeed + cursor * 0x9e3779b9) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next,
    nextInt(minInclusive, maxExclusive) {
      if (maxExclusive <= minInclusive) {
        return minInclusive;
      }
      return Math.floor(next() * (maxExclusive - minInclusive)) + minInclusive;
    },
    nextFloat(minInclusive, maxExclusive) {
      return next() * (maxExclusive - minInclusive) + minInclusive;
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) {
        throw new Error('Cannot pick from an empty array.');
      }
      return items[Math.floor(next() * items.length)];
    },
    chance(probability) {
      if (probability <= 0) return false;
      if (probability >= 1) return true;
      return next() < probability;
    },
    getCursor() {
      return cursor;
    },
    advance() {
      cursor = (cursor + 1) >>> 0;
    },
  };
}

export function shuffleWithRng<T>(items: readonly T[], rng: SeededRng): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = rng.nextInt(0, i + 1);
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}

export function generateGameSeed(): number {
  const random = Math.floor(Math.random() * 0xffffffff);
  const time = Date.now() >>> 0;
  return (random ^ time) >>> 0 || 1;
}
