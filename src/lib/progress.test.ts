import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  get,
  record,
  recordQuiz,
  charCleared,
  charGold,
  wordStar,
  wordCrown,
  recordWordDone,
  reset,
  switchProfile,
  days,
  recordStar,
  recordMiss,
  weakOf,
  detailOf,
  streakOf,
  checkBadges,
  earned,
  summaryOf,
  secretSummary,
  resetRecords
} from './progress.svelte';
import { setLang, LANGS } from './lang.svelte';
import { wordById } from './words';

const bus = wordById('bus')!;

describe('progress', () => {
  beforeEach(() => {
    setLang('ja');
    reset();
    setLang('en');
    reset();
    setLang('kana');
    reset();
    setLang('ja');
  });
  it('なぞる 2 + じぶんでかく 1 でクリア', () => {
    record('あ', 'trace');
    record('あ', 'trace');
    record('あ', 'trace');
    expect(get('あ').trace).toBe(2);
    expect(charCleared('あ')).toBe(false);
    record('あ', 'free');
    expect(charCleared('あ')).toBe(true);
    expect(charGold('あ')).toBe(false);
  });
  it('単語の星は最後まで練習した記録、王冠は星 + 全文字が金の星', () => {
    for (const c of 'ばす') {
      record(c, 'trace');
      record(c, 'trace');
      record(c, 'free');
    }
    expect(wordStar(bus)).toBe(false); // 文字がそろっただけでは付かない
    recordWordDone(bus);
    expect(wordStar(bus)).toBe(true);
    expect(wordCrown(bus)).toBe(false);
    for (const c of 'ばす') record(c, 'test');
    expect(wordCrown(bus)).toBe(true);
  });
  it('単語の記録が無い保存値は、星の付いていた単語を練習済みとして引き継ぐ', () => {
    const done = { trace: 2, free: 1, test: 0 };
    localStorage.setItem('kk:p1:ja:progress', JSON.stringify({ い: done, ぬ: done }));
    localStorage.removeItem('kk:p1:ja:words');
    switchProfile('p1');
    expect(wordStar(wordById('dog')!)).toBe(true);
    expect(JSON.parse(localStorage.getItem('kk:p1:ja:words')!)).toEqual({ dog: '' });
  });
  it('言語ごとに記録は別', () => {
    record('あ', 'trace');
    setLang('en');
    expect(get('あ').trace).toBe(0);
    recordWordDone(bus);
    for (const c of 'Bus') {
      record(c, 'trace');
      record(c, 'trace');
      record(c, 'free');
    }
    expect(wordStar(bus)).toBe(true);
    setLang('ja');
    expect(wordStar(bus)).toBe(false);
    expect(get('あ').trace).toBe(1);
  });
  it('星は最高値、不合格は累計で残り、にがてな文字は外した回数の多い順', () => {
    recordStar('あ', 2);
    recordStar('あ', 1);
    recordMiss('あ');
    recordMiss('い');
    recordMiss('い');
    recordMiss('う');
    recordMiss('う');
    recordMiss('う');
    recordStar('え', 1);
    expect([get('あ').star, get('あ').miss, get('い').miss]).toEqual([2, 1, 2]);
    expect(weakOf('p1', 'ja')).toEqual(['う', 'い', 'え']);
    expect(get('あ')).toMatchObject({ trace: 0, free: 0, test: 0 });
  });
  it('detailOf: 行ごとのクリア数・クイズ・メダル・最後の日・苦手（回数つき）をまとめる', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(2026, 8, 14, 10));
      for (const c of 'あいう') {
        record(c, 'trace');
        record(c, 'trace');
        record(c, 'free');
      }
      vi.setSystemTime(new Date(2026, 8, 15, 10));
      recordQuiz('read', 1, 4);
      recordQuiz('write', 2, 1);
      recordMiss('か');
      recordMiss('か');
      const d = detailOf('p1', 'ja');
      expect([d.chars, d.rows['あいうえお'], d.last, d.days]).toEqual([3, 3, '2026-09-15', 2]);
      expect([d.quiz.read1, d.quiz.write2, d.medalTotal > 0]).toEqual([4, 1, true]);
      expect(d.weak).toEqual([{ c: 'か', miss: 2 }]);
      expect(streakOf('p1')).toBe(2);
      expect(detailOf('p1', 'en').last).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
  it('練習した日付は 1 日に 1 つだけ増え、翌日のクイズでも増える', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(2026, 8, 14, 10));
      record('あ', 'trace');
      record('い', 'trace');
      expect(days()).toEqual(['2026-09-14']);
      vi.setSystemTime(new Date(2026, 8, 15, 9));
      recordQuiz('read', 1, 3);
      expect(days()).toEqual(['2026-09-14', '2026-09-15']);
      expect(JSON.parse(localStorage.getItem('kk:p1:ja:days')!)).toEqual(['2026-09-14', '2026-09-15']);
    } finally {
      vi.useRealTimers();
    }
  });
  it('壊れた記録の保存値は空として読む', () => {
    localStorage.setItem('kk:p1:ja:days', '"x"');
    localStorage.setItem('kk:p1:ja:progress', '[1,2]');
    switchProfile('p1');
    expect([days(), get('あ')]).toEqual([[], { trace: 0, free: 0, test: 0 }]);
    record('あ', 'trace');
    expect(days().length).toBe(1);
  });
  it('checkBadges: 新規獲得は一度だけ、ことばをまたがず、かくし要素は共有で 1 回だけ', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(2026, 8, 15, 10));
      record('あ', 'trace');
      record('あ', 'trace');
      record('あ', 'free');
      const first = checkBadges();
      expect(first.some((b) => b.id === 'first-char')).toBe(true);
      expect(earned()['first-char']).toBe('2026-09-15');
      expect(checkBadges()).toEqual([]);
      setLang('en');
      expect(checkBadges().some((b) => b.id === 'first-char')).toBe(false);
      expect(earned()['first-char']).toBeUndefined();
      setLang('ja');
      const { recordBalloon } = await import('./secret');
      recordBalloon('p1');
      const balloon = checkBadges().find((b) => b.id === 'balloon-found');
      expect(balloon?.secret).toBe(true);
      expect(JSON.parse(localStorage.getItem('kk:p1:earned')!)).toEqual({ 'balloon-found': '2026-09-15' });
      expect(JSON.parse(localStorage.getItem('kk:p1:ja:earned')!)['balloon-found']).toBeUndefined();
      setLang('en');
      expect(earned()['balloon-found']).toBe('2026-09-15'); // 他の ことば でも獲得済み
      expect(checkBadges().some((b) => b.id === 'balloon-found')).toBe(false); // 通知は 1 回だけ
      resetRecords('p1', ['en']);
      expect(earned()['balloon-found']).toBe('2026-09-15'); // 1 ことば のリセットでは残る
      resetRecords('p1', [...LANGS]);
      expect(earned()['balloon-found']).toBeUndefined(); // すべて のリセットで消える
    } finally {
      vi.useRealTimers();
      localStorage.removeItem('kk:secret');
      localStorage.removeItem('kk:balloon');
      localStorage.removeItem('kk:p1:earned');
    }
  });
  it('共有メダル: ことば ごとに取ってしまった記録は人単位へ寄せ、いちばん早い日付を残す', () => {
    localStorage.setItem(
      'kk:p2:ja:earned',
      JSON.stringify({ 'balloon-found': '2026-09-01', 'first-char': '2026-09-02' })
    );
    localStorage.setItem(
      'kk:p2:kana:earned',
      JSON.stringify({ 'balloon-found': '2026-08-30', 'streak-3': '2026-09-03' })
    );
    try {
      expect(detailOf('p2', 'ja').medals).toBe(3); // first-char + 共有 2 枚
      expect(detailOf('p2', 'en').medals).toBe(2); // 共有 2 枚
      expect(JSON.parse(localStorage.getItem('kk:p2:earned')!)).toEqual({
        'balloon-found': '2026-08-30',
        'streak-3': '2026-09-03'
      });
      expect(JSON.parse(localStorage.getItem('kk:p2:ja:earned')!)).toEqual({ 'first-char': '2026-09-02' });
      expect(JSON.parse(localStorage.getItem('kk:p2:kana:earned')!)).toEqual({});
    } finally {
      for (const k of ['kk:p2:earned', 'kk:p2:ja:earned', 'kk:p2:kana:earned']) localStorage.removeItem(k);
    }
  });
  it('summaryOf: 使用中でない人の集計は他の人と混ざらない', () => {
    localStorage.setItem(
      'kk:p2:ja:progress',
      JSON.stringify({ あ: { trace: 2, free: 1, test: 1 }, い: { trace: 2, free: 1, test: 0 } })
    );
    localStorage.setItem('kk:p2:ja:quiz', JSON.stringify({ read1: 3 }));
    expect(summaryOf('p2', 'ja')).toMatchObject({ chars: 2, gold: 1, quiz: 3 });
    expect(summaryOf('p1', 'ja').chars).toBe(0);
    expect(detailOf('p2', 'ja').rows['あいうえお']).toBe(2);
  });
  it('secretSummary: ふうせん ぽん の自己ベストとピンボールの最高回数（人単位、ことば非依存）', async () => {
    try {
      localStorage.setItem('kk:balloon', JSON.stringify({ p1: { score: 120, date: '2026-09-15' } }));
      const { recordPinball } = await import('./secret');
      recordPinball('p1', 42);
      expect(secretSummary('p1')).toEqual({ balloon: 120, pinball: 42 });
      expect(secretSummary('p2')).toEqual({ balloon: 0, pinball: 0 });
    } finally {
      localStorage.removeItem('kk:balloon');
      localStorage.removeItem('kk:secret');
    }
  });
});
