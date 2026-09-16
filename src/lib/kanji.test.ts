import { describe, it, expect } from 'vitest';
import { KANJI, KANJI_ALL, READINGS, kanjiReading, readingLabel, readingSpeech } from './kanji';
import { STROKES_KANJI } from './strokes-kanji';

describe('kanji', () => {
  it('学年ごとに 80 / 160 / 200 字、全体で重複なし', () => {
    expect(KANJI.map((k) => k.chars.length)).toEqual([80, 160, 200]);
    expect(KANJI.map((k) => k.name)).toEqual(['1ねんせい', '2ねんせい', '3ねんせい']);
    expect(KANJI_ALL.length).toBe(440);
    expect(new Set(KANJI_ALL).size).toBe(440);
  });
  it('書き順は 440 字ぶんそろっている', () => {
    for (const c of KANJI_ALL) expect(STROKES_KANJI[c]?.length, c).toBeGreaterThan(0);
    expect(Object.keys(STROKES_KANJI).length).toBe(440);
  });
  it('全字に読みがあり、読みはひらがなだけ。先頭が代表の読み', () => {
    for (const c of KANJI_ALL) {
      expect(READINGS[c]?.length, c).toBeGreaterThan(0);
      for (const r of READINGS[c]) expect(r, c).toMatch(/^[ぁ-ゖー]+(\.[ぁ-ゖ]+)?$/);
    }
    expect(kanjiReading('一')).toBe('いち');
    expect(kanjiReading('花')).toBe('はな');
    expect(READINGS['一']).toEqual(['いち', 'ひと']);
    expect(kanjiReading('休')).toBe('やす.む');
  });
  it('送り仮名は表示では（ ）、読み上げでは続けて読む', () => {
    expect(readingLabel('やす.む')).toBe('やす（む）');
    expect(readingLabel('はな')).toBe('はな');
    expect(readingSpeech('やす.む')).toBe('やすむ');
  });
});
