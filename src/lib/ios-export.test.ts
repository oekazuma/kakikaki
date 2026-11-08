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

describe('ios-data', () => {
  it('文字数', () => {
    expect(toList(STROKES)).toHaveLength(81);
    expect(toList(STROKES_KANA)).toHaveLength(81);
    expect(toList(STROKES_EN)).toHaveLength(62);
    expect(toList(STROKES_KANJI)).toHaveLength(1026);
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
