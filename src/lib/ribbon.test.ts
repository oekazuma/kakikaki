import { describe, it, expect } from 'vitest';
import { ribbon, penWidth, hasPressure, PEN, type Sample } from './ribbon';

const line = (n: number, p?: number): Sample[] => Array.from({ length: n }, (_, i) => ({ x: 10 + i * 2, y: 50, p }));

describe('ribbon', () => {
  it('筆圧が無ければ太さは基準のまま、強いほど太く、弱いほど細い', () => {
    expect(penWidth(10, undefined)).toBeCloseTo(10 * (PEN.MIN + PEN.GAIN * 0.5), 5);
    expect(penWidth(10, 1)).toBeGreaterThan(penWidth(10, 0.5));
    expect(penWidth(10, 0.1)).toBeLessThan(penWidth(10, 0.5));
    expect(penWidth(10, 1)).toBeLessThanOrEqual(10 * PEN.MAX);
    expect(hasPressure(line(3))).toBe(false);
    expect(hasPressure(line(3, 0.7))).toBe(true);
  });
  it('1 点だけなら丸', () => {
    expect(ribbon([{ x: 10, y: 10, p: 0.5 }], 10)).toMatch(/^M\d+\.\d,10\.0a.*Z$/);
  });
  it('区間ごとに両端が丸いカプセルを重ねた path になり、弧は外側へ膨らむ', () => {
    const d = ribbon(line(3, 0.5), 10);
    expect((d.match(/Z/g) ?? []).length).toBe(2);
    expect((d.match(/A/g) ?? []).length).toBe(4);
    // 右向きの区間 (10,50)→(12,50)、半径 r: 終端の弧は (12,50+r) から (12,50-r) へ sweep 0（外側 x>12 を通る）
    const r = (10 * (PEN.MIN + PEN.GAIN * 0.5)) / 2;
    expect(d).toContain(
      `L12.0,${(50 + r).toFixed(1)}A${r.toFixed(1)},${r.toFixed(1)} 0 0 0 12.0,${(50 - r).toFixed(1)}`
    );
  });
});
