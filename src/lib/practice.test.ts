import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PracticeSession, nextMode, nextWordId, resolveWord } from './practice.svelte';
import { record, reset, get } from './progress.svelte';
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

  it('なぞる 2 回 → じぶんでかく → おてほんなし → 次の文字 と自動で進む', () => {
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
    expect(s.mode).toBe('test');
    expect(s.unlocked(1)).toBe(true);
    s.done({ mode: 'test', score: 0.5, ok: false, top: 'は' });
    expect(s.msg).toContain('「は」に みえるよ');
    expect([get('ば').test, get('ば').miss, get('ば').star]).toEqual([0, 1, 3]);
    s.done(ok('test', 0.8));
    vi.advanceTimersByTime(1200 + 2600); // はじめての きんのほし
    expect([s.i, s.c, s.mode]).toEqual([1, 'す', 'trace']);
  });

  it('おてほんなし の「みる」は字を 2 秒だけ見せ、文字を変えると隠れる', () => {
    const s = new PracticeSession(bus);
    s.peekSample();
    expect(s.peek).toBe(true);
    vi.advanceTimersByTime(1500);
    s.peekSample();
    vi.advanceTimersByTime(1500);
    expect(s.peek).toBe(true); // 押し直すと延びる
    vi.advanceTimersByTime(600);
    expect(s.peek).toBe(false);
    s.peekSample();
    s.select(0, 'free');
    expect(s.peek).toBe(false);
  });

  it('途中まで済んだ単語は残りの文字から再開し、最後を終えると完了になる', () => {
    clear('ば');
    record('ば', 'test');
    clear('す');
    const s = new PracticeSession(bus);
    expect([s.c, s.mode]).toEqual(['す', 'test']);
    s.done(ok('test'));
    vi.runAllTimers();
    expect(s.complete).toBe(true);
    s.replay();
    expect([s.complete, s.i, s.mode]).toEqual([false, 0, 'trace']);
  });

  it('nextMode と nextWordId', () => {
    expect(nextMode('あ')).toBe('trace');
    clear('あ');
    expect(nextMode('あ')).toBe('test');
    record('あ', 'test');
    expect(nextMode('あ')).toBeNull();
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
