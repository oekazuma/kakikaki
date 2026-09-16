import { SEION, DAKUON, HANDAKUON, KOGAKI, CHOON, ALPHABET, DIGITS, toKatakana } from './chars';
import { CATEGORIES, WORDS, type Word } from './words';
import { charsOf, lettersOf, type Lang } from './lang.svelte';
import { KANJI } from './kanji';
import { levelName } from './quiz';

// 進捗の集計。判定関数は progress ストアに依存させず、集計値だけを受け取る
export type Stats = {
  chars: number; // クリアした文字数
  gold: number; // 金の星の文字数
  words: number; // 星のついた単語数
  crowns: number; // 王冠のついた単語数
  rows: Record<string, number>; // 行グループ名 → クリア数
  cats: Record<string, number>; // カテゴリ → 星のついた単語数
  days: number; // 練習した日数
  streak: number; // 連続で練習した日数（全ことば をまたいで数える）
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
const ROWS_KANJI: Row[] = KANJI;
export const ROWS: Record<Lang, Row[]> = { ja: ROWS_JA, kana: ROWS_KANA, kanji: ROWS_KANJI, en: ROWS_EN };
export const CAT_TOTAL = Object.fromEntries(CATEGORIES.map((c) => [c, WORDS.filter((w) => w.category === c).length]));
// かんじ は単語を持たない（1 文字練習だけ）。単語の合計が 0 の ことば では単語系のメダル・表示を出さない
export const TOTAL = (l: Lang) => ({ chars: charsOf(l).length, words: l === 'kanji' ? 0 : WORDS.length });

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
    chars: charsOf(l).filter(charCleared).length,
    gold: charsOf(l).filter(charGold).length,
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
  'がくねん',
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
  // 判定が ことば をまたぐ（連続日数・かくし要素）ので、獲得も人単位の kk:<pid>:earned に 1 回だけ記録して 4 つの ことば で共有する
  shared?: boolean;
};

type Count = (id: string, group: BadgeGroup, emoji: string, name: string, desc: string, need: Badge['need']) => Badge;
const count: Count = (id, group, emoji, name, desc, need) => ({ id, group, emoji, name, desc, need });

// もじ・きんのほし の刻み。かんじ は 1026 字なので段を多くする
const STEPS: Record<Lang, number[]> = {
  ja: [10, 30, 50],
  kana: [10, 30, 50],
  kanji: [10, 50, 100, 200, 300, 500],
  en: [10, 30, 50]
};
const GOLD_STEPS: Record<Lang, number[]> = {
  ja: [10, 30],
  kana: [10, 30],
  kanji: [10, 50, 100, 200, 300, 500],
  en: [10, 30]
};
const STEP_EMOJI = ['🔟', '📘', '📗', '📙', '📕', '📚'];
const GOLD_EMOJI = ['⭐', '🌟', '✨', '🌠', '☀️', '🌈'];
const ALL_NAME: Record<Lang, string> = { ja: 'ひらがな', kana: 'かたかな', kanji: 'かんじ', en: 'あるふぁべっと' };
// 行メダルの段・絵文字・説明の接尾。かんじ は学年ごとで、絵文字は行の先頭文字ではなく本
const ROW_STYLE = (l: Lang, r: Row): [BadgeGroup, string, string] =>
  l === 'kanji' ? ['がくねん', '📖', 'の かんじ'] : ['ぎょう マスター', r.chars[0], ''];

export function badgesOf(l: Lang): Badge[] {
  const T = TOTAL(l);
  const all = ALL_NAME[l];
  const hasWords = T.words > 0;
  return [
    count('first-char', 'はじめて', '🌱', 'はじめの いっぽ', 'もじを 1つ クリア', (s) => [s.chars, 1]),
    ...(hasWords
      ? [
          count('first-word', 'はじめて', '🎈', 'はじめての たんご', 'たんごに はじめて ほしが ついた', (s) => [
            s.words,
            1
          ])
        ]
      : []),
    count('first-gold', 'はじめて', '✨', 'はじめての きんのほし', 'おてほんなしで はじめて ごうかく', (s) => [
      s.gold,
      1
    ]),
    ...(hasWords
      ? [
          count('first-crown', 'はじめて', '👑', 'はじめての おうかん', 'たんごの ぜんぶの もじが きんのほし', (s) => [
            s.crowns,
            1
          ])
        ]
      : []),
    ...STEPS[l].map((n, k) =>
      count(`chars-${n}`, 'もじ', STEP_EMOJI[k], `もじ ${n}`, `もじを ${n}こ クリア`, (s) => [s.chars, n])
    ),
    count('chars-all', 'もじ', '🏆', `${all} マスター`, `${T.chars}もじ ぜんぶ クリア`, (s) => [s.chars, T.chars]),
    ...GOLD_STEPS[l].map((n, k) =>
      count(`gold-${n}`, 'きんのほし', GOLD_EMOJI[k], `きんのほし ${n}`, `おてほんなしで ${n}もじ ごうかく`, (s) => [
        s.gold,
        n
      ])
    ),
    count(
      'gold-all',
      'きんのほし',
      '💫',
      'きんのほし マスター',
      `おてほんなしで ${T.chars}もじ ぜんぶ ごうかく`,
      (s) => [s.gold, T.chars]
    ),
    ...ROWS[l].map((r) => {
      const [group, emoji, suffix] = ROW_STYLE(l, r);
      return count(`row-${r.name}`, group, emoji, `${r.name} マスター`, `${r.name}${suffix}を ぜんぶ クリア`, (s) => [
        s.rows[r.name],
        r.chars.length
      ]);
    }),
    ...(hasWords
      ? [
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
          ])
        ]
      : []),
    ...(['read', 'write'] as const).flatMap((k) => {
      const kn = k === 'read' ? 'よみクイズ' : 'かきクイズ';
      const em = k === 'read' ? '👀' : '✍️';
      return [
        ...([1, 2, 3] as const).map((lv) =>
          count(
            `${k}-${lv}`,
            'クイズ',
            em,
            `${kn} ${levelName(lv, l)}`,
            `${kn}の ${levelName(lv, l)}で 10もん せいかい`,
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
    ...[
      count('streak-3', 'つづけた ひ', '🔥', '3にち つづけた', '3にち つづけて れんしゅうした', (s) => [s.streak, 3]),
      count('streak-7', 'つづけた ひ', '🏅', '7にち つづけた', '7にち つづけて れんしゅうした', (s) => [s.streak, 7])
    ].map((b) => ({ ...b, shared: true })),
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
    ].map((b) => ({ ...b, secret: true, shared: true }))
  ];
}
// ことば をまたいで共有するメダルの id（どの ことば でも同じ定義）
export const SHARED_IDS = new Set(
  badgesOf('ja')
    .filter((b) => b.shared)
    .map((b) => b.id)
);

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
