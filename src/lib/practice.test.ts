import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PracticeSession, nextMode, nextWordId, openWords, resolveWord } from './practice.svelte';
import { record, reset, get, wordStar, wordCrown, recordWordDone } from './progress.svelte';
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

  it('dispose() で待っている演出と自動進行を全部止める（画面を離れたあとに紙吹雪が降らない）', () => {
    const fx = { confetti: vi.fn(), fanfare: vi.fn() };
    const s = new PracticeSession(bus, fx);
    record('ば', 'trace');
    record('ば', 'trace');
    s.done(ok('free', 0.9)); // 文字クリア → はじめの いっぽ のメダル
    expect(fx.confetti).toHaveBeenCalledTimes(1);
    s.dispose();
    vi.runAllTimers();
    expect(fx.confetti).toHaveBeenCalledTimes(1);
    expect(fx.fanfare).not.toHaveBeenCalled();
    expect([s.toast, s.busy, s.i]).toEqual([null, true, 0]);
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

  it('最後の文字を おてほんなし で通しても単語の星が付き、やりかけ から消える', () => {
    // 文字は他の単語でクリア済み（単語の星はまだ無い）
    for (const c of ['ば', 'す']) for (const m of ['trace', 'trace', 'free'] as const) record(c, m);
    const s = new PracticeSession(bus);
    s.done(ok('trace'));
    vi.runAllTimers();
    expect([s.i, s.mode]).toEqual([1, 'trace']);
    s.select(1, 'test'); // ModeBar で おてほんなし を選ぶ
    s.done(ok('test'));
    vi.runAllTimers();
    expect([s.complete, wordStar(bus)]).toEqual([true, true]);
    expect(openWords()).toEqual([]);
  });

  it('クリア済みの単語をやり直しても完了モーダルは出ない。王冠を新しく取ったときは出る', () => {
    for (const c of 'ばす') clear(c);
    recordWordDone(bus);
    const s = new PracticeSession(bus);
    expect([s.i, s.mode]).toEqual([0, 'trace']);
    s.select(1, 'free');
    s.done(ok('free', 0.9));
    vi.runAllTimers();
    expect(s.complete).toBe(false);
    s.select(0, 'test');
    s.done(ok('test'));
    vi.runAllTimers();
    expect([s.i, s.mode, s.complete]).toEqual([1, 'test', false]);
    s.done(ok('test'));
    vi.runAllTimers();
    expect([s.complete, wordCrown(bus)]).toEqual([true, true]); // 王冠は新しく取ったので出る
    s.replay();
    s.select(1, 'test');
    s.done(ok('test'));
    vi.runAllTimers();
    expect(s.complete).toBe(false); // 王冠も取り済みなら出ない
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
    recordWordDone(bus);
    recordWordDone(wordById('train')!);
    expect(nextWordId(bus)).toBe('shinkansen');
    // 1 文字練習: あ の次はまだ終わっていない い
    expect(nextWordId(wordById('char-あ')!)).toBe('char-い');
  });

  it('openWords: やりかけの単語を最近書いた順に 5 つまで、ことば ごとに独立して出す', () => {
    const ids = () => openWords().map((w) => w.id);
    const write = (id: string) => {
      new PracticeSession(wordById(id)!).done(ok('trace'));
      vi.runAllTimers();
    };
    expect(ids()).toEqual([]); // 記録が無ければ出さない
    new PracticeSession(wordById('giraffe')!); // 開いただけでは出さない
    expect(ids()).toEqual([]);
    write('giraffe');
    expect(ids()).toEqual(['giraffe']); // 1 文字でも書けば やりかけ
    write('char-あ'); // 1 文字練習は出さない
    for (const id of ['bus', 'train', 'cat', 'dog']) write(id);
    expect(ids()).toEqual(['dog', 'cat', 'train', 'bus', 'giraffe']); // 最近書いた順
    write('giraffe');
    expect(ids()).toEqual(['giraffe', 'dog', 'cat', 'train', 'bus']); // 書き足すと先頭へ
    write('shinkansen');
    expect(ids()).toEqual(['shinkansen', 'giraffe', 'dog', 'cat', 'train']); // 6 つ目で古いものが隠れる
    setLang('kana');
    expect(ids()).toEqual([]); // かたかな の記録は別
    setLang('ja');
    recordWordDone(wordById('shinkansen')!);
    expect(ids()).toEqual(['giraffe', 'dog', 'cat', 'train', 'bus']); // 最後まで練習したら出さない
    reset();
    expect(ids()).toEqual([]); // リセットで消える
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
