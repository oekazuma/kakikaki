// iOS 版（非公開リポジトリ）が取り込むデータ。KK_IOS_EXPORT=1 で書き、普段はコミット済みの中身と同じかを検査する。
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STROKES } from './strokes';
import { STROKES_KANA } from './strokes-kana';
import { STROKES_EN } from './strokes-en';
import { STROKES_KANJI } from './strokes-kanji';
import { centroid, pathToPoints, resampleN, translate, type Pt } from './geometry';
import { advance, coverage, traceDone } from './judge';
import { stars, strokeScore } from './score';
import { makeTemplates, passes, recognize } from './recognize';
import { Tracer } from './tracer.svelte';
import { KANJI, READINGS, readingLabel, readingSpeech } from './kanji';
import { CAT_LABEL, WORDS, charWord } from './words';
import { LANGS, charsOf, lettersOf, nameOf, subOf } from './lang.svelte';
import { speechOf } from './audio';
import { GROUP_LABEL, ROWS, badgesOf, rowLabel, computeStats, earnedBadges, nextBadge } from './badges';
import { display, isBirth, schoolGrade } from './grade';
import { streak } from './streak';
import { kanjiByReading } from './kanji';
import { SEION, GROUPS, GROUP_NAME, ALPHABET, DIGITS, toKatakana } from './chars';
import type { Tolerance } from './judge';

const WRITE = process.env.KK_IOS_EXPORT === '1';
const files = new Map<string, string>();
const emit = (path: string, value: unknown) => files.set(path, JSON.stringify(value) + '\n');

// 並びは Object.keys の順（en は数字が先頭）。Swift 側はこれをテンプレートの順として使う。
const toList = (s: Record<string, string[]>) => Object.entries(s).map(([c, d]) => ({ c, d }));

emit('strokes/ja.json', toList(STROKES));
emit('strokes/kana.json', toList(STROKES_KANA));
emit('strokes/en.json', toList(STROKES_EN));
emit('strokes/kanji.json', toList(STROKES_KANJI));

// 点は [x, y]。Swift 側の Codable がこの形を読む
const P = (pts: Pt[]) => pts.map((p) => [p.x, p.y]);

// 種を固定した乱数（mulberry32）。ケースを毎回同じにするため
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ALL = { ...STROKES, ...STROKES_KANA, ...STROKES_EN, ...STROKES_KANJI };
const jitter = (pts: Pt[], amp: number, r: () => number) =>
  pts.map((p) => ({ x: p.x + (r() * 2 - 1) * amp, y: p.y + (r() * 2 - 1) * amp }));

{
  const ds = [...'あぱっーアヲAg0一右曜書'].flatMap((c) => ALL[c]);
  ds.push('M10,10h20v20H10Z', 'm5,5l10,0c5,0,10,5,10,10s5,10,10,10', 'M1e1,2.5L.5-.5', 'M0,0C0,0,0,0,0,0', 'M3,3');
  const pathCases = ds.flatMap((d) => [1.5, 2].map((step) => ({ d, step, out: P(pathToPoints(d, step)) })));
  const lines = ds.slice(0, 12).map((d) => pathToPoints(d));
  const same = Array.from({ length: 5 }, () => ({ x: 7, y: 8 }));
  emit('parity/geometry.json', {
    pathToPoints: pathCases,
    resampleN: [...lines, same].flatMap((pts) => [32, 2].map((n) => ({ pts: P(pts), n, out: P(resampleN(pts, n)) }))),
    centroid: [lines[0], lines[5], same].map((pts) => ({ pts: P(pts), out: P([centroid(pts)])[0] }))
  });
}

