import { STROKES } from './strokes';
import { centroid, dist, pathToPoints, resampleN, translate, type Pt } from './geometry';

// 調整ノブ。iPad で実際に子どもが書いた結果を見て変える。
export const RECOG = { N: 32, PENALTY_STROKE: 40, MARGIN: 8, D_MAX: 30 };

export type Template = { char: string; strokes: Pt[][] };

// 各画を N 点にそろえ、全体の重心をマスの中央へ寄せる（拡大縮小はしない）
export function normalize(strokes: Pt[][]): Pt[][] {
  const rs = strokes.filter((s) => s.length > 0).map((s) => resampleN(s, RECOG.N));
  if (rs.length === 0) return [];
  const c = centroid(rs.flat());
  return rs.map((s) => translate(s, 54.5 - c.x, 54.5 - c.y));
}

export const makeTemplates = (strokes: Record<string, string[]>): Template[] =>
  Object.entries(strokes).map(([char, ds]) => ({ char, strokes: normalize(ds.map((d) => pathToPoints(d, 1.5))) }));

export const TEMPLATES: Template[] = makeTemplates(STROKES);

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

function distance(a: Pt[][], b: Pt[][]) {
  const m = Math.min(a.length, b.length);
  if (m === 0) return Infinity;
  let sum = 0;
  for (let i = 0; i < m; i++) {
    let d = 0;
    for (let k = 0; k < RECOG.N; k++) d += dist(a[i][k], b[i][k]);
    sum += d / RECOG.N;
  }
  return sum / m + Math.abs(a.length - b.length) * RECOG.PENALTY_STROKE;
}

export function recognize(strokes: Pt[][], templates = TEMPLATES) {
  const input = normalize(strokes);
  return templates.map((t) => ({ char: t.char, dist: distance(input, t.strokes) })).sort((p, q) => p.dist - q.dist);
}

export function passes(target: string, results: { char: string; dist: number }[]) {
  const i = results.findIndex((r) => r.char === target);
  if (i === 0) return results[0].dist < RECOG.D_MAX * 2;
  return i === 1 && results[1].dist - results[0].dist < RECOG.MARGIN;
}

export const testScore = (d: number) => 1 - Math.min(1, Math.max(0, d / RECOG.D_MAX));
