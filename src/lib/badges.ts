import { CHARS, CHARS_EN, CHARS_KANA, SEION, DAKUON, HANDAKUON, KOGAKI, CHOON, ALPHABET, toKatakana } from './chars';
import { CATEGORIES, WORDS, type Word } from './words';
import { lettersOf, type Lang } from './lang.svelte';
import { LEVEL_NAME } from './quiz';

// 進捗の集計。判定関数は progress ストアに依存させず、集計値だけを受け取る
export type Stats = {
  chars: number; // クリアした文字数
  gold: number; // 金の星の文字数
  words: number; // 星のついた単語数
  crowns: number; // 王冠のついた単語数
  rows: Record<string, number>; // 行グループ名 → クリア数
  cats: Record<string, number>; // カテゴリ → 星のついた単語数
  days: number; // 練習した日数
  quiz: Record<string, number>; // read1 など → 正解数
};

type Row = { name: string; chars: string[] };
const ROWS_JA: Row[] = [
  ...SEION.map((r) => ({ name: r.filter(Boolean).join(''), chars: r.filter(Boolean) })),
  { name: 'だくおん', chars: DAKUON.flat().filter(Boolean) },
  { name: 'はんだくおん', chars: HANDAKUON.flat().filter(Boolean) },
  { name: 'ちいさいもじ', chars: [...KOGAKI.flat().filter(Boolean), ...CHOON.flat().filter(Boolean)] }
];
const ROWS_EN: Row[] = ALPHABET.flatMap((row) => [row.slice(0, 7), row.slice(7)]).map((chars) => ({
  name: chars.join(''),
  chars
}));
const ROWS_KANA: Row[] = ROWS_JA.map((r) => ({ name: toKatakana(r.name), chars: r.chars.map(toKatakana) }));
export const ROWS: Record<Lang, Row[]> = { ja: ROWS_JA, kana: ROWS_KANA, en: ROWS_EN };
export const ALL_CHARS: Record<Lang, string[]> = { ja: CHARS, kana: CHARS_KANA, en: CHARS_EN };
export const CAT_TOTAL = Object.fromEntries(CATEGORIES.map((c) => [c, WORDS.filter((w) => w.category === c).length]));
export const TOTAL = (l: Lang) => ({ chars: ALL_CHARS[l].length, words: WORDS.length });

export function computeStats(
  l: Lang,
  charCleared: (c: string) => boolean,
  charGold: (c: string) => boolean,
  dayCount: number,
  quiz: Record<string, number> = {}
): Stats {
  const wordStar = (w: Word) => lettersOf(w, l).every(charCleared);
  const wordCrown = (w: Word) => lettersOf(w, l).every(charGold);
  return {
    chars: ALL_CHARS[l].filter(charCleared).length,
    gold: ALL_CHARS[l].filter(charGold).length,
    words: WORDS.filter(wordStar).length,
    crowns: WORDS.filter(wordCrown).length,
    rows: Object.fromEntries(ROWS[l].map((r) => [r.name, r.chars.filter(charCleared).length])),
    cats: Object.fromEntries(CATEGORIES.map((c) => [c, WORDS.filter((w) => w.category === c && wordStar(w)).length])),
    days: dayCount,
    quiz
  };
}

const CAT_EMOJI: Record<string, string> = {
  のりもの: '🚗',
  どうぶつ: '🐾',
  くだもの: '🍎',
  やさい: '🥕',
  たべもの: '🍙',
  しぜん: '🌈',
  からだ: '🖐️',
  きもち: '😊',
  みのまわり: '🏠',
  あそび: '⚽'
};

export type Badge = {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  need: (s: Stats) => [have: number, need: number];
};

const count = (id: string, emoji: string, name: string, desc: string, need: (s: Stats) => [number, number]): Badge => ({
  id,
  emoji,
  name,
  desc,
  need
});

