import { describe, it, expect } from 'vitest';
import { Tracer } from './tracer.svelte';
import { STROKES } from './strokes';
import { pathToPoints, translate, type Pt } from './geometry';

const strokePts = (c: string, i: number) => pathToPoints(STROKES[c][i], 2);
const drag = (t: Tracer, pts: Pt[]) => {
  t.down(pts[0]);
  for (const p of pts) t.move(p);
  return t.up();
};

describe('Tracer なぞる', () => {
  it('始点から離れた場所では書き始められない', () => {
    const t = new Tracer('あ', STROKES, 'trace');
    expect(t.down({ x: 100, y: 100 })).toBe(false);
    expect(t.tracing).toBe(false);
  });
  it('お手本どおりになぞると画が進み、最後の画で done', () => {
    const t = new Tracer('あ', STROKES, 'trace');
    expect(drag(t, strokePts('あ', 0))).toBe('stroke');
    expect(t.si).toBe(1);
    expect(drag(t, strokePts('あ', 1))).toBe('stroke');
    expect(drag(t, strokePts('あ', 2))).toBe('done');
    expect(t.finished).toBe(true);
    expect(t.result()).toEqual({ mode: 'trace', score: 1, ok: true, top: 'あ' });
    expect(t.down({ x: 0, y: 0 })).toBe(false);
  });
  it('線から外れると fail で最初から', () => {
    const t = new Tracer('あ', STROKES, 'trace');
    const pts = strokePts('あ', 0);
    t.down(pts[0]);
    for (const p of pts.slice(0, 5)) t.move(p);
    expect(t.cursor).toBeGreaterThan(0);
    expect(t.move({ x: pts[4].x, y: pts[4].y + 40 })).toBe('fail');
    expect(t.cursor).toBe(0);
    expect(t.tracing).toBe(false);
    expect(t.up()).toBe('idle');
  });
  it('途中で離すと fail', () => {
    const t = new Tracer('あ', STROKES, 'trace');
    const pts = strokePts('あ', 0);
    t.down(pts[0]);
    for (const p of pts.slice(0, 5)) t.move(p);
    expect(t.up()).toBe('fail');
    expect(t.si).toBe(0);
  });
});

describe('Tracer じぶんでかく', () => {
  it('半分だけ塗ると pending、残りを塗ると stroke。採点は 3 つ星相当', () => {
    const t = new Tracer('ー', STROKES, 'free');
    const pts = strokePts('ー', 0);
    const half = Math.floor(pts.length / 2);
    expect(drag(t, pts.slice(0, half))).toBe('pending');
    expect(t.trails.length).toBe(1);
    expect(drag(t, pts.slice(half - 2))).toBe('done');
    expect(t.result().score).toBeGreaterThan(0.85);
  });
  it('お手本から離れた線では進まない', () => {
    const t = new Tracer('ー', STROKES, 'free');
    expect(
      drag(t, [
        { x: 10, y: 100 },
        { x: 100, y: 100 }
      ])
    ).toBe('pending');
    expect(t.si).toBe(0);
  });
});

describe('Tracer おてほんなし', () => {
  it('何も書かなければ null、お手本どおりなら合格、別の字なら不合格で 1 位の字を返す', () => {
    const t = new Tracer('あ', STROKES, 'test');
    expect(t.judge()).toBeNull();
    for (let i = 0; i < 3; i++) expect(drag(t, translate(strokePts('あ', i), 4, -3))).toBe('drawn');
    const r = t.judge()!;
    expect(r.ok).toBe(true);
    expect(r.top).toBe('あ');
    const u = new Tracer('あ', STROKES, 'test');
    drag(u, strokePts('ー', 0));
    const bad = u.judge()!;
    expect(bad.ok).toBe(false);
    expect(bad.top).not.toBe('あ');
  });
});
