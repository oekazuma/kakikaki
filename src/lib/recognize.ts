import { centroid, clamp, dist, length, nearestDist, pathToPoints, resampleN, translate, type Pt } from './geometry';

// 調整ノブ。iPad で実際に子どもが書いた結果を見て変える。
// WHOLE: 画数が違うときの全体形照合に足す下駄、RETRACE: この距離以内で前の画をなぞり直した画は捨てる
export const RECOG = { N: 32, PENALTY_STROKE: 40, MARGIN: 8, D_MAX: 30, WHOLE: 5, RETRACE: 6 };

type Shape = { strokes: Pt[][]; whole: Pt[] };
type Template = { char: string } & Shape;

// 各画を N 点にそろえ、全体の重心をマスの中央へ寄せる（拡大縮小はしない）。
// whole は画の切れ目を無視して全体を 1 本の点列にしたもの（画をつなげて書いた・途中で離した場合の照合用）
function normalize(strokes: Pt[][]): Shape {
  const rs = strokes.filter((s) => s.length > 0).map((s) => resampleN(s, RECOG.N));
  if (rs.length === 0) return { strokes: [], whole: [] };
  const c = centroid(rs.flat());
  const whole = resampleN(strokes.flat(), RECOG.N * rs.length);
  const w = centroid(whole);
  return {
    strokes: rs.map((s) => translate(s, 54.5 - c.x, 54.5 - c.y)),
    whole: translate(whole, 54.5 - w.x, 54.5 - w.y)
  };
}

// 前の画の上をもう一度なぞっただけの画（子どもがよくやる）は判定に入れない。
// 点をぽつんと足しただけの短い画は消さないよう、長さが半分以上あるものだけを重複とみなす
function dropRetraces(strokes: Pt[][]): Pt[][] {
  const keep: Pt[][] = [];
  for (const s of strokes) {
    const dup = keep.some((k) => length(s) >= length(k) / 2 && s.every((p) => nearestDist(p, k) < RECOG.RETRACE));
    if (!dup) keep.push(s);
  }
  return keep;
}

export const makeTemplates = (strokes: Record<string, string[]>): Template[] =>
  Object.entries(strokes).map(([char, ds]) => ({ char, ...normalize(ds.map((d) => pathToPoints(d, 1.5))) }));

// 文字セットごとにテンプレートを 1 回だけ作る
const cache = new WeakMap<Record<string, string[]>, Template[]>();
export function templatesFor(strokes: Record<string, string[]>): Template[] {
  let t = cache.get(strokes);
  if (!t) {
    t = makeTemplates(strokes);
    cache.set(strokes, t);
  }
  return t;
}

function strokeDist(a: Pt[], b: Pt[]) {
  let d = 0;
  for (let k = 0; k < RECOG.N; k++) d += dist(a[k], b[k]);
  return d / RECOG.N;
}

// 画ごとの距離。書き順は問わず、各入力画に最も近い未使用のお手本画を貪欲に当てる
function strokesDist(a: Pt[][], b: Pt[][]) {
  const used = new Set<number>();
  let sum = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    let best = Infinity,
      bj = -1;
    for (let j = 0; j < b.length; j++) {
      if (used.has(j)) continue;
      const d = strokeDist(a[i], b[j]);
      if (d < best) {
        best = d;
        bj = j;
      }
    }
    used.add(bj);
    sum += best;
  }
  return sum / Math.min(a.length, b.length) + Math.abs(a.length - b.length) * RECOG.PENALTY_STROKE;
}

function wholeDist(a: Pt[], b: Pt[]) {
  const n = Math.min(a.length, b.length);
  const ra = resampleN(a, n),
    rb = resampleN(b, n);
  let d = 0;
  for (let k = 0; k < n; k++) d += dist(ra[k], rb[k]);
  return d / n;
}

function distance(a: Shape, b: Shape) {
  if (a.strokes.length === 0) return Infinity;
  const d = strokesDist(a.strokes, b.strokes);
  return a.strokes.length === b.strokes.length ? d : Math.min(d, wholeDist(a.whole, b.whole) + RECOG.WHOLE);
}

export function recognize(strokes: Pt[][], templates: Template[]) {
  const input = normalize(dropRetraces(strokes));
  return templates.map((t) => ({ char: t.char, dist: distance(input, t) })).sort((p, q) => p.dist - q.dist);
}

export function passes(target: string, results: { char: string; dist: number }[]) {
  const i = results.findIndex((r) => r.char === target);
  if (i === 0) return results[0].dist < RECOG.D_MAX * 2;
  return i === 1 && results[1].dist - results[0].dist < RECOG.MARGIN;
}

export const testScore = (d: number) => 1 - clamp(d / RECOG.D_MAX, 0, 1);