{
  const lines = [pathToPoints(STROKES['あ'][0]), pathToPoints(STROKES_KANJI['書'][0])];
  // samples[i] から線の法線方向に d だけ離した点
  const off = (s: Pt[], i: number, d: number): Pt => {
    const a = s[Math.max(0, i - 1)],
      b = s[Math.min(s.length - 1, i + 1)];
    const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: s[i].x - ((b.y - a.y) / L) * d, y: s[i].y + ((b.x - a.x) / L) * d };
  };
  const adv = lines.flatMap((s) =>
    [0, Math.floor(s.length / 2), s.length - 3].flatMap((cursor) => {
      const ps = [
        s[Math.min(cursor + 3, s.length - 1)],
        off(s, Math.min(cursor + 3, s.length - 1), 11.9),
        off(s, Math.min(cursor + 3, s.length - 1), 12.1),
        { x: s[cursor].x + 13.9, y: s[cursor].y },
        { x: s[cursor].x + 40, y: s[cursor].y + 40 }
      ];
      return ps.flatMap((p) =>
        [12, 15].flatMap((r) =>
          [8, 20].map((k) => ({ samples: P(s), cursor, p: [p.x, p.y], r, k, out: advance(s, cursor, p, r, k) }))
        )
      );
    })
  );
  const done = lines.flatMap((s) =>
    [0, 4, 5].flatMap((back) =>
      [0, 0.2].map((end) => {
        const cursor = s.length - 1 - back;
        return { samples: P(s), cursor, end, out: traceDone(s, cursor, end) };
      })
    )
  );
  const cov = lines.flatMap((s) =>
    [s, translate(s, 8.9, 0), translate(s, 9.1, 0), []].map((trail) => ({
      samples: P(s),
      trail: P(trail),
      out: coverage(s, trail)
    }))
  );
  emit('parity/judge.json', { advance: adv, traceDone: done, coverage: cov });

  const r = rng(1);
  const sc = lines.flatMap((s) =>
    [s, [...s].reverse(), translate(s, 3, 0), jitter(s, 2, r), []].map((trail) => ({
      trail: P(trail),
      samples: P(s),
      out: strokeScore(trail, s)
    }))
  );
  emit('parity/score.json', {
    strokeScore: sc,
    stars: [0.64, 0.65, 0.84, 0.85, 1].map((score) => ({ score, out: stars(score) }))
  });
}

const SETS = { ja: STROKES, kana: STROKES_KANA, en: STROKES_EN, kanji: STROKES_KANJI };
type L = keyof typeof SETS;
const pts2 = (lang: L, c: string) => SETS[lang][c].map((d) => pathToPoints(d, 2));

{
  const r = rng(2);
  const pick = (cs: string[], n: number) => Array.from({ length: n }, (_, i) => cs[Math.floor((i * cs.length) / n)]);
  const kanji = KANJI.flatMap((g) => {
    const cs = [...g.chars];
    return [cs[0], cs[Math.floor(cs.length / 4)], cs[Math.floor(cs.length / 2)], cs.at(-1)!];
  });
  type Case = { lang: L; strokes: Pt[][]; targets: string[] };
  const cases: Case[] = [];
  for (const [lang, cs] of [
    ['ja', pick(Object.keys(STROKES), 10)],
    ['kana', pick(Object.keys(STROKES_KANA), 10)],
    ['en', pick(Object.keys(STROKES_EN), 10)],
    ['kanji', kanji]
  ] as [L, string[]][])
    for (const c of cs) {
      const s = pts2(lang, c);
      cases.push({ lang, strokes: s, targets: [c] });
      cases.push({ lang, strokes: s.map((st) => jitter(translate(st, 6, -4), 2, r)), targets: [c] });
    }
  cases.push({ lang: 'ja', strokes: pts2('ja', 'あ').slice(0, 2), targets: ['あ'] });
  cases.push({ lang: 'en', strokes: [...pts2('en', 'i'), [{ x: 50, y: 50 }]], targets: ['i'] });
  cases.push({ lang: 'ja', strokes: [], targets: ['あ'] });
  cases.push({ lang: 'en', strokes: pts2('en', 'I'), targets: ['l'] });
  cases.push({ lang: 'en', strokes: pts2('en', 'O'), targets: ['0'] });
  cases.push({ lang: 'kanji', strokes: pts2('kanji', '公'), targets: ['工', '公'] });
  const tpl = Object.fromEntries(Object.entries(SETS).map(([k, v]) => [k, makeTemplates(v)]));
  emit(
    'parity/recognize.json',
    cases.map(({ lang, strokes, targets }) => {
      const res = recognize(strokes, tpl[lang]);
      return {
        lang,
        strokes: strokes.map(P),
        top: res.slice(0, 5).map(({ char, dist }) => ({ c: char, dist })), // Infinity は JSON で null になる
        targets,
        passes: passes(targets, res)
      };
    })
  );
}

