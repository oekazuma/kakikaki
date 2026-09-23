import { centroid, clamp, dist, pathToPoints, resampleN, translate, type Pt } from './geometry';

// 調整ノブ。iPad で実際に子どもが書いた結果を見て変える。
// TAP: これより短い線はタップとみなす（i の点は 5 単位あるので、判定し直すときだけ除く）
export const RECOG = { N: 32, PENALTY_STROKE: 40, MARGIN: 10, D_MAX: 30, TAP: 2 };

type Template = { char: string; strokes: Pt[][] };

// 各画を N 点にそろえ、全体の重心をマスの中央へ寄せる（拡大縮小はしない）
function normalize(strokes: Pt[][]): Pt[][] {
  const rs = strokes.filter((s) => s.length > 0).map((s) => resampleN(s, RECOG.N));
  if (rs.length === 0) return [];
  const c = centroid(rs.flat());
  return rs.map((s) => translate(s, 54.5 - c.x, 54.5 - c.y));
}

export const makeTemplates = (strokes: Record<string, string[]>): Template[] =>
  Object.entries(strokes).map(([char, ds]) => ({ char, strokes: normalize(ds.map((d) => pathToPoints(d, 1.5))) }));

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

// 画ごとの距離。書き順は問わず、各入力画に最も近い未使用のお手本画を貪欲に当てる。画数の違いは 1 画ごとに加点
function distance(a: Pt[][], b: Pt[][]) {
  const m = Math.min(a.length, b.length);
  if (m === 0) return Infinity;
  const used = new Set<number>();
  let sum = 0;
  for (let i = 0; i < m; i++) {
    let best = Infinity;
    let bj = -1;
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
  return sum / m + Math.abs(a.length - b.length) * RECOG.PENALTY_STROKE;
}

export function recognize(strokes: Pt[][], templates: Template[]) {
  const input = normalize(strokes);
  return templates.map((t) => ({ char: t.char, dist: distance(input, t.strokes) })).sort((p, q) => p.dist - q.dist);
}

// 候補は普通 1 字だが、かきクイズでは同じ読みの字（工・公 など）をまとめて渡す
export function passes(targets: string[], results: { char: string; dist: number }[]) {
  const i = results.findIndex((r) => targets.includes(r.char));
  if (i === 0) return results[0].dist < RECOG.D_MAX * 2;
  return i === 1 && results[1].dist - results[0].dist < RECOG.MARGIN;
}

export const testScore = (d: number) => 1 - clamp(d / RECOG.D_MAX, 0, 1);
