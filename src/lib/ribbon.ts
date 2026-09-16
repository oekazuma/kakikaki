import { dist, pathToPoints, type Pt } from './geometry';

// 書いた線の 1 点。p は Apple Pencil の筆圧（0〜1）。指は一定値しか来ないので入れず、太さは変えない
export type Sample = Pt & { p?: number };
export const hasPressure = (pts: Sample[]) => pts.some((q) => q.p != null);

// 筆圧と太さ。軽く当てると細く（0.35 倍）、強く押すと少し太く（最大 1.25 倍）
export const PEN = { MIN: 0.35, GAIN: 0.9, MAX: 1.25 };
export const penWidth = (width: number, p: number | undefined) =>
  width * Math.min(PEN.MAX, Math.max(0.3, PEN.MIN + PEN.GAIN * (p ?? 0.5)));

const f1 = (x: number) => x.toFixed(1);
// 折れ線（筆圧の無い線）の points 属性
export const polyline = (pts: Pt[]) => pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join(' ');

// 区間 a→b のカプセル（両端が半円）。弧は進行方向の外側へ膨らむよう sweep を 0 にし、すべて同じ向きに描いて重なりが塗り抜けないようにする
function capsule(a: Sample, b: Sample, width: number): string {
  const len = dist(a, b);
  if (len < 0.05) return '';
  const ha = penWidth(width, a.p) / 2;
  const hb = penWidth(width, b.p) / 2;
  const nx = -(b.y - a.y) / len;
  const ny = (b.x - a.x) / len;
  const P = (q: Pt, h: number, sgn: number) => `${f1(q.x + sgn * nx * h)},${f1(q.y + sgn * ny * h)}`;
  return `M${P(a, ha, 1)}L${P(b, hb, 1)}A${f1(hb)},${f1(hb)} 0 0 0 ${P(b, hb, -1)}L${P(a, ha, -1)}A${f1(ha)},${f1(ha)} 0 0 0 ${P(a, ha, 1)}Z`;
}
const dot = ({ x, y, p }: Sample, width: number) => {
  const r = penWidth(width, p) / 2;
  return `M${f1(x - r)},${f1(y)}a${f1(r)},${f1(r)} 0 1,0 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1,0 ${f1(-2 * r)},0Z`;
};

// 筆圧で点ごとに太さが変わる線。区間ごとのカプセルを重ねた path にする（1 本の多角形だと曲がり角の外側に隙間が出る）
export function ribbon(pts: Sample[], width: number): string {
  if (pts.length === 0) return '';
  let d = dot(pts[0], width);
  for (let i = 0; i + 1 < pts.length; i++) d += capsule(pts[i], pts[i + 1], width);
  return d;
}

// 書いている最中は pointermove のたびに描き直すので、点列（同じ配列）ごとに作った分を覚えて増えた区間だけ足す。
// Pencil は 1 秒に 240 回動くため、毎回全部作り直すとカクつく
const built = new WeakMap<object, { n: number; width: number; d: string }>();
export function ribbonOf(key: object, pts: Sample[], width: number): string {
  const c = built.get(key);
  if (!c || c.width !== width || c.n > pts.length) {
    const d = ribbon(pts, width);
    built.set(key, { n: pts.length, width, d });
    return d;
  }
  let d = c.d;
  for (let i = Math.max(1, c.n); i < pts.length; i++) d += capsule(pts[i - 1], pts[i], width);
  built.set(key, { n: pts.length, width, d });
  return d;
}

// なぞる: お手本の線（判定用の 1.5 単位おきの点列 samples）を、指が通った分（cursor まで）だけ筆圧 pr の太さで描く。
// 判定用の点は粗くて曲線が角ばるので、描画は STEP 単位に打ち直した点を使い、筆圧は近い判定点のものを当てる
const STEP = 0.5;
const fine = new Map<string, Pt[]>();
export function traceRibbon(d: string, samples: Pt[], pr: number[], cursor: number, width: number): string {
  let pts = fine.get(d);
  if (!pts) fine.set(d, (pts = pathToPoints(d, STEP)));
  const ratio = (pts.length - 1) / Math.max(1, samples.length - 1);
  const end = Math.min(pts.length - 1, Math.round(cursor * ratio));
  const shown = pts.slice(0, end + 1).map((q, j) => ({ ...q, p: pr[Math.min(pr.length - 1, Math.round(j / ratio))] }));
  return ribbonOf(pr, shown, width);
}
