import { computeStats, earnedBadges, type Badge } from './badges';

export type Mode = 'trace' | 'free' | 'test';
export type CharProgress = { trace: number; free: number; test: number };

const KEY = 'kk:progress';
const KEY_EARNED = 'kk:earned';
const KEY_DAYS = 'kk:days';
const CAP: Record<Mode, number> = { trace: 2, free: 1, test: 1 };
const store = () => (typeof localStorage === 'undefined' ? null : localStorage);

function load<T>(key: string, fallback: T): T {
	try {
		return JSON.parse(store()?.getItem(key) ?? 'null') ?? fallback;
	} catch {
		return fallback;
	}
}
const save = (key: string, v: unknown) => store()?.setItem(key, JSON.stringify(v));

export const progress = $state<Record<string, CharProgress>>(load(KEY, {}));
// メダル id → 獲得日 (YYYY-MM-DD)
export const earned = $state<Record<string, string>>(load(KEY_EARNED, {}));
// 練習した日 (YYYY-MM-DD)
export const days = $state<string[]>(load(KEY_DAYS, []));

export const today = () => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const get = (c: string): CharProgress => progress[c] ?? { trace: 0, free: 0, test: 0 };

export function record(c: string, mode: Mode) {
	const p = { ...get(c) };
	p[mode] = Math.min(CAP[mode], p[mode] + 1);
	progress[c] = p;
	save(KEY, progress);
	const t = today();
	if (!days.includes(t)) {
		days.push(t);
		save(KEY_DAYS, days);
	}
}

export function earn(id: string) {
	earned[id] = today();
	save(KEY_EARNED, earned);
}

export const charCleared = (c: string) => get(c).trace >= 2 && get(c).free >= 1;
export const charGold = (c: string) => get(c).test >= 1;
export const wordStar = (name: string) => [...name].every(charCleared);
export const wordCrown = (name: string) => [...name].every(charGold);

export function reset() {
	for (const k of Object.keys(progress)) delete progress[k];
	for (const k of Object.keys(earned)) delete earned[k];
	days.length = 0;
	store()?.removeItem(KEY);
	store()?.removeItem(KEY_EARNED);
	store()?.removeItem(KEY_DAYS);
}

export const stats = () => computeStats(charCleared, charGold, days.length);

// 新しく条件を満たしたメダルを獲得済みにして返す
export function checkBadges(): Badge[] {
	const fresh = earnedBadges(stats()).filter((b) => !earned[b.id]);
	for (const b of fresh) earn(b.id);
	return fresh;
}
