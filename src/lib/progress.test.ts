import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  get,
  record,
  recordQuiz,
  charCleared,
  charGold,
  wordStar,
  wordCrown,
  reset,
  switchProfile,
  days
} from './progress.svelte';
import { setLang } from './lang.svelte';
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
  it('単語の星と王冠', () => {
    for (const c of 'ばす') {
      record(c, 'trace');
      record(c, 'trace');
      record(c, 'free');
    }
    expect(wordStar(bus)).toBe(true);
    expect(wordCrown(bus)).toBe(false);
    for (const c of 'ばす') record(c, 'test');
    expect(wordCrown(bus)).toBe(true);
  });
  it('言語ごとに記録は別', () => {
    record('あ', 'trace');
    setLang('en');
    expect(get('あ').trace).toBe(0);
    for (const c of 'bus') {
      record(c, 'trace');
      record(c, 'trace');
      record(c, 'free');
    }
    expect(wordStar(bus)).toBe(true);
    setLang('ja');
    expect(wordStar(bus)).toBe(false);
    expect(get('あ').trace).toBe(1);
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
});
