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

// 筆圧で点ごとに太さが変わる線を、両端が丸い帯（塗りつぶす閉じた path）にする
export function ribbon(input: Sample[], width: number): string {
  const pts = input.filter((p, i) => i === 0 || dist(p, input[i - 1]) > 0.05);
  if (pts.length === 0) return '';
  if (pts.length === 1) {
    const { x, y, p } = pts[0];
    const r = penWidth(width, p) / 2;
    return `M${f1(x - r)},${f1(y)}a${f1(r)},${f1(r)} 0 1,0 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1,0 ${f1(-2 * r)},0Z`;
  }
  const n = pts.length;
  const h = pts.map((q) => penWidth(width, q.p) / 2);
  const L: string[] = [];
  const R: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / d;
    const ny = (b.x - a.x) / d;
    L.push(`${f1(pts[i].x + nx * h[i])},${f1(pts[i].y + ny * h[i])}`);
    R.push(`${f1(pts[i].x - nx * h[i])},${f1(pts[i].y - ny * h[i])}`);
  }
  const cap = (r: number, to: string) => `A${f1(r)},${f1(r)} 0 0 1 ${to}`;
  return `M${L.join('L')}${cap(h[n - 1], R[n - 1])}L${R.slice().reverse().join('L')}${cap(h[0], L[0])}Z`;
}
