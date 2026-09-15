import { describe, it, expect } from 'vitest';
import { levelOf, wordsOf, makeReadQuiz, makeWriteQuiz, pickChoices, type ReadQ } from './quiz';
import { WORDS, wordById } from './words';
import { lettersOf, nameOf, LANGS, type Lang } from './lang.svelte';
import { DIGITS } from './chars';

// 決定的な乱数
const seeded =
  (s = 1) =>
  () =>
    (s = (s * 9301 + 49297) % 233280) / 233280;

// 5 形式の性質を検証し、形式ごとの出題数を返す（等価比較は呼び出し側の級に委ねる）
function checkRead(l: Lang, level: 1 | 2 | 3, qs: ReadQ[]) {
  expect(qs.length).toBe(10);
  expect(new Set(qs.map((q) => q.answer.id)).size).toBe(10);
  const count: Record<string, number> = {};
  for (const q of qs) {
    count[q.kind] = (count[q.kind] ?? 0) + 1;
    if (q.kind === 'blank') {
      expect(q.letters!.length).toBe(3);
      expect(new Set(q.letters).size).toBe(3);
      expect(q.letters).toContain(q.key);
      expect(lettersOf(q.answer, l)[q.blank!]).toBe(q.key);
    } else {
      expect(q.key).toBe(q.answer.id);
      expect(q.choices.length).toBe(3);
      expect(q.choices.some((c) => c.id === q.answer.id)).toBe(true);
      expect(new Set(q.choices.map((c) => c.id)).size).toBe(3);
      for (const c of q.choices) expect(levelOf(c, l)).toBe(level);
    }
    if (q.kind === 'initial') {
      const first = lettersOf(q.answer, l)[0];
      for (const c of q.choices) if (c.id !== q.answer.id) expect(lettersOf(c, l)[0]).not.toBe(first);
    }
  }
  return count;
}

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
    const count = checkRead('ja', 2, makeReadQuiz('ja', 2, 10, seeded()));
    expect(count).toEqual({ word: 2, picture: 2, listen: 2, initial: 2, blank: 2 });
  });
  it('3 ことば × 3 級 とも 10 問・3 択・重複なし・正解を含む', () => {
    for (const l of LANGS)
      for (const level of [1, 2, 3] as const)
        for (const seed of [1, 2, 3]) {
          const count = checkRead(l, level, makeReadQuiz(l, level, 10, seeded(seed)));
          if (level === 1) {
            // ja/kana の級 1 には 1 文字の語があり、blank が word に振り替わる（quiz.test.ts の別テストが検証済み）
            expect(count.blank ?? 0).toBeLessThanOrEqual(2);
            expect(count.word).toBeGreaterThanOrEqual(2);
            expect(Object.values(count).reduce((a, b) => a + b, 0)).toBe(10);
          } else {
            expect(count).toEqual({ word: 2, picture: 2, listen: 2, initial: 2, blank: 2 });
          }
        }
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
  it('英語の穴埋めの選択肢に数字は出ない（数字は単語に出てこない 1 文字練習だけの対象）', () => {
    for (const seed of [1, 2, 3, 4, 5])
      for (const q of makeReadQuiz('en', 2, 40, seeded(seed)))
        if (q.kind === 'blank') for (const c of q.letters!) expect(DIGITS).not.toContain(c);
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
  it('表示名が同じ 2 語は同じカテゴリに置かない（よみクイズの選択肢に並ぶと区別できない）', () => {
    for (const l of LANGS) {
      const seen = new Map<string, string>(); // name → category
      for (const w of WORDS) {
        const n = nameOf(w, l);
        const c = seen.get(n);
        if (c !== undefined) expect(c, `${n} (${l})`).not.toBe(w.category);
        seen.set(n, w.category);
      }
    }
  });
});
