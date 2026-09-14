import { WORDS, type Word } from './words';
import { charsOf, lettersOf, type Lang } from './lang.svelte';

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

// よみクイズの出題形式
//   word: 文字を見てイラストを選ぶ / picture: イラストを見て文字を選ぶ / listen: 聞いてイラストを選ぶ
//   initial: 「り」で はじまる のは？ → イラスト / blank: り？ご の ？ に入る文字を選ぶ（letters が選択肢、key が正解）
export type ReadKind = 'word' | 'picture' | 'listen' | 'initial' | 'blank';
export const READ_KINDS: ReadKind[] = ['word', 'picture', 'listen', 'initial', 'blank'];
export type ReadQ = { kind: ReadKind; answer: Word; choices: Word[]; key: string; letters?: string[]; blank?: number };

export function shuffle<T>(arr: T[], rnd = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 選択肢: 同じカテゴリ優先。むずかしい（Level 3）はさらに同じ文字数を優先して紛らわしくする
export function pickChoices(
  answer: Word,
  pool: Word[],
  l: Lang,
  level: Level,
  rnd = Math.random,
  ok: (w: Word) => boolean = () => true
): Word[] {
  const others = pool.filter((w) => w.id !== answer.id && ok(w));
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

// ？ に入る文字の選択肢: 正解と同じ文字セット（英語は同じ大文字小文字）から 2 つ
function blankLetters(correct: string, l: Lang, rnd: () => number): string[] {
  const lower = correct === correct.toLowerCase();
  const pool = charsOf(l).filter((c) => c !== correct && (l !== 'en' || (c === c.toLowerCase()) === lower));
  return shuffle([correct, ...shuffle(pool, rnd).slice(0, 2)], rnd);
}

export function makeReadQuiz(l: Lang, level: Level, n = QUESTIONS.read, rnd = Math.random): ReadQ[] {
  const pool = wordsOf(l, level);
  // 5 形式を混ぜる。10 問なら各形式 2 回ずつ、順番は毎回変わる
  const order = Array.from({ length: n }, (_, i) => i).flatMap((i) =>
    i % READ_KINDS.length === 0 ? shuffle(READ_KINDS, rnd) : []
  );
  return shuffle(pool, rnd)
    .slice(0, n)
    .map((answer, i) => {
      const letters = lettersOf(answer, l);
      let kind = order[i];
      if (kind === 'blank' && letters.length < 2) kind = 'word'; // 1 文字の語は穴埋めにならない
      if (kind === 'initial') {
        const first = letters[0];
        return {
          kind,
          answer,
          key: answer.id,
          choices: pickChoices(answer, pool, l, level, rnd, (w) => lettersOf(w, l)[0] !== first)
        };
      }
      if (kind === 'blank') {
        const blank = Math.floor(rnd() * letters.length);
        return {
          kind,
          answer,
          key: letters[blank],
          choices: [answer],
          blank,
          letters: blankLetters(letters[blank], l, rnd)
        };
      }
      return { kind, answer, key: answer.id, choices: pickChoices(answer, pool, l, level, rnd) };
    });
}

export const makeWriteQuiz = (l: Lang, level: Level, n = QUESTIONS.write, rnd = Math.random): Word[] =>
  shuffle(wordsOf(l, level), rnd).slice(0, n);
