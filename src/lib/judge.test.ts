import { describe, it, expect } from 'vitest';
import { canStart, advance, traceDone, coverage, JUDGE } from './judge';

const line = Array.from({ length: 21 }, (_, i) => ({ x: i * 5, y: 50 })); // 0..100

describe('なぞる', () => {
  it('始点の近くからしか始められない', () => {
    expect(canStart(line, { x: 3, y: 52 })).toBe(true);
    expect(canStart(line, { x: 40, y: 50 })).toBe(false);
  });
  it('線に沿って進むと cursor が進む', () => {
    let c = 0;
    for (const x of [4, 9, 14, 19]) c = advance(line, c, { x, y: 51 });
    expect(c).toBe(4);
  });
  it('先へ飛びすぎても K を超えては進まない', () => {
    expect(advance(line, 0, { x: 60, y: 50 })).toBe(-1);
    expect(advance(line, 0, { x: 60, y: 50 }, JUDGE.R_TRACE, 40)).toBeGreaterThan(JUDGE.K); // 先読みを広げれば届く
  });
  it('線から外れると -1', () => {
    expect(advance(line, 5, { x: 25, y: 50 + JUDGE.R_TRACE + 5 })).toBe(-1);
  });
  it('末尾付近で完了', () => {
    expect(traceDone(line, 20)).toBe(true);
    // かんじ: 線から 15 まで許し、画の 2 割手前で離しても完成
    expect(advance(line, 5, { x: 25, y: 50 + 14 }, 15)).not.toBe(-1);
    expect(traceDone(line, line.length - 1 - Math.round((line.length - 1) * 0.2), 0.2)).toBe(true);
    expect(traceDone(line, line.length - 1 - Math.round((line.length - 1) * 0.2) - 1, 0.2)).toBe(false);
    expect(traceDone(line, 18)).toBe(true);
    expect(traceDone(line, 10)).toBe(false);
  });
});

describe('じぶんでかく', () => {
  it('半分なぞれば coverage 0.5 前後', () => {
    const trail = Array.from({ length: 50 }, (_, i) => ({ x: i, y: 48 }));
    const cov = coverage(line, trail);
    expect(cov).toBeGreaterThan(0.45);
    expect(cov).toBeLessThan(0.6);
  });
  it('離れた所を塗っても 0', () => {
    expect(coverage(line, [{ x: 50, y: 90 }])).toBe(0);
  });
});