export function badgesOf(l: Lang): Badge[] {
  const T = TOTAL(l);
  const all = l === 'ja' ? 'ひらがな' : l === 'kana' ? 'かたかな' : 'あるふぁべっと';
  return [
    count('first-char', '🌱', 'はじめの いっぽ', 'もじを 1つ クリア', (s) => [s.chars, 1]),
    count('first-word', '🎈', 'はじめての たんご', 'たんごに はじめて ほしが ついた', (s) => [s.words, 1]),
    count('first-gold', '✨', 'はじめての きんのほし', 'おてほんなしで はじめて ごうかく', (s) => [s.gold, 1]),
    count('first-crown', '👑', 'はじめての おうかん', 'たんごの ぜんぶの もじが きんのほし', (s) => [s.crowns, 1]),
    count('chars-10', '🔟', 'もじ 10', 'もじを 10こ クリア', (s) => [s.chars, 10]),
    count('chars-30', '📘', 'もじ 30', 'もじを 30こ クリア', (s) => [s.chars, 30]),
    count('chars-50', '📗', 'もじ 50', 'もじを 50こ クリア', (s) => [s.chars, 50]),
    count('chars-all', '🏆', `${all} マスター`, `${T.chars}もじ ぜんぶ クリア`, (s) => [s.chars, T.chars]),
    count('gold-10', '⭐', 'きんのほし 10', 'おてほんなしで 10もじ ごうかく', (s) => [s.gold, 10]),
    count('gold-30', '🌟', 'きんのほし 30', 'おてほんなしで 30もじ ごうかく', (s) => [s.gold, 30]),
    count('gold-all', '💫', 'きんのほし マスター', `おてほんなしで ${T.chars}もじ ぜんぶ ごうかく`, (s) => [
      s.gold,
      T.chars
    ]),
    ...ROWS[l].map((r) =>
      count(`row-${r.name}`, r.chars[0], `${r.name} マスター`, `${r.name}を ぜんぶ クリア`, (s) => [
        s.rows[r.name],
        r.chars.length
      ])
    ),
    count('words-10', '🎒', 'たんご 10', '10この たんごに ほし', (s) => [s.words, 10]),
    count('words-50', '🚌', 'たんご 50', '50この たんごに ほし', (s) => [s.words, 50]),
    count('words-100', '🚀', 'たんご 100', '100この たんごに ほし', (s) => [s.words, 100]),
    count('words-all', '🎖️', 'たんご マスター', 'ぜんぶの たんごに ほし', (s) => [s.words, T.words]),
    ...CATEGORIES.map((c) =>
      count(`cat-${c}`, CAT_EMOJI[c] ?? '🏅', `${c} はかせ`, `${c}の たんごに ぜんぶ ほし`, (s) => [
        s.cats[c],
        CAT_TOTAL[c]
      ])
    ),
    count('crowns-10', '👸', 'おうかん 10', '10この たんごに おうかん', (s) => [s.crowns, 10]),
    count('crowns-all', '🏰', 'おうかん マスター', 'ぜんぶの たんごに おうかん', (s) => [s.crowns, T.words]),
    ...(['read', 'write'] as const).flatMap((k) => {
      const kn = k === 'read' ? 'よみクイズ' : 'かきクイズ';
      const em = k === 'read' ? '👀' : '✍️';
      return [
        ...([1, 2, 3] as const).map((lv) =>
          count(`${k}-${lv}`, em, `${kn} ${LEVEL_NAME[lv]}`, `${kn}の ${LEVEL_NAME[lv]}で 10もん せいかい`, (s) => [
            Math.min(10, s.quiz[`${k}${lv}`] ?? 0),
            10
          ])
        ),
        count(
          `${k}-all`,
          k === 'read' ? '🧠' : '🖋️',
          `${kn} マスター`,
          `${kn}の ぜんぶの きゅうで 10もん せいかい`,
          (s) => [[1, 2, 3].filter((lv) => (s.quiz[`${k}${lv}`] ?? 0) >= 10).length, 3]
        )
      ];
    }),
    count('days-3', '📅', '3にち れんしゅう', '3にち れんしゅうした', (s) => [s.days, 3]),
    count('days-7', '🗓️', '7にち れんしゅう', '7にち れんしゅうした', (s) => [s.days, 7]),
    count('days-30', '🎂', '30にち れんしゅう', '30にち れんしゅうした', (s) => [s.days, 30])
  ];
}

export const earnedBadges = (l: Lang, s: Stats) =>
  badgesOf(l).filter((b) => {
    const [h, n] = b.need(s);
    return h >= n;
  });
