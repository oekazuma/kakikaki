import { describe, it, expect } from 'vitest';
import { STROKES } from './strokes';
import { STROKES_EN } from './strokes-en';
import { STROKES_KANA } from './strokes-kana';
import { STROKES_KANJI } from './strokes-kanji';
import { CHARS, CHARS_EN, CHARS_KANA } from './chars';
import { KANJI_ALL } from './kanji';
import { pathToPoints, translate } from './geometry';
import { recognize, passes, makeTemplates, templatesFor } from './recognize';

const drawn = (S: Record<string, string[]>, c: string) => S[c].map((d) => pathToPoints(d, 1.5));
const T_JA = templatesFor(STROKES);
const T_EN = makeTemplates(STROKES_EN);
const T_KANA = makeTemplates(STROKES_KANA);
const T_KANJI = makeTemplates(STROKES_KANJI);

describe('recognize', () => {
  it('お手本そのものは 81 文字すべて 1 位が自分', () => {
    for (const c of CHARS) expect(recognize(drawn(STROKES, c), T_JA)[0].char, c).toBe(c);
  });
  it('英語: お手本そのものは 62 文字すべて合格（I と l のように同形の字は 2 位でも可）', () => {
    for (const c of CHARS_EN) expect(passes([c], recognize(drawn(STROKES_EN, c), T_EN)), c).toBe(true);
  });
  it('数字を足しても O と 0 はそれぞれ合格する（0 は縦長の楕円にして区別している）', () => {
    expect(passes(['O'], recognize(drawn(STROKES_EN, 'O'), T_EN))).toBe(true);
    expect(passes(['0'], recognize(drawn(STROKES_EN, '0'), T_EN))).toBe(true);
  });
  it('カタカナ: お手本そのものは 81 文字すべて合格', () => {
    for (const c of CHARS_KANA) expect(passes([c], recognize(drawn(STROKES_KANA, c), T_KANA)), c).toBe(true);
  });
  it('ずれて・少し震えていても合格', () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280 - 0.5) * 4;
    for (const c of ['あ', 'ぱ', 'し', 'ー', 'っ']) {
      const strokes = drawn(STROKES, c).map((s) =>
        translate(s, 6, -4).map((p) => ({ x: p.x + rnd(), y: p.y + rnd() }))
      );
      expect(passes([c], recognize(strokes, T_JA)), c).toBe(true);
    }
    for (const c of ['A', 'g', 'S', 'w']) {
      const strokes = drawn(STROKES_EN, c).map((s) =>
        translate(s, 6, -4).map((p) => ({ x: p.x + rnd(), y: p.y + rnd() }))
      );
      expect(passes([c], recognize(strokes, T_EN)), c).toBe(true);
    }
  });
  it('画数が違う別の字は不合格', () => {
    expect(passes(['あ'], recognize(drawn(STROKES, 'ー'), T_JA))).toBe(false);
  });
  it('ひらがなのテンプレートは 81 個で、文字セットごとに 1 回だけ作られる', () => {
    expect(templatesFor(STROKES).length).toBe(81);
    expect(templatesFor(STROKES)).toBe(templatesFor(STROKES));
  });
  // 1026 字ぶんのテンプレート照合は 1 字 20ms ほどかかり、CI のマシンでは 5 秒の既定に収まらない
  it('漢字: お手本そのものは 1026 字のお手本の中で合格する（20 字おきに確認）', { timeout: 30000 }, () => {
    for (const c of KANJI_ALL.filter((_, i) => i % 20 === 0))
      expect(passes([c], recognize(drawn(STROKES_KANJI, c), T_KANJI)), c).toBe(true);
  });
  it('候補が複数なら、1 位がそのどれかで合格（かきクイズで同じ読みの字をどれも正解にする）', () => {
    const r = recognize(drawn(STROKES_KANJI, '工'), T_KANJI);
    expect(r[0].char).toBe('工');
    expect(passes(['公', '工'], r)).toBe(true);
    expect(passes(['公'], r)).toBe(false);
    expect(passes([], r)).toBe(false);
  });
});

describe('子どもがよくやる書き方', () => {
  const s = (c: string) => drawn(STROKES, c);
  it('書き順が違っても合格', () => {
    const [a, b, ...rest] = s('た');
    expect(passes(['た'], recognize([b, a, ...rest], T_JA))).toBe(true);
  });
  it('2 画をつなげて 1 画で書くと不合格（画数は見る）', () => {
    const [a, b, ...rest] = s('き');
    expect(passes(['き'], recognize([[...a, ...b], ...rest], T_JA))).toBe(false);
  });
});
