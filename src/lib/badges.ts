import {
  CHARS,
  CHARS_EN,
  CHARS_KANA,
  SEION,
  DAKUON,
  HANDAKUON,
  KOGAKI,
  CHOON,
  ALPHABET,
  DIGITS,
  toKatakana
} from './chars';
import { CATEGORIES, WORDS, type Word } from './words';
import { lettersOf, type Lang } from './lang.svelte';
import { KANJI } from './kanji';
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
  streak: number; // 連続で練習した日数（3 ことば をまたいで数える）
  quiz: Record<string, number>; // read1 など → 正解数
  // かくし要素（ことばをまたいで共有）: ふうせん ぽん の回数と自己ベスト、絵を跳び出させた回数、ピンボールの最高回数
  balloons: number;
  balloon: number;
  eggs: number;
  pinball: number;
};
export type SecretStats = Pick<Stats, 'balloons' | 'balloon' | 'eggs' | 'pinball'>;
export const NO_SECRET: SecretStats = { balloons: 0, balloon: 0, eggs: 0, pinball: 0 };

type Row = { name: string; chars: string[] };
const ROWS_JA: Row[] = [
  ...SEION.map((r) => ({ name: r.filter(Boolean).join(''), chars: r.filter(Boolean) })),
  { name: 'だくおん', chars: DAKUON.flat().filter(Boolean) },
  { name: 'はんだくおん', chars: HANDAKUON.flat().filter(Boolean) },
  { name: 'ちいさいもじ', chars: [...KOGAKI.flat().filter(Boolean), ...CHOON.flat().filter(Boolean)] }
];
const ROWS_EN: Row[] = [
  ...ALPHABET.flatMap((row) => [row.slice(0, 7), row.slice(7)]).map((chars) => ({ name: chars.join(''), chars })),
  { name: 'すうじ', chars: DIGITS }
];
const ROWS_KANA: Row[] = ROWS_JA.map((r) => ({ name: toKatakana(r.name), chars: r.chars.map(toKatakana) }));
const ROWS_KANJI: Row[] = KANJI.map((k) => ({ name: k.name, chars: k.chars }));
export const ROWS: Record<Lang, Row[]> = { ja: ROWS_JA, kana: ROWS_KANA, kanji: ROWS_KANJI, en: ROWS_EN };
const ALL_CHARS: Record<Lang, string[]> = {
  ja: CHARS,
  kana: CHARS_KANA,
  kanji: KANJI.flatMap((k) => k.chars),
  en: CHARS_EN
};
export const CAT_TOTAL = Object.fromEntries(CATEGORIES.map((c) => [c, WORDS.filter((w) => w.category === c).length]));
// かんじ は単語を持たない（1 文字練習だけ）。単語の合計が 0 の ことば では単語系のメダル・表示を出さない
export const TOTAL = (l: Lang) => ({ chars: ALL_CHARS[l].length, words: l === 'kanji' ? 0 : WORDS.length });

