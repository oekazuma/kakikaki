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
  it('両端が丸い閉じた帯になる', () => {
    const d = ribbon(line(20, 0.5), 10);
    expect(d).toMatch(/^M.*A.*A.*Z$/);
    expect((d.match(/A/g) ?? []).length).toBe(2);
  });
});
