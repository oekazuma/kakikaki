import { computeStats, earnedBadges, type Badge } from './badges';
import { lang, lettersOf, setLang, type Lang } from './lang.svelte';
import { profiles, byId, setCurrent, removeProfile, updateProfile } from './profiles.svelte';
import type { Word } from './words';

export type Mode = 'trace' | 'free' | 'test';
export type CharProgress = { trace: number; free: number; test: number };
// quiz のキーは `${kind}${level}`（read1 など）→ 正解数
type Data = {
  progress: Record<string, CharProgress>;
  earned: Record<string, string>;
  days: string[];
  quiz: Record<string, number>;
};

const CAP: Record<Mode, number> = { trace: 2, free: 1, test: 1 };
const store = () => (typeof localStorage === 'undefined' ? null : localStorage);
const key = (l: Lang, name: string) => `kk:${profiles.cur}:${l}:${name}`;

function loadJSON<T>(k: string, fallback: T): T {
  try {
    return JSON.parse(store()?.getItem(k) ?? 'null') ?? fallback;
  } catch {
    return fallback;
  }
}
const load = (l: Lang): Data => ({
  progress: loadJSON(key(l, 'progress'), {}),
  earned: loadJSON(key(l, 'earned'), {}),
  days: loadJSON(key(l, 'days'), []),
  quiz: loadJSON(key(l, 'quiz'), {})
});
const save = (l: Lang, name: keyof Data) => store()?.setItem(key(l, name), JSON.stringify(data[l][name]));

export const data = $state<Record<Lang, Data>>({ ja: load('ja'), kana: load('kana'), en: load('en') });
const cur = () => data[lang.v];

// 使う人を切り替える: その人の言語に戻し、記録を読み直す
export function switchProfile(id: string) {
  const p = byId(id);
  if (!p) return;
  setCurrent(id);
  setLang(p.lang);
  for (const l of ['ja', 'kana', 'en'] as const) data[l] = load(l);
}
export function deleteProfile(id: string) {
  const wasCur = profiles.cur === id;
  if (removeProfile(id) && wasCur) switchProfile(profiles.cur);
}
// 言語の切り替えを使っている人に覚えさせる（次にその人を選んだとき同じ言語で開く）
export const rememberLang = (l: Lang) => updateProfile(profiles.cur, { lang: l });

export const today = () => {
  // 日付文字列を作るだけなので反応性は不要
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const get = (c: string): CharProgress => cur().progress[c] ?? { trace: 0, free: 0, test: 0 };
export const earned = () => cur().earned;
export const days = () => cur().days;
export const quiz = () => cur().quiz;

export function recordQuiz(kind: 'read' | 'write', level: number, correct: number) {
  const l = lang.v,
    k = `${kind}${level}`;
  data[l].quiz[k] = (data[l].quiz[k] ?? 0) + correct;
  save(l, 'quiz');
  const t = today();
  if (!data[l].days.includes(t)) {
    data[l].days.push(t);
    save(l, 'days');
  }
}

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
  data[l] = { progress: {}, earned: {}, days: [], quiz: {} };
  for (const name of ['progress', 'earned', 'days', 'quiz'] as const) store()?.removeItem(key(l, name));
}

export const stats = () => computeStats(lang.v, charCleared, charGold, days().length, quiz());

// 新しく条件を満たしたメダルを獲得済みにして返す
export function checkBadges(): Badge[] {
  const fresh = earnedBadges(lang.v, stats()).filter((b) => !earned()[b.id]);
  for (const b of fresh) earn(b.id);
  return fresh;
}
