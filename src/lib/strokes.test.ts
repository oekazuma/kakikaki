import { describe, it, expect } from 'vitest';
import { CHARS, CHARS_EN, CHARS_KANA } from './chars';
import { STROKES } from './strokes';
import { STROKES_EN } from './strokes-en';
import { STROKES_KANA } from './strokes-kana';
import { pathToPoints, length } from './geometry';

describe('STROKES', () => {
  it('81 文字すべてに 1 画以上ある', () => {
    expect(CHARS.length).toBe(81);
    for (const c of CHARS) expect(STROKES[c]?.length, c).toBeGreaterThan(0);
  });
  it('カタカナ 81 文字すべてに 1 画以上ある', () => {
    expect(CHARS_KANA.length).toBe(81);
    for (const c of CHARS_KANA) expect(STROKES_KANA[c]?.length, c).toBeGreaterThan(0);
    expect(STROKES_KANA['ア'].length).toBe(2);
  });
  it('画数の例', () => {
    expect(STROKES['あ'].length).toBe(3);
    expect(STROKES['ー'].length).toBe(1);
    expect(STROKES['ぱ'].length).toBe(4);
  });
  it('英語 52 文字は線の太さ（14）を含めて 109 マスに収まり、各画に長さがある', () => {
    expect(CHARS_EN.length).toBe(52);
    const m = 7;
    for (const c of CHARS_EN) {
      for (const d of STROKES_EN[c]) {
        const pts = pathToPoints(d);
        expect(length(pts), c).toBeGreaterThan(3);
        for (const p of pts)
          expect(
            p.x >= m && p.x <= 109 - m && p.y >= m && p.y <= 109 - m,
            `${c} ${p.x.toFixed(1)},${p.y.toFixed(1)}`
          ).toBe(true);
      }
    }
  });
});
