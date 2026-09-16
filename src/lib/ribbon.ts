import { dist, type Pt } from './geometry';

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

// 筆圧で点ごとに太さが変わる線。区間ごとに両端が半円のカプセルを重ねた path にする（1 本の多角形だと曲がり角の外側に
// 隙間が出る）。弧は進行方向の外側へ膨らむよう sweep を 0 にし、すべて同じ向きに描いて重なりが塗り抜けないようにする
export function ribbon(input: Sample[], width: number): string {
  const pts = input.filter((p, i) => i === 0 || dist(p, input[i - 1]) > 0.05);
  if (pts.length === 0) return '';
  if (pts.length === 1) {
    const { x, y, p } = pts[0];
    const r = penWidth(width, p) / 2;
    return `M${f1(x - r)},${f1(y)}a${f1(r)},${f1(r)} 0 1,0 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1,0 ${f1(-2 * r)},0Z`;
  }
  let d = '';
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const ha = penWidth(width, a.p) / 2;
    const hb = penWidth(width, b.p) / 2;
    const len = dist(a, b);
    const nx = -(b.y - a.y) / len;
    const ny = (b.x - a.x) / len;
    const P = (q: Pt, h: number, sgn: number) => `${f1(q.x + sgn * nx * h)},${f1(q.y + sgn * ny * h)}`;
    d += `M${P(a, ha, 1)}L${P(b, hb, 1)}A${f1(hb)},${f1(hb)} 0 0 0 ${P(b, hb, -1)}L${P(a, ha, -1)}A${f1(ha)},${f1(ha)} 0 0 0 ${P(a, ha, 1)}Z`;
  }
  return d;
}