export function computeStats(
  l: Lang,
  charCleared: (c: string) => boolean,
  charGold: (c: string) => boolean,
  wordDone: (id: string) => boolean,
  dayCount: number,
  quiz: Record<string, number> = {},
  streak = 0,
  secret: SecretStats = NO_SECRET
): Stats {
  const wordStar = (w: Word) => wordDone(w.id);
  const wordCrown = (w: Word) => wordDone(w.id) && lettersOf(w, l).every(charGold);
  return {
    chars: ALL_CHARS[l].filter(charCleared).length,
    gold: ALL_CHARS[l].filter(charGold).length,
    words: WORDS.filter(wordStar).length,
    crowns: WORDS.filter(wordCrown).length,
    rows: Object.fromEntries(ROWS[l].map((r) => [r.name, r.chars.filter(charCleared).length])),
    cats: Object.fromEntries(CATEGORIES.map((c) => [c, WORDS.filter((w) => w.category === c && wordStar(w)).length])),
    days: dayCount,
    quiz,
    streak,
    ...secret
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
  ひと: '🧑',
  みのまわり: '🏠',
  あそび: '⚽'
};

// 実績画面の見出し
export const BADGE_GROUPS = [
  'はじめて',
  'もじ',
  'きんのほし',
  'ぎょう マスター',
  'たんご',
  'はかせ',
  'おうかん',
  'クイズ',
  'つづけた ひ',
  'かくし'
] as const;
export type BadgeGroup = (typeof BADGE_GROUPS)[number];

export type Badge = {
  id: string;
  group: BadgeGroup; // 実績画面の段
  emoji: string;
  name: string;
  desc: string;
  need: (s: Stats) => [have: number, need: number];
  secret?: boolean; // 取るまで名前と条件を伏せる（実績画面では「？？？」、つぎの めだる にも出さない）
};

type Count = (id: string, group: BadgeGroup, emoji: string, name: string, desc: string, need: Badge['need']) => Badge;
const count: Count = (id, group, emoji, name, desc, need) => ({ id, group, emoji, name, desc, need });

export function badgesOf(l: Lang): Badge[] {
  const T = TOTAL(l);
  const all = l === 'ja' ? 'ひらがな' : l === 'kana' ? 'かたかな' : 'あるふぁべっと';
  return [
    count('first-char', 'はじめて', '🌱', 'はじめの いっぽ', 'もじを 1つ クリア', (s) => [s.chars, 1]),
    count('first-word', 'はじめて', '🎈', 'はじめての たんご', 'たんごに はじめて ほしが ついた', (s) => [s.words, 1]),
    count('first-gold', 'はじめて', '✨', 'はじめての きんのほし', 'おてほんなしで はじめて ごうかく', (s) => [
      s.gold,
      1
    ]),
    count('first-crown', 'はじめて', '👑', 'はじめての おうかん', 'たんごの ぜんぶの もじが きんのほし', (s) => [
      s.crowns,
      1
    ]),
    count('chars-10', 'もじ', '🔟', 'もじ 10', 'もじを 10こ クリア', (s) => [s.chars, 10]),
    count('chars-30', 'もじ', '📘', 'もじ 30', 'もじを 30こ クリア', (s) => [s.chars, 30]),
    count('chars-50', 'もじ', '📗', 'もじ 50', 'もじを 50こ クリア', (s) => [s.chars, 50]),
    count('chars-all', 'もじ', '🏆', `${all} マスター`, `${T.chars}もじ ぜんぶ クリア`, (s) => [s.chars, T.chars]),
    count('gold-10', 'きんのほし', '⭐', 'きんのほし 10', 'おてほんなしで 10もじ ごうかく', (s) => [s.gold, 10]),
    count('gold-30', 'きんのほし', '🌟', 'きんのほし 30', 'おてほんなしで 30もじ ごうかく', (s) => [s.gold, 30]),
    count(
      'gold-all',
      'きんのほし',
      '💫',
      'きんのほし マスター',
      `おてほんなしで ${T.chars}もじ ぜんぶ ごうかく`,
      (s) => [s.gold, T.chars]
    ),
    ...ROWS[l].map((r) =>
      count(`row-${r.name}`, 'ぎょう マスター', r.chars[0], `${r.name} マスター`, `${r.name}を ぜんぶ クリア`, (s) => [
        s.rows[r.name],
        r.chars.length
      ])
    ),
    count('words-10', 'たんご', '🎒', 'たんご 10', '10この たんごに ほし', (s) => [s.words, 10]),
    count('words-50', 'たんご', '🚌', 'たんご 50', '50この たんごに ほし', (s) => [s.words, 50]),
    count('words-100', 'たんご', '🚀', 'たんご 100', '100この たんごに ほし', (s) => [s.words, 100]),
    count('words-all', 'たんご', '🎖️', 'たんご マスター', 'ぜんぶの たんごに ほし', (s) => [s.words, T.words]),
    ...CATEGORIES.map((c) =>
      count(`cat-${c}`, 'はかせ', CAT_EMOJI[c] ?? '🏅', `${c} はかせ`, `${c}の たんごに ぜんぶ ほし`, (s) => [
        s.cats[c],
        CAT_TOTAL[c]
      ])
    ),
    count('crowns-10', 'おうかん', '👸', 'おうかん 10', '10この たんごに おうかん', (s) => [s.crowns, 10]),
    count('crowns-all', 'おうかん', '🏰', 'おうかん マスター', 'ぜんぶの たんごに おうかん', (s) => [
      s.crowns,
      T.words
    ]),
    ...(['read', 'write'] as const).flatMap((k) => {
      const kn = k === 'read' ? 'よみクイズ' : 'かきクイズ';
      const em = k === 'read' ? '👀' : '✍️';
      return [
        ...([1, 2, 3] as const).map((lv) =>
          count(
            `${k}-${lv}`,
            'クイズ',
            em,
            `${kn} ${LEVEL_NAME[lv]}`,
            `${kn}の ${LEVEL_NAME[lv]}で 10もん せいかい`,
            (s) => [Math.min(10, s.quiz[`${k}${lv}`] ?? 0), 10]
          )
        ),
        count(
          `${k}-all`,
          'クイズ',
          k === 'read' ? '🧠' : '🖋️',
          `${kn} マスター`,
          `${kn}の ぜんぶの きゅうで 10もん せいかい`,
          (s) => [[1, 2, 3].filter((lv) => (s.quiz[`${k}${lv}`] ?? 0) >= 10).length, 3]
        )
      ];
    }),
    count('days-3', 'つづけた ひ', '📅', '3にち れんしゅう', '3にち れんしゅうした', (s) => [s.days, 3]),
    count('days-7', 'つづけた ひ', '🗓️', '7にち れんしゅう', '7にち れんしゅうした', (s) => [s.days, 7]),
    count('days-30', 'つづけた ひ', '🎂', '30にち れんしゅう', '30にち れんしゅうした', (s) => [s.days, 30]),
    count('streak-3', 'つづけた ひ', '🔥', '3にち つづけた', '3にち つづけて れんしゅうした', (s) => [s.streak, 3]),
    count('streak-7', 'つづけた ひ', '🏅', '7にち つづけた', '7にち つづけて れんしゅうした', (s) => [s.streak, 7]),
    ...[
      count(
        'balloon-found',
        'かくし',
        '🔍',
        'かくしゲームを みつけた',
        'かくれた ふうせんを みつけて あそんだ',
        (s) => [Math.min(1, s.balloons), 1]
      ),
      ...[500, 1000, 2000, 3000, 5000].map((n, k) =>
        count(
          `balloon-${n}`,
          'かくし',
          '🎈🎉🎆🎇🏆'.match(/./gu)![k],
          `ふうせん ${n}てん`,
          `ふうせん ぽんで ${n}てん`,
          (s) => [Math.min(n, s.balloon), n]
        )
      ),
      count('egg-jump', 'かくし', '🖼️', 'とびだした！', 'たんごカードの えを 10かい タップして とびださせた', (s) => [
        Math.min(1, s.eggs),
        1
      ]),
      ...[100, 200, 300, 500, 1000].map((n, k) =>
        count(
          `pinball-${n}`,
          'かくし',
          '🏓🎯🥉🥈🥇'.match(/./gu)![k],
          `ピンボール ${n}かい`,
          `とびだした えを はじいて かべに ${n}かい あてた`,
          (s) => [Math.min(n, s.pinball), n]
        )
      )
    ].map((b) => ({ ...b, secret: true }))
  ];
}

// つぎに近いメダル: 未獲得のうち達成率が最も高いもの（同率なら残りが少ないもの）
export function nextBadge(badges: Badge[], s: Stats, earned: Record<string, string>): Badge | undefined {
  return badges
    .filter((b) => !earned[b.id] && !b.secret)
    .map((b) => ({ b, r: b.need(s) }))
    .sort((x, y) => y.r[0] / y.r[1] - x.r[0] / x.r[1] || x.r[1] - x.r[0] - (y.r[1] - y.r[0]))[0]?.b;
}

export const earnedBadges = (l: Lang, s: Stats) =>
  badgesOf(l).filter((b) => {
    const [h, n] = b.need(s);
    return h >= n;
  });
