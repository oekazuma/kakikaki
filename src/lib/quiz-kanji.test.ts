import { describe, it, expect } from 'vitest';
import { makeKanjiReadQuiz, makeKanjiWriteQuiz, gradesOf } from './quiz-kanji';
import { makeReadQuiz, makeWriteQuiz } from './quiz';
import { READINGS, kanjiReading } from './kanji';

const seeded =
  (s = 1) =>
  () =>
    (s = (s * 9301 + 49297) % 233280) / 233280;

describe('quiz-kanji', () => {
  it('よみクイズは 10 問、2 形式が 5 問ずつ、出題は級の学年（2 つずつ）の字だけ、重複なし', () => {
    for (const level of [1, 2, 3] as const)
      for (const seed of [1, 2, 3]) {
        const qs = makeKanjiReadQuiz(level, 10, seeded(seed));
        expect(qs.length).toBe(10);
        expect(new Set(qs.map((q) => q.answer.id)).size).toBe(10);
        expect(qs.filter((q) => q.kind === 'kanji-read').length).toBe(5);
        expect(qs.filter((q) => q.kind === 'kanji-listen').length).toBe(5);
        for (const q of qs) expect(gradesOf(level).flatMap((g) => g.chars)).toContain(q.answer.name);
      }
  });
  it('字を見て読みを選ぶ: 正解は代表の読み、外れは出題した字のどの読みとも一致しない', () => {
    const qs = makeKanjiReadQuiz(2, 10, seeded(4)).filter((q) => q.kind === 'kanji-read');
    for (const q of qs) {
      const c = q.answer.name;
      expect(q.key).toBe(kanjiReading(c));
      expect(q.letters!.length).toBe(3);
      expect(new Set(q.letters).size).toBe(3);
      expect(q.letters).toContain(q.key);
      for (const r of q.letters!) if (r !== q.key) expect(READINGS[c], `${c} ${r}`).not.toContain(r);
    }
  });
  it('読みを聞いて字を選ぶ: 外れは流した読みをどの読みにも持たない字', () => {
    const qs = makeKanjiReadQuiz(1, 10, seeded(5)).filter((q) => q.kind === 'kanji-listen');
    for (const q of qs) {
      const c = q.answer.name;
      const reading = kanjiReading(c);
      expect(q.key).toBe(q.answer.id);
      expect(q.choices.length).toBe(3);
      expect(q.choices.some((w) => w.id === q.answer.id)).toBe(true);
      for (const w of q.choices)
        if (w.id !== q.answer.id) expect(READINGS[w.name], `${c} ${w.name}`).not.toContain(reading);
    }
  });
  it('かきクイズは 5 問、同じ読みを持つ字を全部 accept に入れる', () => {
    const ws = makeKanjiWriteQuiz(2, 5, seeded(6));
    expect(ws.length).toBe(5);
    for (const w of ws) {
      expect(w.kind).toBe('kanji');
      expect(w.accept).toContain(w.word.name);
      for (const c of w.accept!) expect(READINGS[c]).toContain(kanjiReading(w.word.name));
    }
    const kou = makeKanjiWriteQuiz(1, 240, seeded(7)).find((w) => w.word.name === '工')!;
    expect(kou.accept).toEqual(expect.arrayContaining(['工', '公']));
  });
  it('makeReadQuiz / makeWriteQuiz は かんじ をこちらに委譲する', () => {
    expect(makeReadQuiz('kanji', 1, 10, seeded(8)).every((q) => q.kind.startsWith('kanji-'))).toBe(true);
    expect(makeWriteQuiz('kanji', 1, 5, seeded(8)).every((q) => q.kind === 'kanji')).toBe(true);
  });
});
