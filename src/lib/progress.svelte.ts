import { computeStats, earnedBadges, type Badge } from './badges';
import { lang, lettersOf, setLang, type Lang } from './lang.svelte';
import { profiles, byId, setCurrent, removeProfile, updateProfile } from './profiles.svelte';
import type { Word } from './words';
import { isObject, loadJSON, saveJSON, removeKey } from './storage';

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
const keyOf = (pid: string, l: Lang, name: string) => `kk:${pid}:${l}:${name}`;
const key = (l: Lang, name: string) => keyOf(profiles.cur, l, name);

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

// 任意の人・ことばの記録を消す。使用中の人なら画面の状態も空にする
export function resetRecords(pid: string, langs: Lang[]) {
  for (const l of langs) {
    for (const name of ['progress', 'earned', 'days', 'quiz'] as const) removeKey(keyOf(pid, l, name));
    if (pid === profiles.cur) data[l] = { progress: {}, earned: {}, days: [], quiz: {} };
  }
}
// 現在の人・言語の記録だけ消す
export const reset = () => resetRecords(profiles.cur, [lang.v]);

export const stats = () => computeStats(lang.v, charCleared, charGold, days().length, quiz());

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
    (c) => g(c).trace >= 2 && g(c).free >= 1,
    (c) => g(c).test >= 1,
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
