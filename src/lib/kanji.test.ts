import { describe, it, expect } from 'vitest';
import { KANJI, KANJI_ALL, READINGS, kanjiReading, readingLabel, readingSpeech, kanjiByReading } from './kanji';
import { STROKES_KANJI } from './strokes-kanji';

describe('kanji', () => {
  it('学年ごとに 80 / 160 / 200 / 202 / 193 / 191 字、全体で重複なし', () => {
    expect(KANJI.map((k) => k.chars.length)).toEqual([80, 160, 200, 202, 193, 191]);
    expect(KANJI.map((k) => k.name)).toEqual([
      '1ねんせい',
      '2ねんせい',
      '3ねんせい',
      '4ねんせい',
      '5ねんせい',
      '6ねんせい'
    ]);
    expect(KANJI_ALL.length).toBe(1026);
    expect(new Set(KANJI_ALL).size).toBe(1026);
  });
  it('書き順は 1026 字ぶんそろっている', () => {
    for (const c of KANJI_ALL) expect(STROKES_KANJI[c]?.length, c).toBeGreaterThan(0);
    expect(Object.keys(STROKES_KANJI).length).toBe(1026);
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
  it('よみから さがす: 五十音の行ごとに 1026 字を過不足なく分け、行の中は読みの順', () => {
    const rows = kanjiByReading();
    expect(rows.map((r) => r.name)).toEqual([
      'あいうえお',
      'かきくけこ',
      'さしすせそ',
      'たちつてと',
      'なにぬねの',
      'はひふへほ',
      'まみむめも',
      'やゆよ',
      'らりるれろ',
      'わをん'
    ]);
    const all = rows.flatMap((r) => r.chars);
    expect(all.length).toBe(1026);
    expect(new Set(all).size).toBe(1026);
    for (const r of rows) {
      const ks = r.chars.map((c) => readingSpeech(kanjiReading(c)));
      expect(ks, r.name).toEqual([...ks].sort((a, b) => a.localeCompare(b, 'ja')));
    }
    expect(rows[1].chars.slice(0, 3)).toEqual(['火', '科', '貨']); // か は が より前
    expect(rows[1].chars).toContain('学');
    expect(rows[5].chars).toContain('場'); // ば は は行
    expect(rows[6].chars).toContain('麦');
  });
  it('送り仮名は表示では（ ）、読み上げでは続けて読む', () => {
    expect(readingLabel('やす.む')).toBe('やす（む）');
    expect(readingLabel('はな')).toBe('はな');
    expect(readingSpeech('やす.む')).toBe('やすむ');
  });
});
