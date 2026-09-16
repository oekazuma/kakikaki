import { dist, nearestDist, type Pt } from './geometry';

// 単位は 109 マスの viewBox。指の太さと子どもの手ぶれを考えて緩め（実機で調整済み: 線から 12、先読み 8 点、終点手前 4 点で可）。
export const JUDGE = { R_START: 14, R_TRACE: 12, K: 8, R_FREE: 9, FREE_DONE: 0.9, END_SLACK: 4 };
// なぞる の緩さ（ことば ごと。lang.svelte.ts の trace）。r: 線から離れてよい距離、end: 終点の手前で離してよい割合（画の長さに対して）
export type Tolerance = { r: number; end: number };
export const TOL: Tolerance = { r: JUDGE.R_TRACE, end: 0 };

export const canStart = (samples: Pt[], p: Pt) => dist(samples[0], p) <= JUDGE.R_START;

// cursor から k 点先までで、指に最も近い点へ進める（r 以内）。届く点が無ければ -1（逸脱）。
// k は既定で K だが、指が速く動いたときは 1 回の移動で K 点を超えるので、動いた距離ぶん広げて呼ぶ（線が止まって見えないように）
export function advance(samples: Pt[], cursor: number, p: Pt, r = JUDGE.R_TRACE, k = JUDGE.K): number {
  let best = -1,
    bd = r;
  for (let i = cursor; i <= Math.min(cursor + k, samples.length - 1); i++) {
    const d = dist(samples[i], p);
    if (d <= bd) {
      best = i;
      bd = d;
    }
  }
  if (best === -1 && dist(samples[cursor], p) <= JUDGE.R_START) return cursor;
  return best;
}

// 終点の手前 END_SLACK 点（かんじ は画の長さの end 倍まで）で離しても完成
export const traceDone = (samples: Pt[], cursor: number, end = 0) =>
  cursor >= samples.length - 1 - Math.max(JUDGE.END_SLACK, Math.round((samples.length - 1) * end));

// ponytail: O(samples×trail) の総当たり。1 画あたり数千回の距離計算で済むので十分。
export function coverage(samples: Pt[], trail: Pt[]): number {
  if (samples.length === 0) return 0;
  const hit = samples.filter((s) => nearestDist(s, trail) <= JUDGE.R_FREE).length;
  return hit / samples.length;
}
