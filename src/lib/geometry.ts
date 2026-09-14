export type Pt = { x: number; y: number };

export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

export function length(pts: Pt[]) {
  let L = 0;
  for (let k = 1; k < pts.length; k++) L += dist(pts[k - 1], pts[k]);
  return L;
}

// 3 次ベジェを 16 分割した折れ線（始点は含まない）
function cubic(p0: Pt, c1: Pt, c2: Pt, p3: Pt): Pt[] {
  const out: Pt[] = [];
  for (let i = 1; i <= 16; i++) {
    const t = i / 16,
      u = 1 - t;
    out.push({
      x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p3.y
    });
  }
  return out;
}

// KanjiVG が使う M L H V C S Z（大小）だけ対応
export function pathToPoints(d: string, step = 1.5): Pt[] {
  const tokens = d.match(/[MmLlCcSsHhVvZz]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const raw: Pt[] = [];
  let cmd = 'M',
    i = 0,
    cur: Pt = { x: 0, y: 0 },
    start = cur,
    prevCtrl: Pt | null = null;
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) {
      cmd = tokens[i++];
      if (cmd === 'Z' || cmd === 'z') {
        raw.push(start);
        cur = start;
        prevCtrl = null;
        continue;
      }
    }
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? cur.x : 0,
      oy = rel ? cur.y : 0;
    switch (cmd.toUpperCase()) {
      case 'M':
        cur = { x: ox + num(), y: oy + num() };
        start = cur;
        raw.push(cur);
        prevCtrl = null;
        cmd = rel ? 'l' : 'L';
        break;
      case 'L':
        cur = { x: ox + num(), y: oy + num() };
        raw.push(cur);
        prevCtrl = null;
        break;
      case 'H':
        cur = { x: ox + num(), y: cur.y };
        raw.push(cur);
        prevCtrl = null;
        break;
      case 'V':
        cur = { x: cur.x, y: oy + num() };
        raw.push(cur);
        prevCtrl = null;
        break;
      case 'C': {
        const c1 = { x: ox + num(), y: oy + num() },
          c2 = { x: ox + num(), y: oy + num() },
          p = { x: ox + num(), y: oy + num() };
        raw.push(...cubic(cur, c1, c2, p));
        prevCtrl = c2;
        cur = p;
        break;
      }
      case 'S': {
        const c1 = prevCtrl ? { x: 2 * cur.x - prevCtrl.x, y: 2 * cur.y - prevCtrl.y } : cur;
        const c2 = { x: ox + num(), y: oy + num() },
          p = { x: ox + num(), y: oy + num() };
        raw.push(...cubic(cur, c1, c2, p));
        prevCtrl = c2;
        cur = p;
        break;
      }
      default:
        throw new Error(`unsupported path command ${cmd}`);
    }
  }
  return resample(raw, step);
}

// 折れ線を弧長 step ごとの点に打ち直す（始点・終点を含む）
function resample(pts: Pt[], step: number): Pt[] {
  if (pts.length === 0) return [];
  const out = [pts[0]];
  let acc = 0;
  for (let k = 1; k < pts.length; k++) {
    let a = pts[k - 1];
    const b = pts[k];
    let seg = dist(a, b);
    while (seg > 0 && acc + seg >= step) {
      const p = lerp(a, b, (step - acc) / seg);
      out.push(p);
      a = p;
      seg = dist(a, b);
      acc = 0;
    }
    acc += seg;
  }
  const last = pts[pts.length - 1];
  if (dist(out[out.length - 1], last) > 1e-6) out.push(last);
  return out;
}

export function resampleN(pts: Pt[], n: number): Pt[] {
  const L = length(pts);
  if (L === 0) return Array.from({ length: n }, () => pts[0]);
  const out = resample(pts, L / (n - 1)).slice(0, n);
  while (out.length < n) out.push(pts[pts.length - 1]);
  return out;
}

export function nearestDist(p: Pt, pts: Pt[]) {
  let m = Infinity;
  for (const q of pts) m = Math.min(m, dist(p, q));
  return m;
}

export function centroid(pts: Pt[]): Pt {
  const s = pts.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: s.x / pts.length, y: s.y / pts.length };
}

export const translate = (pts: Pt[], dx: number, dy: number) => pts.map((p) => ({ x: p.x + dx, y: p.y + dy }));
