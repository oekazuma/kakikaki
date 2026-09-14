import { describe, it, expect } from 'vitest';
import { levelOf, wordsOf, makeReadQuiz, makeWriteQuiz, pickChoices } from './quiz';
import { WORDS, wordById } from './words';
import { lettersOf } from './lang.svelte';

// 決定的な乱数
const seeded =
  (s = 1) =>
  () =>
    (s = (s * 9301 + 49297) % 233280) / 233280;

describe('quiz', () => {
  it('級ごとに 50 語以上あり、全単語がどれかの級に入る', () => {
    for (const l of ['ja', 'kana', 'en'] as const) {
      const sizes = [1, 2, 3].map((lv) => wordsOf(l, lv as 1 | 2 | 3).length);
      expect(sizes.reduce((a, b) => a + b, 0)).toBe(WORDS.length);
      for (const s of sizes) expect(s).toBeGreaterThanOrEqual(50);
    }
    expect(levelOf(wordById('bus')!, 'ja')).toBe(1);
    expect(levelOf(wordById('ship')!, 'en')).toBe(1);
    expect(levelOf(wordById('shinkansen')!, 'ja')).toBe(3);
  });
  it('よみクイズは 10 問、5 形式が 2 回ずつ、3 択で正解を含み、重複なし', () => {
    const qs = makeReadQuiz('ja', 2, 10, seeded());
    expect(qs.length).toBe(10);
    expect(new Set(qs.map((q) => q.answer.id)).size).toBe(10);
    const count: Record<string, number> = {};
    for (const q of qs) {
      count[q.kind] = (count[q.kind] ?? 0) + 1;
      if (q.kind === 'blank') {
        expect(q.letters!.length).toBe(3);
        expect(new Set(q.letters).size).toBe(3);
        expect(q.letters).toContain(q.key);
        expect(lettersOf(q.answer, 'ja')[q.blank!]).toBe(q.key);
      } else {
        expect(q.key).toBe(q.answer.id);
        expect(q.choices.length).toBe(3);
        expect(q.choices.some((c) => c.id === q.answer.id)).toBe(true);
        expect(new Set(q.choices.map((c) => c.id)).size).toBe(3);
        for (const c of q.choices) expect(levelOf(c, 'ja')).toBe(2);
      }
      if (q.kind === 'initial') {
        const first = lettersOf(q.answer, 'ja')[0];
        for (const c of q.choices) if (c.id !== q.answer.id) expect(lettersOf(c, 'ja')[0]).not.toBe(first);
      }
    }
    expect(count).toEqual({ word: 2, picture: 2, listen: 2, initial: 2, blank: 2 });
  });
  it('1 文字の語は穴埋めにせず、英語の穴埋めは大文字小文字を合わせる', () => {
    for (const q of makeReadQuiz('ja', 1, 20, seeded(5)))
      if (q.kind === 'blank') expect(lettersOf(q.answer, 'ja').length).toBeGreaterThan(1);
    for (const q of makeReadQuiz('en', 2, 40, seeded(7)))
      if (q.kind === 'blank') {
        // 穴が先頭なら大文字の候補、それ以外なら小文字の候補
        const upper = q.blank === 0;
        for (const c of q.letters!) expect(c === c.toUpperCase(), `${q.answer.en}:${c}`).toBe(upper);
      }
  });
  it('むずかしい の選択肢は同じカテゴリ・同じ文字数が優先される', () => {
    const answer = wordById('hamburger')!; // はんばーがー 6 文字。たべもの には同じ 6 文字の語が 4 つある
    for (const seed of [1, 2, 3]) {
      const ch = pickChoices(answer, wordsOf('ja', 3), 'ja', 3, seeded(seed)).filter((c) => c.id !== answer.id);
      expect(ch.length).toBe(2);
      for (const c of ch) {
        expect(c.category).toBe('たべもの');
        expect(lettersOf(c, 'ja').length).toBe(6);
      }
    }
  });
  it('かきクイズは 5 問、絵と音が交互、英語は文字が分かれている', () => {
    const ws = makeWriteQuiz('en', 1, 5, seeded(2));
    expect(ws.map((q) => q.kind)).toEqual(['picture', 'listen', 'picture', 'listen', 'picture']);
    expect(new Set(ws.map((q) => q.word.id)).size).toBe(5);
    for (const { word } of ws) expect(lettersOf(word, 'en').length).toBeLessThanOrEqual(4);
  });
});
