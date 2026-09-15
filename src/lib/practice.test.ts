import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PracticeSession, nextMode, nextWordId, nextOpenWord, resolveWord } from './practice.svelte';
import { record, reset, get, wordCrown } from './progress.svelte';
import { setLang } from './lang.svelte';
import { wordById } from './words';
import type { Result } from './tracer.svelte';

const bus = wordById('bus')!;
const ok = (mode: Result['mode'], score = 1): Result => ({ mode, score, ok: true, top: 'x' });
const clear = (c: string) => {
  record(c, 'trace');
  record(c, 'trace');
  record(c, 'free');
};

describe('PracticeSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setLang('ja');
    reset();
  });
  afterEach(() => vi.useRealTimers());

  it('最初の文字の なぞる から始まり、次の文字は鍵つき', () => {
    const fx = { buu: vi.fn() };
    const s = new PracticeSession(bus, fx);
    expect([s.i, s.mode, s.c]).toEqual([0, 'trace', 'ば']);
    expect(s.unlocked(1)).toBe(false);
    expect(s.tapTab(1)).toBe(false);
    vi.runAllTimers();
    expect(s.shaking).toBe(1);
    expect(fx.buu).toHaveBeenCalledOnce();
    expect(s.i).toBe(0);
  });

  it('なぞる 2 回 → じぶんでかく → 次の文字 と自動で進み、おてほんなし には入らない', () => {
    const s = new PracticeSession(bus);
    s.done(ok('trace'));
    expect(s.busy).toBe(true);
    expect(s.msg).toBe('できた！');
    vi.advanceTimersByTime(1200);
    expect([s.mode, s.busy]).toEqual(['trace', false]);
    s.done(ok('trace'));
    vi.advanceTimersByTime(1200);
    expect(s.mode).toBe('free');
    s.done(ok('free', 0.9));
    expect(s.msg).toContain('★★★');
    expect(s.flyStar).toBe(true); // 文字クリア
    vi.advanceTimersByTime(1200 + 2600); // はじめの いっぽ のメダル分
    expect([s.i, s.c, s.mode]).toEqual([1, 'す', 'trace']);
    expect(get('ば').star).toBe(3);
  });

  it('完了モーダルから おてほんなし に挑戦でき、通ると次の文字の おてほんなし へ進んで王冠になる', () => {
    clear('ば');
    const s = new PracticeSession(bus);
    expect([s.c, s.mode]).toEqual(['す', 'trace']);
    s.done(ok('trace'));
    vi.runAllTimers();
    s.done(ok('trace'));
    vi.runAllTimers();
    s.done(ok('free'));
    vi.runAllTimers();
    expect(s.complete).toBe(true);
    s.challenge();
    expect([s.complete, s.i, s.mode]).toEqual([false, 0, 'test']);
    s.drawn = true;
    s.done({ mode: 'test', score: 0.5, ok: false, top: 'は' });
    expect(s.msg).toContain('「は」に みえるよ');
    expect([get('ば').test, get('ば').miss]).toEqual([0, 1]);
    expect(s.drawn).toBe(false);
    s.done(ok('test', 0.8));
    vi.runAllTimers();
    expect([s.i, s.c, s.mode, s.complete]).toEqual([1, 'す', 'test', false]);
    s.done(ok('test'));
    vi.runAllTimers();
    expect([s.complete, wordCrown(bus)]).toEqual([true, true]);
    s.challenge(); // 全部金星なら何も起きない
    expect(s.complete).toBe(true);
  });

  it('途中まで済んだ単語は残りの文字から再開し、クリア済みの単語は最初の なぞる から', () => {
    clear('ば');
    record('ば', 'test');
    expect([new PracticeSession(bus).c, new PracticeSession(bus).mode]).toEqual(['す', 'trace']);
    clear('す');
    const s = new PracticeSession(bus);
    expect([s.i, s.mode]).toEqual([0, 'trace']);
    s.complete = true;
    s.replay();
    expect([s.complete, s.i, s.mode]).toEqual([false, 0, 'trace']);
  });

  it('nextMode と nextWordId', () => {
    expect(nextMode('あ')).toBe('trace');
    clear('あ');
    expect(nextMode('あ')).toBeNull(); // おてほんなし は自動では入らない
    // ばす・でんしゃ を終えると、ばす の次は しんかんせん
    for (const w of ['ばす', 'でんしゃ']) {
      for (const c of w) {
        clear(c);
        record(c, 'test');
      }
    }
    expect(nextWordId(bus)).toBe('shinkansen');
    // 1 文字練習: あ の次はまだ終わっていない い
    expect(nextWordId(wordById('char-あ')!)).toBe('char-い');
  });

  it('nextOpenWord: 並び順で最初の未クリア単語', () => {
    expect(nextOpenWord()?.id).toBe('dog'); // WORDS の先頭
    for (const c of 'いぬ') clear(c);
    expect(nextOpenWord()?.id).toBe('cat'); // 次の未クリア（ねこ が先頭から 2 番目）
  });

  it('resolveWord: その言語に無い文字の単語は既定の単語に戻す', () => {
    expect(resolveWord('bus', 'ja').id).toBe('bus');
    expect(resolveWord('bus', 'en').id).toBe('bus');
    expect(resolveWord('char-あ', 'ja').id).toBe('char-あ');
    expect(resolveWord('char-あ', 'kana').id).toBe('char-あ'); // カタカナでは ア として書ける
    expect(resolveWord('char-あ', 'en').id).toBe('patocar');
    expect(resolveWord('nope', 'ja').id).toBe('patocar');
    expect(resolveWord(null, 'ja').id).toBe('patocar');
  });
});
