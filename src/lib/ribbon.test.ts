import { describe, it, expect } from 'vitest';
import { ribbon, widths, BRUSH, type Sample } from './ribbon';

const line = (n: number, dtMs: number, p?: number): Sample[] =>
  Array.from({ length: n }, (_, i) => ({ x: 10 + i * 2, y: 50, t: i * dtMs, p }));

describe('ribbon', () => {
  it('1 点だけなら丸', () => {
    expect(ribbon([{ x: 10, y: 10 }], 10)).toMatch(/^M5\.0,10\.0a5\.0,5\.0 .*Z$/);
  });
  it('ゆっくり引いた線は太いままで、終わりは丸い（止め）', () => {
    const { h, taper } = widths(line(20, 100), 10);
    expect(taper).toBe(false);
    expect(h.at(-1)).toBeCloseTo(5, 1);
    expect(Math.min(...h.slice(5))).toBeGreaterThan(4.5);
    expect(ribbon(line(20, 100), 10)).toContain('A5.0,5.0');
  });
  it('速く抜いた線は細くなり、先が尖る（はらい）', () => {
    const pts = line(20, 4); // 2 単位 / 4ms = 0.5 > TAPER_V
    const { h, taper } = widths(pts, 10);
    expect(taper).toBe(true);
    expect(h.at(-1)).toBe(0);
    expect(h[10]).toBeLessThan(5 * 0.5);
    expect(ribbon(pts, 10)).not.toContain('A5.0');
  });
  it('書き始めは少し細く立ち上がる', () => {
    const { h } = widths(line(20, 100), 10);
    expect(h[0]).toBeCloseTo(5 * 0.55, 1);
    expect(h[3]).toBeGreaterThan(h[0]);
  });
  it('Pencil の筆圧が強いほど太い', () => {
    const strong = widths(line(20, 100, 1), 10).h[10];
    const weak = widths(line(20, 100, 0.2), 10).h[10];
    expect(strong).toBeGreaterThan(weak);
    expect(strong).toBeGreaterThan(5); // 強く押すと基準より太い
  });
  it('時刻が無い点列は ゆっくり書いた扱いで太いまま', () => {
    const pts = line(5, 0).map(({ x, y }) => ({ x, y }));
    const { h, taper } = widths(pts, 10);
    expect(taper).toBe(false);
    expect(h[3]).toBeCloseTo(5, 1);
    expect(BRUSH.MIN).toBeLessThan(1);
    expect(ribbon(pts, 10)).toMatch(/^M.*Z$/);
  });
});
