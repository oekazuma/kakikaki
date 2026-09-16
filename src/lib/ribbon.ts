import { dist, type Pt } from './geometry';

// 書いた線の 1 点。t は ms、p は Apple Pencil の筆圧（0〜1。指は一定値しか来ないので入れない）
export type Sample = Pt & { t?: number; p?: number };

// 毛筆風の太さの決め方（viewBox 単位 / ms）。速いほど細く、Pencil は筆圧で太く。
// 勢いよく抜いて終わる（はらい・はね）と先を尖らせ、止まって終わる（止め）と丸く終える
export const BRUSH = {
  V_SLOW: 0.05, // これより遅ければ太いまま
  V_FAST: 0.4, // これより速ければいちばん細い
  MIN: 0.3, // 速いときの太さ（割合）
  RAMP: 4, // 書き始めで太さが立ち上がる長さ
  TAPER_LEN: 10, // はらい で細くなる長さ
  TAPER_V: 0.18 // 終わりの速さがこれ以上なら はらい
};
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// 各点の半径（半分の太さ）と、先を尖らせるか
export function widths(pts: Sample[], width: number): { h: number[]; taper: boolean } {
  const n = pts.length;
  const v: number[] = [0];
  for (let i = 1; i < n; i++) {
    const dt = pts[i].t != null && pts[i - 1].t != null ? Math.max(1, pts[i].t! - pts[i - 1].t!) : 0;
    const raw = dt ? dist(pts[i], pts[i - 1]) / dt : BRUSH.V_SLOW; // 時刻が無ければゆっくり書いた扱い
    v.push(i === 1 ? raw : 0.5 * v[i - 1] + 0.5 * raw);
  }
  const len: number[] = [0];
  for (let i = 1; i < n; i++) len.push(len[i - 1] + dist(pts[i], pts[i - 1]));
  const total = len[n - 1];
  const tail = v.slice(Math.max(1, n - 4));
  const taper = n > 2 && tail.reduce((a, b) => a + b, 0) / tail.length >= BRUSH.TAPER_V;
  const pen = pts.filter((p) => p.p != null).length > n / 2;
  const h = pts.map((p, i) => {
    let f = clamp(1 - (v[i] - BRUSH.V_SLOW) / (BRUSH.V_FAST - BRUSH.V_SLOW), BRUSH.MIN, 1);
    if (pen) f = Math.sqrt(f) * clamp(0.35 + 0.9 * (p.p ?? 0.5), 0.3, 1.2);
    f *= clamp(0.55 + (0.45 * len[i]) / BRUSH.RAMP, 0.55, 1);
    if (taper) f *= clamp((total - len[i]) / BRUSH.TAPER_LEN, 0, 1);
    return (width / 2) * f;
  });
  return { h, taper };
}

const f1 = (x: number) => x.toFixed(1);
// 折れ線（毛筆風にしない ことば の描画）の points 属性
export const polyline = (pts: Pt[]) => pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join(' ');
// 書いた線を、点ごとの太さを持つ帯（塗りつぶす閉じた path）にする
export function ribbon(input: Sample[], width: number): string {
  const pts = input.filter((p, i) => i === 0 || dist(p, input[i - 1]) > 0.05);
  if (pts.length === 0) return '';
  const r = width / 2;
  if (pts.length === 1) {
    const { x, y } = pts[0];
    return `M${f1(x - r)},${f1(y)}a${f1(r)},${f1(r)} 0 1,0 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1,0 ${f1(-2 * r)},0Z`;
  }
  const { h, taper } = widths(pts, width);
  const n = pts.length;
  const L: string[] = [];
  const R: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / d;
    const ny = (b.x - a.x) / d;
    const hi = Math.max(taper && i === n - 1 ? 0 : 0.3, h[i]);
    L.push(`${f1(pts[i].x + nx * hi)},${f1(pts[i].y + ny * hi)}`);
    R.push(`${f1(pts[i].x - nx * hi)},${f1(pts[i].y - ny * hi)}`);
  }
  const endCap = taper ? `L${R[n - 1]}` : `A${f1(h[n - 1])},${f1(h[n - 1])} 0 0 1 ${R[n - 1]}`;
  const startCap = `A${f1(h[0])},${f1(h[0])} 0 0 1 ${L[0]}`;
  return `M${L.join('L')}${endCap}L${R.slice().reverse().join('L')}${startCap}Z`;
}
