import { describe, expect, it } from 'vitest';

import { createSeededRng, shuffleWithRng } from './rng';

describe('createSeededRng', () => {
  it('produces the same sequence for the same seed and cursor', () => {
    const a = createSeededRng(42, 0);
    const b = createSeededRng(42, 0);
    const aValues = Array.from({ length: 8 }, () => a.next());
    const bValues = Array.from({ length: 8 }, () => b.next());
    expect(aValues).toEqual(bValues);
  });

  it('advances cursor deterministically and allows restart from a saved cursor', () => {
    const a = createSeededRng(7, 0);
    a.next();
    a.next();
    const cursor = a.getCursor();
    const tail = [a.next(), a.next()];

    const b = createSeededRng(7, cursor);
    const bTail = [b.next(), b.next()];
    expect(tail).toEqual(bTail);
  });

  it('nextInt returns within [min, max)', () => {
    const rng = createSeededRng(1);
    for (let i = 0; i < 100; i += 1) {
      const value = rng.nextInt(5, 10);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThan(10);
    }
  });

  it('chance handles edge probabilities correctly', () => {
    const rng = createSeededRng(123);
    expect(rng.chance(0)).toBe(false);
    expect(rng.chance(1)).toBe(true);
  });
});

describe('shuffleWithRng', () => {
  it('produces the same ordering for the same seed', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const a = shuffleWithRng(items, createSeededRng(99));
    const b = shuffleWithRng(items, createSeededRng(99));
    expect(a).toEqual(b);
  });
});
