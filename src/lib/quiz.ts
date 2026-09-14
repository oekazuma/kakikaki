import { WORDS, type Word } from './words';
import { lettersOf, type Lang } from './lang.svelte';

export type Level = 1 | 2 | 3;
export type Kind = 'read' | 'write';
export const LEVEL_NAME: Record<Level, string> = { 1: 'かんたん', 2: 'ふつう', 3: 'むずかしい' };
export const QUESTIONS: Record<Kind, number> = { read: 10, write: 5 };

// 文字数で級を決める。分布が各級 60 語前後になる境目
export function levelOf(w: Word, l: Lang): Level {
  const n = lettersOf(w, l).length;
  if (l !== 'en') return n <= 2 ? 1 : n === 3 ? 2 : 3;
  return n <= 4 ? 1 : n <= 6 ? 2 : 3;
}
export const wordsOf = (l: Lang, level: Level) => WORDS.filter((w) => levelOf(w, l) === level);

// よみクイズ: word→picture は文字を見てイラストを選ぶ、picture→word はイラストを見て文字を選ぶ
export type ReadQ = { kind: 'word' | 'picture'; answer: Word; choices: Word[] };

export function shuffle<T>(arr: T[], rnd = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 選択肢: 同じカテゴリ優先。むずかしい（Level 3）はさらに同じ文字数を優先して紛らわしくする
export function pickChoices(answer: Word, pool: Word[], l: Lang, level: Level, rnd = Math.random): Word[] {
  const others = pool.filter((w) => w.id !== answer.id);
  const len = lettersOf(answer, l).length;
  const tiers = [
    others.filter((w) => w.category === answer.category && (level < 3 || lettersOf(w, l).length === len)),
    others.filter((w) => w.category === answer.category),
    others
  ];
  const picked: Word[] = [];
  for (const t of tiers) {
    for (const w of shuffle(t, rnd)) {
      if (picked.length === 2) break;
      if (!picked.some((p) => p.id === w.id)) picked.push(w);
    }
    if (picked.length === 2) break;
  }
  return shuffle([answer, ...picked], rnd);
}

export function makeReadQuiz(l: Lang, level: Level, n = QUESTIONS.read, rnd = Math.random): ReadQ[] {
  const pool = wordsOf(l, level);
  return shuffle(pool, rnd)
    .slice(0, n)
    .map((answer, i) => ({
      kind: i % 2 === 0 ? 'word' : 'picture',
      answer,
      choices: pickChoices(answer, pool, l, level, rnd)
    }));
}

export const makeWriteQuiz = (l: Lang, level: Level, n = QUESTIONS.write, rnd = Math.random): Word[] =>
  shuffle(wordsOf(l, level), rnd).slice(0, n);
