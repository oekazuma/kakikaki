import { computeStats, earnedBadges, type Badge } from './badges';
import { lang, lettersOf, type Lang } from './lang.svelte';
import type { Word } from './words';

export type Mode = 'trace' | 'free' | 'test';
export type CharProgress = { trace: number; free: number; test: number };
type Data = { progress: Record<string, CharProgress>; earned: Record<string, string>; days: string[] };

const CAP: Record<Mode, number> = { trace: 2, free: 1, test: 1 };
const store = () => (typeof localStorage === 'undefined' ? null : localStorage);
const key = (l: Lang, name: string) => `kk:${l}:${name}`;

function loadJSON<T>(k: string, fallback: T): T {
	try {
		return JSON.parse(store()?.getItem(k) ?? 'null') ?? fallback;
	} catch {
		return fallback;
	}
}
// 言語分割前のキー (kk:progress など) は ja の記録として引き継ぐ
for (const name of ['progress', 'earned', 'days']) {
	const old = store()?.getItem(`kk:${name}`);
	if (old != null) {
		if (store()?.getItem(key('ja', name)) == null) store()?.setItem(key('ja', name), old);
		store()?.removeItem(`kk:${name}`);
	}
}
const load = (l: Lang): Data => ({
	progress: loadJSON(key(l, 'progress'), {}),
	earned: loadJSON(key(l, 'earned'), {}),
	days: loadJSON(key(l, 'days'), [])
});
const save = (l: Lang, name: keyof Data) => store()?.setItem(key(l, name), JSON.stringify(data[l][name]));

export const data = $state<Record<Lang, Data>>({ ja: load('ja'), en: load('en') });
const cur = () => data[lang.v];

export const today = () => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const get = (c: string): CharProgress => cur().progress[c] ?? { trace: 0, free: 0, test: 0 };
export const earned = () => cur().earned;
export const days = () => cur().days;

export function record(c: string, mode: Mode) {
	const l = lang.v;
	const p = { ...get(c) };
	p[mode] = Math.min(CAP[mode], p[mode] + 1);
	data[l].progress[c] = p;
	save(l, 'progress');
	const t = today();
	if (!data[l].days.includes(t)) {
		data[l].days.push(t);
		save(l, 'days');
	}
}

export function earn(id: string) {
	data[lang.v].earned[id] = today();
	save(lang.v, 'earned');
}

export const charCleared = (c: string) => get(c).trace >= 2 && get(c).free >= 1;
export const charGold = (c: string) => get(c).test >= 1;
export const wordStar = (w: Word) => lettersOf(w).every(charCleared);
export const wordCrown = (w: Word) => lettersOf(w).every(charGold);

// 現在の言語の記録だけ消す
export function reset() {
	const l = lang.v;
	data[l] = { progress: {}, earned: {}, days: [] };
	for (const name of ['progress', 'earned', 'days'] as const) store()?.removeItem(key(l, name));
}

export const stats = () => computeStats(lang.v, charCleared, charGold, days().length);

// 新しく条件を満たしたメダルを獲得済みにして返す
export function checkBadges(): Badge[] {
	const fresh = earnedBadges(lang.v, stats()).filter((b) => !earned()[b.id]);
	for (const b of fresh) earn(b.id);
	return fresh;
}
