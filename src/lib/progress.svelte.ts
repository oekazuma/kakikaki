export type Mode = 'trace' | 'free' | 'test';
export type CharProgress = { trace: number; free: number; test: number };

const KEY = 'kk:progress';
const CAP: Record<Mode, number> = { trace: 2, free: 1, test: 1 };
const store = () => (typeof localStorage === 'undefined' ? null : localStorage);

function load(): Record<string, CharProgress> {
	try {
		return JSON.parse(store()?.getItem(KEY) ?? '{}');
	} catch {
		return {};
	}
}

export const progress = $state<Record<string, CharProgress>>(load());

export const get = (c: string): CharProgress => progress[c] ?? { trace: 0, free: 0, test: 0 };

export function record(c: string, mode: Mode) {
	const p = { ...get(c) };
	p[mode] = Math.min(CAP[mode], p[mode] + 1);
	progress[c] = p;
	store()?.setItem(KEY, JSON.stringify(progress));
}

export const charCleared = (c: string) => get(c).trace >= 2 && get(c).free >= 1;
export const charGold = (c: string) => get(c).test >= 1;
export const wordStar = (name: string) => [...name].every(charCleared);
export const wordCrown = (name: string) => [...name].every(charGold);

export function reset() {
	for (const k of Object.keys(progress)) delete progress[k];
	store()?.removeItem(KEY);
}