{
  type Ev =
    | { t: 'down' | 'move'; x: number; y: number; p?: number; id: number }
    | { t: 'up'; id: number }
    | { t: 'undo' | 'judge' | 'result' };
  const drag = (pts: Pt[], id = 0, p?: (i: number) => number): Ev[] => [
    { t: 'down', x: pts[0].x, y: pts[0].y, ...(p ? { p: p(0) } : {}), id },
    ...pts.map((q, i): Ev => ({ t: 'move', x: q.x, y: q.y, ...(p ? { p: p(i) } : {}), id })),
    { t: 'up', id }
  ];
  const r = rng(3);
  const a = pts2('ja', 'あ');
  const half = (s: Pt[]) => [s.slice(0, Math.ceil(s.length / 2)), s.slice(Math.ceil(s.length / 2) - 1)];
  const kaki = pts2('kanji', '書');
  const K: Tolerance = { r: 15, end: 0.2 };
  const cases: {
    lang: L;
    char: string;
    mode: 'trace' | 'free' | 'test';
    accept?: string[];
    tol?: Tolerance;
    events: Ev[];
  }[] = [
    { lang: 'ja', char: 'あ', mode: 'trace', events: [...a.flatMap((s) => drag(s)), { t: 'result' }] },
    {
      lang: 'ja',
      char: 'あ',
      mode: 'trace',
      events: [
        ...drag(a[0].slice(0, 5)).slice(0, -1),
        { t: 'move', x: a[0][4].x, y: a[0][4].y + 20, id: 0 },
        { t: 'up', id: 0 }
      ]
    },
    { lang: 'ja', char: 'あ', mode: 'trace', events: [{ t: 'down', x: 100, y: 100, id: 0 }] },
    {
      lang: 'kanji',
      char: '書',
      mode: 'trace',
      tol: K,
      events: [...kaki.flatMap((s) => drag(s.slice(0, Math.ceil(s.length * 0.85)))), { t: 'result' }]
    },
    { lang: 'ja', char: 'あ', mode: 'trace', events: drag(a[0], 0, (i) => 0.3 + (0.5 * i) / a[0].length) },
    {
      lang: 'ja',
      char: 'あ',
      mode: 'trace',
      events: [{ t: 'down', x: a[0][0].x, y: a[0][0].y, id: 0 }, ...drag(a[1], 1), ...drag(a[0]).slice(1)]
    },
    {
      lang: 'ja',
      char: 'あ',
      mode: 'free',
      events: [
        ...drag(jitter(a[0], 2, r)),
        ...half(jitter(a[1], 2, r)).flatMap((s) => drag(s)),
        ...drag(jitter(a[2], 2, r)),
        { t: 'result' }
      ]
    },
    {
      lang: 'ja',
      char: 'あ',
      mode: 'free',
      events: [...drag(a[0]), ...drag(half(a[1])[0]), { t: 'undo' }, { t: 'undo' }, { t: 'undo' }]
    },
    { lang: 'ja', char: 'あ', mode: 'test', events: [...a.flatMap((s) => drag(s)), { t: 'judge' }, { t: 'judge' }] },
    {
      lang: 'ja',
      char: 'あ',
      mode: 'test',
      events: [...a.flatMap((s) => drag(s)), { t: 'down', x: 10, y: 10, id: 0 }, { t: 'up', id: 0 }, { t: 'judge' }]
    },
    // 指が速いとき（1 回で約 18 単位）。先読み幅が動いた距離で広がらないと cursor が遅れる
    {
      lang: 'ja',
      char: 'あ',
      mode: 'trace',
      events: drag(a[0].filter((_, i) => i % 9 === 0 || i === a[0].length - 1))
    },
    // 水 の右の 2 画を続けて書くと 3 画になり 小 が 1 位になる。案内は似た字ではなく画数（want）
    {
      lang: 'kanji',
      char: '水',
      mode: 'test',
      events: [
        ...(([s1, s2, s3, s4]) => [s1, s2, [...s3, ...s4]])(pts2('kanji', '水')).flatMap((s) => drag(s)),
        { t: 'judge' }
      ]
    },
    // 1 画目を 2 本に分けて書くと、書いた字が 1 位のまま画数違いで落ちる（top は空）
    {
      lang: 'ja',
      char: 'ぼ',
      mode: 'test',
      events: [...[...half(pts2('ja', 'ぼ')[0]), ...pts2('ja', 'ぼ').slice(1)].flatMap((s) => drag(s)), { t: 'judge' }]
    },
    { lang: 'ja', char: 'ぬ', mode: 'test', events: [...pts2('ja', 'め').flatMap((s) => drag(s)), { t: 'judge' }] },
    {
      lang: 'kanji',
      char: '工',
      mode: 'test',
      accept: ['工', '公'],
      events: [...pts2('kanji', '公').flatMap((s) => drag(s)), { t: 'judge' }]
    }
  ];
  emit(
    'parity/tracer.json',
    cases.map(({ lang, char, mode, accept = [char], tol = { r: 12, end: 0 }, events }) => {
      const t = new Tracer(char, SETS[lang], mode, accept, tol);
      const out: unknown[] = [];
      const state: unknown[] = [];
      for (const e of events) {
        if (e.t === 'down') out.push(t.down({ x: e.x, y: e.y, p: e.p }, e.id));
        else if (e.t === 'move') out.push(t.move({ x: e.x, y: e.y, p: e.p }, e.id));
        else if (e.t === 'up') out.push(t.up(e.id));
        else if (e.t === 'undo') out.push(t.undo());
        else if (e.t === 'judge') out.push(t.judge());
        else out.push(t.result());
        state.push({ si: t.si, cursor: t.cursor, tracing: t.tracing, trails: t.trails.length, pr: t.pr.length });
      }
      return { lang, char, mode, accept, tol, events, out, state };
    })
  );
}

