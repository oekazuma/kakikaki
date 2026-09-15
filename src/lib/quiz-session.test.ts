import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReadQuiz, WriteQuiz, levelFromParam } from './quiz-session.svelte';
import { reset, quiz } from './progress.svelte';
import { setLang } from './lang.svelte';
import type { Result } from './tracer.svelte';

const seeded =
  (s = 1) =>
  () =>
    (s = (s * 9301 + 49297) % 233280) / 233280;

describe('quiz session', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setLang('ja');
    reset();
  });
  afterEach(() => vi.useRealTimers());

  it('levelFromParam は 1〜3 に丸める', () => {
    expect([levelFromParam(null), levelFromParam('2'), levelFromParam('9'), levelFromParam('x')]).toEqual([1, 2, 3, 1]);
    expect([levelFromParam('2.5'), levelFromParam('1.2')]).toEqual([3, 1]);
  });

  it('よみクイズ: 一発正解だけ数え、10 問で終わって記録する', () => {
    const fx = { buu: vi.fn(), kira: vi.fn(), fanfare: vi.fn() };
    const r = new ReadQuiz(1, fx, seeded());
    expect(r.qs.length).toBe(10);
    // 1 問目はわざと外してから当てる
    const wrong = (r.q.letters ?? r.q.choices.map((w) => w.id)).find((k) => k !== r.q.key)!;
    expect(r.pick(wrong)).toBe('wrong');
    expect(r.wrong).toEqual([wrong]);
    expect(r.pick(r.q.key)).toBe('hit');
    expect(r.pick(r.q.key)).toBe('ignored');
    expect(r.correct).toBe(0);
    vi.advanceTimersByTime(900);
    expect([r.i, r.hit, r.wrong]).toEqual([1, null, []]);
    for (let n = 1; n < 10; n++) {
      r.pick(r.q.key);
      vi.advanceTimersByTime(900);
    }
    expect([r.done, r.correct]).toEqual([true, 9]);
    expect(quiz().read1).toBe(9);
    expect(fx.fanfare).toHaveBeenCalledOnce();
    expect(fx.buu).toHaveBeenCalledOnce();
  });

  it('よみクイズ: 最終問題の正解直後に dispose すると演出・記録が出ない', () => {
    const r = new ReadQuiz(1, {}, seeded());
    for (let n = 0; n < 9; n++) {
      r.pick(r.q.key);
      vi.advanceTimersByTime(900);
    }
    r.pick(r.q.key);
    r.dispose();
    vi.advanceTimersByTime(900);
    expect(r.done).toBe(false);
    expect(quiz().read1).toBeUndefined();
  });

  it('かきクイズ: 全文字書けば正解、2 回外すとなぞるに切り替わり正解に数えない', () => {
    const w = new WriteQuiz(1, {}, seeded(3));
    expect(w.qs.length).toBe(5);
    expect(w.kind).toBe('picture');
    const ok = (mode: Result['mode']): Result => ({ mode, score: 1, ok: true, top: w.c });
    // 1 語目: 全文字を一発で
    const n1 = w.letters.length;
    for (let k = 0; k < n1; k++) w.onDone(ok('test'));
    expect([w.msg, w.correct]).toEqual(['せいかい！', 1]);
    vi.advanceTimersByTime(1400);
    expect([w.i, w.k, w.mode]).toEqual([1, 0, 'test']);
    // 2 語目: 1 文字目を 2 回外す → なぞる。なぞって進めても正解にならない
    w.drawn = true;
    w.onDone({ mode: 'test', score: 0, ok: false, top: 'x' });
    expect(w.msg).toContain('おしい');
    expect(w.drawn).toBe(false);
    w.onDone({ mode: 'test', score: 0, ok: false, top: 'x' });
    expect([w.mode, w.helped, w.msg]).toEqual(['trace', true, 'おてほんを なぞって みよう']);
    w.onDone(ok('trace'));
    for (let k = 1; k < w.letters.length; k++) w.onDone(ok('test'));
    expect([w.msg, w.correct]).toEqual(['かけたね！', 1]);
    vi.advanceTimersByTime(1400);
    expect([w.i, w.helped]).toEqual([2, false]);
    // 残りを全部正解して終了
    while (!w.done) {
      for (let k = 0; k < w.letters.length; k++) w.onDone(ok('test'));
      vi.advanceTimersByTime(1400);
    }
    expect(w.correct).toBe(4);
    expect(quiz().write1).toBe(4);
  });

  it('かきクイズの穴埋め: ？ の 1 文字だけで正解、2 回外すとなぞるに切り替わり正解に数えない', () => {
    const w = new WriteQuiz(1, {}, seeded(8));
    const blankIdx = w.qs.findIndex((q) => q.kind === 'blank');
    expect(blankIdx).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < blankIdx; i++) {
      for (let k = 0; k < w.letters.length; k++) w.onDone({ mode: 'test', score: 1, ok: true, top: w.c });
      vi.advanceTimersByTime(1400);
    }
    expect(w.kind).toBe('blank');
    expect(w.targets.length).toBe(1);
    const target = w.qs[w.i].blank!;
    expect(w.targets[0]).toBe(target);
    // 2 回外す → なぞる。なぞって正解しても正解数に数えない
    w.onDone({ mode: 'test', score: 0, ok: false, top: 'x' });
    w.onDone({ mode: 'test', score: 0, ok: false, top: 'x' });
    expect(w.mode).toBe('trace');
    const before = w.correct;
    w.onDone({ mode: 'trace', score: 1, ok: true, top: w.c });
    expect(w.msg).toBe('かけたね！');
    expect(w.correct).toBe(before);
  });

  it('かきクイズの穴埋め: 一発で書けたら正解に数え、次の問題へ進む', () => {
    const w = new WriteQuiz(1, {}, seeded(3));
    const blankIdx = w.qs.findIndex((q) => q.kind === 'blank');
    expect(blankIdx).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < blankIdx; i++) {
      for (let k = 0; k < w.letters.length; k++) w.onDone({ mode: 'test', score: 1, ok: true, top: w.c });
      vi.advanceTimersByTime(1400);
    }
    const before = w.correct;
    w.onDone({ mode: 'test', score: 1, ok: true, top: w.c });
    expect(w.msg).toBe('せいかい！');
    expect(w.correct).toBe(before + 1);
    vi.advanceTimersByTime(1400);
    if (blankIdx + 1 < w.qs.length) expect(w.i).toBe(blankIdx + 1);
    else expect(w.done).toBe(true);
  });
});
