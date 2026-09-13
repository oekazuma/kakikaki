import { dist, nearestDist, type Pt } from './geometry';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function strokeScore(trail: Pt[], samples: Pt[]): number {
	if (trail.length === 0) return 0;
	const d = trail.reduce((a, p) => a + nearestDist(p, samples), 0) / trail.length;
	let s = 1 - clamp(d / 12, 0, 1);
	const t0 = trail[0],
		t1 = trail[trail.length - 1],
		s0 = samples[0],
		s1 = samples[samples.length - 1];
	if (dist(t0, s1) + dist(t1, s0) < dist(t0, s0) + dist(t1, s1)) s -= 0.5;
	return clamp(s, 0, 1);
}

export const stars = (score: number): 1 | 2 | 3 => (score >= 0.85 ? 3 : score >= 0.65 ? 2 : 1);

export const praise = (n: 1 | 2 | 3) =>
	n === 3 ? 'すごい！ とても じょうず！' : n === 2 ? 'じょうず！' : 'かけたね！ もっと きれいに かけるかな？';