// 単語・文字・漢字の読み。ここは KanjiVG を含まない（MIT）
emit(
  'catalog/words.json',
  WORDS.map(({ id, name, en, category }) => ({ id, name, en, category }))
);
emit('catalog/chars.json', Object.fromEntries(LANGS.map((l) => [l, charsOf(l)])));
emit(
  'catalog/kanji.json',
  KANJI.map((k) => ({ grade: k.grade, chars: k.chars.map((c) => ({ c, r: READINGS[c] })) }))
);
{
  const words = [...WORDS, ...[...'あアAa一'].map(charWord)];
  emit('parity/text.json', {
    words: words.map((w) => ({
      id: w.id,
      ...Object.fromEntries(LANGS.map((l) => [l, { name: nameOf(w, l), sub: subOf(w, l), letters: lettersOf(w, l) }]))
    })),
    speech: Object.fromEntries(LANGS.map((l) => [l, Object.fromEntries(charsOf(l).map((c) => [c, speechOf(c, l)]))])),
    readings: Object.values(READINGS)
      .flat()
      .map((r) => ({ r, label: readingLabel(r), speech: readingSpeech(r) }))
  });
}

// メダル・集計・連続日数・行の分け方・五十音の表。ここも KanjiVG を含まない
{
  const r = rng(7);
  const kata = (g: string[][]) => g.map((col) => col.map(toKatakana));
  const gojuon = (l: (typeof LANGS)[number]) =>
    l === 'ja' || l === 'kana'
      ? [{ name: '', cols: SEION }, ...GROUPS].map((g) => ({
          name: g.name,
          grid: l === 'kana' ? kata(g.cols) : g.cols,
          vertical: true
        }))
      : l === 'en'
        ? [
            { name: 'おおもじ', grid: ALPHABET.slice(0, 2), vertical: false },
            { name: 'こもじ', grid: ALPHABET.slice(2), vertical: false },
            { name: 'すうじ', grid: [DIGITS], vertical: false }
          ]
        : [];
  const statsCases = (l: (typeof LANGS)[number]) => {
    const visible = badgesOf(l).filter((b) => !b.secret);
    return [0, 1, 0.3, 0.6, 0.9, 0.05].map((rate) => {
      const all = rate === 1;
      const cleared = new Set(charsOf(l).filter(() => all || r() < rate));
      const gold = new Set([...cleared].filter(() => all || r() < rate));
      const done = new Set(WORDS.filter(() => all || r() < rate).map((w) => w.id));
      const quiz = Object.fromEntries(
        ['read', 'write'].flatMap((k) => [1, 2, 3, 4, 5, 6].map((lv) => [`${k}${lv}`, Math.floor(r() * 14 * rate)]))
      );
      const s = computeStats(
        l,
        (c) => cleared.has(c),
        (c) => gold.has(c),
        (id) => done.has(id),
        Math.floor(r() * 40 * rate),
        quiz,
        Math.floor(r() * 9 * rate)
      );
      const earned = Object.fromEntries(visible.filter(() => r() < rate).map((b) => [b.id, '2026-11-09']));
      return {
        cleared: [...cleared],
        gold: [...gold],
        done: [...done],
        days: s.days,
        quiz,
        streak: s.streak,
        stats: { ...s, balloons: undefined, balloon: undefined, eggs: undefined, pinball: undefined },
        need: Object.fromEntries(visible.map((b) => [b.id, b.need(s)])),
        earned,
        earnedBadges: earnedBadges(l, s)
          .filter((b) => !b.secret)
          .map((b) => b.id),
        next: nextBadge(visible, s, earned)?.id ?? null
      };
    });
  };
  const days = ['2026-11-07', '2026-11-08', '2026-11-09', '2026-10-31', '2026-11-01', '2026-11-08'];
  emit('parity/medals.json', {
    rows: Object.fromEntries(LANGS.map((l) => [l, ROWS[l].map(({ name, chars }) => ({ name, chars }))])),
    kanjiByReading: kanjiByReading(),
    gojuon: Object.fromEntries(LANGS.map((l) => [l, gojuon(l)])),
    badges: Object.fromEntries(
      LANGS.map((l) => [
        l,
        badgesOf(l)
          .filter((b) => !b.secret)
          .map(({ id, group, emoji, name, desc, shared }) => ({ id, group, emoji, name, desc, shared: !!shared }))
      ])
    ),
    stats: Object.fromEntries(LANGS.map((l) => [l, statsCases(l)])),
    streak: [
      [[], '2026-11-09'],
      [['2026-11-09'], '2026-11-09'],
      [['2026-11-08'], '2026-11-09'],
      [['2026-11-07'], '2026-11-09'],
      [days, '2026-11-09'],
      [days, '2026-11-10'],
      [['2026-10-31', '2026-11-01'], '2026-11-01'],
      [['2026-02-28', '2026-03-01', '2026-03-02'], '2026-03-02']
    ].map(([d, t]) => ({ days: d, today: t, out: streak(d as string[], t as string) }))
  });
}

