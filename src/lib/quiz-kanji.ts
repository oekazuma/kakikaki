import { KANJI, KANJI_ALL, READINGS, kanjiReading } from './kanji';
import { charWord } from './words';
import { shuffle } from './shuffle';
import type { Level, ReadQ, WriteQ } from './quiz';

// かんじ のクイズ。級は学年（Level 1〜3 = 1〜3 年）で、出題はその学年の字だけ。
// quiz.ts とは型だけを共有する（値を import すると循環になる）
const gradeChars = (level: Level) => KANJI[level - 1].chars;
const uniq = <T>(a: T[]) => [...new Set(a)];

// よみクイズ: 字を見て読みを選ぶ（kanji-read）と、読みを聞いて字を選ぶ（kanji-listen）を半分ずつ混ぜる
export function makeKanjiReadQuiz(level: Level, n = 10, rnd = Math.random): ReadQ[] {
  const pool = gradeChars(level);
  const qs = shuffle(pool, rnd)
    .slice(0, n)
    .map((c, i): ReadQ => {
      const reading = kanjiReading(c);
      if (i % 2 === 0) {
        // 外れは同じ学年の別の字の代表の読み。出題した字のどの読みとも一致しないものだけ
        const others = uniq(
          shuffle(
            pool.filter((o) => o !== c),
            rnd
          )
            .map(kanjiReading)
            .filter((r) => !READINGS[c].includes(r))
        ).slice(0, 2);
        return {
          kind: 'kanji-read',
          answer: charWord(c),
          key: reading,
          choices: [charWord(c)],
          letters: shuffle([reading, ...others], rnd)
        };
      }
      // 外れは流した読みをどの読みにも持たない字（き と聞いて 木 と 気 が並ばないように）
      const others = shuffle(
        pool.filter((o) => o !== c && !READINGS[o].includes(reading)),
        rnd
      ).slice(0, 2);
      const answer = charWord(c);
      return { kind: 'kanji-listen', answer, key: answer.id, choices: shuffle([c, ...others], rnd).map(charWord) };
    });
  return shuffle(qs, rnd);
}

// かきクイズ: 読みを見て字を書く。同じ読みを持つ字（440 字の中から）はどれを書いても正解
export function makeKanjiWriteQuiz(level: Level, n = 5, rnd = Math.random): WriteQ[] {
  return shuffle(gradeChars(level), rnd)
    .slice(0, n)
    .map((c) => {
      const reading = kanjiReading(c);
      return { word: charWord(c), kind: 'kanji', accept: KANJI_ALL.filter((o) => READINGS[o].includes(reading)) };
    });
}
