import { dist, nearestDist, type Pt } from './geometry';

// 単位は 109 マスの viewBox。指の太さと子どもの手ぶれを考えて緩め（実機で調整済み: 線から 12、先読み 8 点、終点手前 4 点で可）。
export const JUDGE = { R_START: 14, R_TRACE: 12, K: 8, R_FREE: 9, FREE_DONE: 0.9, END_SLACK: 4 };

export const canStart = (samples: Pt[], p: Pt) => dist(samples[0], p) <= JUDGE.R_START;

// cursor から K 点先までで、指に最も近い点へ進める（R_TRACE 以内）。届く点が無ければ -1（逸脱）。
export function advance(samples: Pt[], cursor: number, p: Pt): number {
  let best = -1,
    bd = JUDGE.R_TRACE;
  for (let k = cursor; k <= Math.min(cursor + JUDGE.K, samples.length - 1); k++) {
    const d = dist(samples[k], p);
    if (d <= bd) {
      best = k;
      bd = d;
    }
  }
  if (best === -1 && dist(samples[cursor], p) <= JUDGE.R_START) return cursor;
  return best;
}

export const traceDone = (samples: Pt[], cursor: number) => cursor >= samples.length - 1 - JUDGE.END_SLACK;

// ponytail: O(samples×trail) の総当たり。1 画あたり数千回の距離計算で済むので十分。
export function coverage(samples: Pt[], trail: Pt[]): number {
  if (samples.length === 0) return 0;
  const hit = samples.filter((s) => nearestDist(s, trail) <= JUDGE.R_FREE).length;
  return hit / samples.length;
}