{
  const T = '2026-11-11';
  const births = ['2019-04-02', '2019-04-01', '2020-02-29', '2020-04-01', '2014-01-15', '1990-06-01', '2024-01-01'];
  const todays = ['2026-03-31', '2026-04-01', '2026-11-11', '2025-04-01'];
  const texts = [
    '{練習|れんしゅう}',
    '{見|み}る',
    'お{手本|てほん}なし',
    'おてほんなしで {書|か}いてみよう！ もう{一度|いちど}',
    'せんの かずは 4 ほんだよ',
    '1 {日|にち} 1 {回|かい}',
    'A を かく',
    'ピンボール かいすう',
    '{戻|もど}る',
    ...LANGS.flatMap((l) => badgesOf(l).flatMap((b) => [b.name, b.desc]))
  ];
  emit('parity/grade.json', {
    grade: births.flatMap((birth) => todays.map((today) => ({ birth, today, out: schoolGrade(birth, today) }))),
    isBirth: [
      '2019-05-01',
      T,
      '2026-11-12',
      '1926-11-11',
      '1926-11-10',
      '2019-02-30',
      '2019-5-1',
      '2019-05-01x',
      ''
    ].map((s) => ({ s, today: T, out: isBirth(s, T) })),
    display: [
      ...texts.flatMap((text) =>
        [0, 2, 3, 6, 7].map((grade) => ({ text, grade, hidden: [], out: display(text, grade) }))
      ),
      ...[['手'], ['目'], ['書', '見']].map((hidden) => ({
        text: 'お{手本|てほん}なしで {書|か}いて {見|み}る',
        grade: 6,
        hidden,
        out: display('お{手本|てほん}なしで {書|か}いて {見|み}る', 6, hidden)
      })),
      { text: '{見|み}る', grade: null, hidden: [], out: display('{見|み}る', null) }
    ],
    labels: {
      badgeGroups: GROUP_LABEL,
      cats: CAT_LABEL,
      charGroups: GROUP_NAME,
      rows: Object.fromEntries(LANGS.map((l) => [l, ROWS[l].map(rowLabel)]))
    }
  });
}

describe('ios-data', () => {
  it('文字数', () => {
    expect(toList(STROKES)).toHaveLength(81);
    expect(toList(STROKES_KANA)).toHaveLength(81);
    expect(toList(STROKES_EN)).toHaveLength(62);
    expect(toList(STROKES_KANJI)).toHaveLength(1026);
    expect(WORDS).toHaveLength(224);
  });

  it('いまのコードから作ったものと同じ（違えば pnpm ios:export）', () => {
    for (const [path, body] of files) {
      const abs = `ios-data/${path}`;
      if (WRITE) {
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(abs, body);
      } else expect(readFileSync(abs, 'utf8'), path).toBe(body);
    }
  });
});
