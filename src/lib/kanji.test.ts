import { describe, it, expect } from 'vitest';
import { KANJI, KANJI_ALL, READINGS, kanjiReading } from './kanji';

describe('kanji', () => {
  it('学年ごとに 80 / 160 / 200 字、全体で重複なし', () => {
    expect(KANJI.map((k) => k.chars.length)).toEqual([80, 160, 200]);
    expect(KANJI.map((k) => k.name)).toEqual(['1ねんせい', '2ねんせい', '3ねんせい']);
    expect(KANJI_ALL.length).toBe(440);
    expect(new Set(KANJI_ALL).size).toBe(440);
  });
  it('全字に読みがあり、読みはひらがなだけ。先頭が代表の読み', () => {
    for (const c of KANJI_ALL) {
      expect(READINGS[c]?.length, c).toBeGreaterThan(0);
      for (const r of READINGS[c]) expect(r, c).toMatch(/^[ぁ-ゖー]+$/);
    }
    expect(kanjiReading('一')).toBe('いち');
    expect(kanjiReading('花')).toBe('はな');
    expect(READINGS['一']).toEqual(['いち', 'ひと']);
  });
});
