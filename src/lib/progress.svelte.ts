import { computeStats, earnedBadges, type Badge } from './badges';
import { lang, lettersOf, setLang, LANGS, type Lang } from './lang.svelte';
import { profiles, byId, setCurrent, removeProfile, updateProfile, keyOf, DATA_NAMES } from './profiles.svelte';
import { removeBest } from './balloon.svelte';
import type { Word } from './words';
import { isObject, loadJSON, saveJSON, removeKey } from './storage';
import { today } from './today';
import { streak } from './streak';

export type Mode = 'trace' | 'free' | 'test';
// star: じぶんでかく の最高の星（1〜3）、miss: おてほんなし の不合格回数。どちらも任意（古い保存値には無い）
export type CharProgress = { trace: number; free: number; test: number; star?: number; miss?: number };
// quiz のキーは `${kind}${level}`（read1 など）→ 正解数
type Data = {
  progress: Record<string, CharProgress>;
  earned: Record<string, string>;
  days: string[];
  quiz: Record<string, number>;
};

const CAP: Record<Mode, number> = { trace: 2, free: 1, test: 1 };
const key = (l: Lang, name: keyof Data) => keyOf(profiles.cur, l, name);

const isDays = (v: unknown) => Array.isArray(v) && v.every((d) => typeof d === 'string');
const load = (l: Lang): Data => ({
  progress: loadJSON<Data['progress']>(key(l, 'progress'), {}, isObject),
  earned: loadJSON<Data['earned']>(key(l, 'earned'), {}, isObject),
  days: loadJSON<Data['days']>(key(l, 'days'), [], isDays),
  quiz: loadJSON<Data['quiz']>(key(l, 'quiz'), {}, isObject)
});
// 記録の保存失敗（容量超過）は子どもに見せない。練習は止めずに続ける
const save = (l: Lang, name: keyof Data) => void saveJSON(key(l, name), data[l][name]);

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
  if (!removeProfile(id)) return;
  removeBest(id);
  if (wasCur) switchProfile(profiles.cur);
}
// 言語の切り替えを使っている人に覚えさせる（次にその人を選んだとき同じ言語で開く）
export const rememberLang = (l: Lang) => updateProfile(profiles.cur, { lang: l });

export { today };

export const get = (c: string): CharProgress => cur().progress[c] ?? { trace: 0, free: 0, test: 0 };
export const earned = () => cur().earned;
export const days = () => cur().days;
export const quiz = () => cur().quiz;

// 練習した日付に今日を足す（1 日 1 回）
function markToday(l: Lang) {
  const t = today();
  if (data[l].days.includes(t)) return;
  data[l].days.push(t);
  save(l, 'days');
}

export function recordQuiz(kind: 'read' | 'write', level: number, correct: number) {
  const l = lang.v,
    k = `${kind}${level}`;
  data[l].quiz[k] = (data[l].quiz[k] ?? 0) + correct;
  save(l, 'quiz');
  markToday(l);
}

// じぶんでかく の星は最高値だけ残す（お祝い向き）
export function recordStar(c: string, n: number) {
  const l = lang.v;
  data[l].progress[c] = { ...get(c), star: Math.max(get(c).star ?? 0, n) };
  save(l, 'progress');
}
// おてほんなし の不合格は累計（保護者向けの「にがて」に使う。子どもの画面には出さない）
export function recordMiss(c: string) {
  const l = lang.v;
  data[l].progress[c] = { ...get(c), miss: (get(c).miss ?? 0) + 1 };
  save(l, 'progress');
}

export function record(c: string, mode: Mode) {
  const l = lang.v;
  const p = { ...get(c) };
  p[mode] = Math.min(CAP[mode], p[mode] + 1);
  data[l].progress[c] = p;
  save(l, 'progress');
  markToday(l);
}

export function earn(id: string) {
  data[lang.v].earned[id] = today();
  save(lang.v, 'earned');
}

// 文字クリア = なぞる 2 + じぶんでかく 1、金の星 = おてほんなし 1（CAP と同じ数）
export const clearedIn = (p: CharProgress) => p.trace >= CAP.trace && p.free >= CAP.free;
export const goldIn = (p: CharProgress) => p.test >= CAP.test;
export const charCleared = (c: string) => clearedIn(get(c));
export const charGold = (c: string) => goldIn(get(c));
export const wordStar = (w: Word) => lettersOf(w).every(charCleared);
export const wordCrown = (w: Word) => lettersOf(w).every(charGold);

// 任意の人・ことばの記録を消す。使用中の人なら画面の状態も空にする
export function resetRecords(pid: string, langs: Lang[]) {
  for (const l of langs) {
    for (const name of DATA_NAMES) removeKey(keyOf(pid, l, name));
    if (pid === profiles.cur) data[l] = { progress: {}, earned: {}, days: [], quiz: {} };
  }
}
// 現在の人・言語の記録だけ消す
export const reset = () => resetRecords(profiles.cur, [lang.v]);

// 練習した日は 3 ことば をまたいで 1 つに（連続日数とカレンダー用）
export const allDays = () => {
  const all = LANGS.flatMap((l) => data[l].days);
  return all.filter((d, i) => all.indexOf(d) === i);
};
export const streakNow = () => streak(allDays(), today());
export const stats = () => computeStats(lang.v, charCleared, charGold, days().length, quiz(), streakNow());

// にがてな文字: おてほんなし で 2 回以上外したか、じぶんでかく の最高が星 1 のまま。外した回数が多い順
export function weakOf(pid: string, l: Lang): string[] {
  const progress = loadJSON<Record<string, CharProgress>>(keyOf(pid, l, 'progress'), {}, isObject);
  return Object.entries(progress)
    .filter(([, p]) => (p.miss ?? 0) >= 2 || p.star === 1)
    .sort((a, b) => (b[1].miss ?? 0) - (a[1].miss ?? 0))
    .map(([c]) => c);
}

// 削除の最終確認用: 任意の人・ことばの記録の件数（保存値を直接読む）
export type Summary = {
  chars: number;
  gold: number;
  words: number;
  crowns: number;
  medals: number;
  days: number;
  quiz: number;
};
export function summaryOf(pid: string, l: Lang): Summary {
  const progress = loadJSON<Record<string, CharProgress>>(keyOf(pid, l, 'progress'), {}, isObject);
  const g = (c: string) => progress[c] ?? { trace: 0, free: 0, test: 0 };
  const st = computeStats(
    l,
    (c) => clearedIn(g(c)),
    (c) => goldIn(g(c)),
    loadJSON<string[]>(keyOf(pid, l, 'days'), [], isDays).length,
    loadJSON<Record<string, number>>(keyOf(pid, l, 'quiz'), {}, isObject)
  );
  return {
    chars: st.chars,
    gold: st.gold,
    words: st.words,
    crowns: st.crowns,
    medals: Object.keys(loadJSON<Record<string, string>>(keyOf(pid, l, 'earned'), {}, isObject)).length,
    days: st.days,
    quiz: Object.values(st.quiz).reduce((a, b) => a + b, 0)
  };
}

// 新しく条件を満たしたメダルを獲得済みにして返す
export function checkBadges(): Badge[] {
  const fresh = earnedBadges(lang.v, stats()).filter((b) => !earned()[b.id]);
  for (const b of fresh) earn(b.id);
  return fresh;
}
