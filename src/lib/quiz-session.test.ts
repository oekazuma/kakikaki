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
  });

  it('よみクイズ: 一発正解だけ数え、10 問で終わって記録する', () => {
    const fx = { buu: vi.fn(), kira: vi.fn(), fanfare: vi.fn() };
    const r = new ReadQuiz(1, fx, seeded());
    expect(r.qs.length).toBe(10);
    // 1 問目はわざと外してから当てる
    const wrong = r.q.choices.find((w) => w.id !== r.q.answer.id)!;
    expect(r.pick(wrong)).toBe('wrong');
    expect(r.wrong).toEqual([wrong.id]);
    expect(r.pick(r.q.answer)).toBe('hit');
    expect(r.pick(r.q.answer)).toBe('ignored');
    expect(r.correct).toBe(0);
    vi.advanceTimersByTime(900);
    expect([r.i, r.hit, r.wrong]).toEqual([1, null, []]);
    for (let n = 1; n < 10; n++) {
      r.pick(r.q.answer);
      vi.advanceTimersByTime(900);
    }
    expect([r.done, r.correct]).toEqual([true, 9]);
    expect(quiz().read1).toBe(9);
    expect(fx.fanfare).toHaveBeenCalledOnce();
    expect(fx.buu).toHaveBeenCalledOnce();
  });

  it('かきクイズ: 全文字書けば正解、2 回外すとなぞるに切り替わり正解に数えない', () => {
    const w = new WriteQuiz(1, {}, seeded(3));
    expect(w.words.length).toBe(5);
    const ok = (mode: Result['mode']): Result => ({ mode, score: 1, ok: true, top: w.c });
    // 1 語目: 全文字を一発で
    const n1 = w.letters.length;
    for (let k = 0; k < n1; k++) w.onDone(ok('test'));
    expect([w.msg, w.correct]).toEqual(['せいかい！', 1]);
    vi.advanceTimersByTime(1400);
    expect([w.i, w.k, w.mode]).toEqual([1, 0, 'test']);
    // 2 語目: 1 文字目を 2 回外す → なぞる。なぞって進めても正解にならない
    w.onDone({ mode: 'test', score: 0, ok: false, top: 'x' });
    expect(w.msg).toContain('おしい');
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
});
