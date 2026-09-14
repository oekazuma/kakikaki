import { describe, it, expect, beforeEach } from 'vitest';
import { get, record, charCleared, charGold, wordStar, wordCrown, reset } from './progress.svelte';
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
});
