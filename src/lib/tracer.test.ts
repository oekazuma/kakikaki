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
  it('終点まで来たあとは、はみ出しても fail にならず、離せば完成', () => {
    const t = new Tracer('あ', STROKES, 'trace');
    const pts = t.current;
    t.down(pts[0]);
    for (const q of pts) t.move(q);
    expect(t.move({ x: pts.at(-1)!.x + 30, y: pts.at(-1)!.y + 30 })).toBe('moved');
    expect(t.up()).toBe('stroke');
  });
  it('Pencil の筆圧は なぞる で通った点ごとに残り、指では残らない', () => {
    const t = new Tracer('あ', STROKES, 'trace');
    const pts = t.current;
    t.down({ ...pts[0], p: 0.4 });
    t.move({ ...pts[3], p: 0.8 });
    expect(t.pr.length).toBe(t.cursor + 1);
    expect(t.pr[0]).toBe(0.4);
    expect(t.pr[t.cursor]).toBe(0.8);
    t.up();
    const f = new Tracer('あ', STROKES, 'trace');
    f.down(f.current[0]);
    f.move(f.current[3]);
    expect(f.pr).toEqual([]);
  });
  it('なぞる の ひとつ もどる は直前の画へ戻る（なぞっている最中と最初の画では戻れない）', () => {
    const t = new Tracer('い', STROKES, 'trace');
    expect(t.undo()).toBeNull();
    t.down(t.current[0]);
    for (const q of t.current) t.move(q);
    expect(t.up()).toBe('stroke');
    expect(t.si).toBe(1);
    t.down(t.current[0]);
    expect(t.undo()).toBeNull(); // なぞっている最中
    t.up();
    expect(t.undo()).toBe('stroke');
    expect(t.si).toBe(0);
    expect(t.cursor).toBe(0);
  });
  it('指が速く動いて 1 回で先読み 8 点を越えても、動いた距離ぶんは追いつく', () => {
    const t = new Tracer('あ', STROKES, 'trace');
    const pts = t.current;
    t.down(pts[0]);
    expect(t.move(pts[20])).toBe('moved'); // 20 点（30 単位）先へ一気に
    expect(t.cursor).toBe(20);
  });
  it('途中で離すと fail', () => {
    const t = new Tracer('あ', STROKES, 'trace');
    const pts = strokePts('あ', 0);
    t.down(pts[0]);
    for (const p of pts.slice(0, 5)) t.move(p);
    expect(t.up()).toBe('fail');
    expect(t.si).toBe(0);
  });
  it('2 本目の指は無視され、1 本目の画は続く', () => {
    const t = new Tracer('あ', STROKES, 'trace');
    const pts = strokePts('あ', 0);
    expect(t.down(pts[0], 1)).toBe(true);
    for (const p of pts.slice(0, 5)) t.move(p, 1);
    const cursor = t.cursor;
    expect(t.down({ x: 100, y: 100 }, 2)).toBe(false); // 手のひら
    expect(t.move({ x: 100, y: 100 }, 2)).toBe('idle'); // 線から遠くても fail にならない
    expect(t.up(2)).toBe('idle');
    expect([t.tracing, t.cursor]).toEqual([true, cursor]);
    for (const p of pts.slice(5)) t.move(p, 1);
    expect(t.up(1)).toBe('stroke');
  });
});

describe('Tracer じぶんでかく', () => {
  it('ひとつ もどる: 最後の線を消し、線が無ければ直前の画を取り消す。なぞる では戻さない', () => {
    const t = new Tracer('あ', STROKES, 'free');
    expect(drag(t, strokePts('あ', 0))).toBe('stroke');
    expect(t.si).toBe(1);
    drag(t, [
      { x: 10, y: 100 },
      { x: 30, y: 100 }
    ]);
    expect(t.trails.length).toBe(1);
    expect(t.undo()).toBe('line');
    expect(t.trails.length).toBe(0);
    expect(t.undo()).toBe('stroke');
    expect(t.si).toBe(0);
    expect(t.undo()).toBeNull();
    expect(new Tracer('あ', STROKES, 'trace').undo()).toBeNull();
    const test = new Tracer('あ', STROKES, 'test');
    drag(test, strokePts('あ', 0));
    expect(test.undo()).toBe('line');
    expect(test.judge()).toBeNull(); // 線が無いので判定しない
  });

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
  it('じぶんでかく でも 2 本目の指は軌跡を捨てない', () => {
    const t = new Tracer('ー', STROKES, 'free');
    const pts = strokePts('ー', 0);
    t.down(pts[0], 7);
    for (const p of pts.slice(0, 3)) t.move(p, 7);
    expect(t.down({ x: 50, y: 90 }, 8)).toBe(false);
    expect(t.trail.length).toBe(4);
    expect(t.up(8)).toBe('idle');
    expect(t.tracing).toBe(true);
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
  it('同じ線で二度は判定しない。線を足せばまた判定できる', () => {
    const t = new Tracer('あ', STROKES, 'test');
    drag(t, strokePts('あ', 0));
    expect(t.judge()).not.toBeNull();
    expect(t.judge()).toBeNull();
    drag(t, strokePts('あ', 1));
    expect(t.judge()).not.toBeNull();
  });
});
