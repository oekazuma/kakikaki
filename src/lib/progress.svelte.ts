import { computeStats, earnedBadges, badgesOf, TOTAL, SHARED_IDS, type Badge, type Stats } from './badges';
import { lang, lettersOf, setLang, LANGS, type Lang } from './lang.svelte';
import {
  profiles,
  byId,
  setCurrent,
  removeProfile,
  updateProfile,
  keyOf,
  sharedKey,
  DATA_NAMES
} from './profiles.svelte';
import { removeBest, loadBests } from './balloon.svelte';
import { secretOf, removeSecret } from './secret';
import { WORDS, isCharWord, type Word } from './words';
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
  // 単語 id → 最後まで練習した日。null は始めた（1 文字でも書いた）だけ、'' は単語の記録を持つ前に星が付いていた単語（移行）。
  // やりかけ（null）はキーの並びが最近書いた順（ホームの「つづきから」がこの順で並べる）
  words: Record<string, string | null>;
};

export const CAP: Record<Mode, number> = { trace: 2, free: 1, test: 1 };
// 文字クリア = なぞる 2 + じぶんでかく 1、金の星 = おてほんなし 1（CAP と同じ数）
const clearedIn = (p: CharProgress) => p.trace >= CAP.trace && p.free >= CAP.free;
const goldIn = (p: CharProgress) => p.test >= CAP.test;
const key = (l: Lang, name: keyof Data) => keyOf(profiles.cur, l, name);

const isDays = (v: unknown) => Array.isArray(v) && v.every((d) => typeof d === 'string');
// 単語の記録が無い保存値（単語の星を文字から計算していた頃）は、そのとき星が付いていた単語を練習済みとして引き継ぐ
function loadWords(pid: string, l: Lang, progress: Data['progress']): Data['words'] {
  const saved = loadJSON<Data['words'] | null>(keyOf(pid, l, 'words'), null, isObject);
  if (saved) return saved;
  const g = (c: string) => progress[c] ?? { trace: 0, free: 0, test: 0 };
  const words: Data['words'] = Object.fromEntries(
    WORDS.filter((w) => lettersOf(w, l).every((c) => clearedIn(g(c)))).map((w) => [w.id, ''])
  );
  saveJSON(keyOf(pid, l, 'words'), words);
  return words;
}
// 任意の人・ことばの保存値を読む（保護者向けの一覧や削除の確認は使用中の人以外も見るため）
const loadOf = (pid: string, l: Lang): Data => {
  const progress = loadJSON<Data['progress']>(keyOf(pid, l, 'progress'), {}, isObject);
  return {
    progress,
    earned: loadJSON<Data['earned']>(keyOf(pid, l, 'earned'), {}, isObject),
    days: loadJSON<Data['days']>(keyOf(pid, l, 'days'), [], isDays),
    quiz: loadJSON<Data['quiz']>(keyOf(pid, l, 'quiz'), {}, isObject),
    words: loadWords(pid, l, progress)
  };
};
const load = (l: Lang) => loadOf(profiles.cur, l);
// ことば をまたいで共有するメダルの獲得記録。以前は ことば ごとに記録していたので、残っていれば人単位へ寄せる（いちばん早い日付を残す）
function loadShared(pid: string): Record<string, string> {
  const shared = loadJSON<Record<string, string>>(sharedKey(pid), {}, isObject);
  let moved = false;
  for (const l of LANGS) {
    const e = loadJSON<Data['earned']>(keyOf(pid, l, 'earned'), {}, isObject);
    const ids = Object.keys(e).filter((id) => SHARED_IDS.has(id));
    if (!ids.length) continue;
    for (const id of ids) {
      if (!shared[id] || e[id] < shared[id]) shared[id] = e[id];
      delete e[id];
    }
    saveJSON(keyOf(pid, l, 'earned'), e);
    moved = true;
  }
  if (moved) saveJSON(sharedKey(pid), shared);
  return shared;
}
// 記録の保存失敗（容量超過）は子どもに見せない。練習は止めずに続ける
const save = (l: Lang, name: keyof Data) => void saveJSON(key(l, name), data[l][name]);

const shared = $state({ v: loadShared(profiles.cur) });
const data = $state<Record<Lang, Data>>(Object.fromEntries(LANGS.map((l) => [l, load(l)])) as Record<Lang, Data>);
const cur = () => data[lang.v];

// 使う人を切り替える: その人の言語に戻し、記録を読み直す
export function switchProfile(id: string) {
  const p = byId(id);
  if (!p) return;
  setCurrent(id);
  setLang(p.lang);
  shared.v = loadShared(id);
  for (const l of LANGS) data[l] = load(l);
}
export function deleteProfile(id: string) {
  const wasCur = profiles.cur === id;
  if (!removeProfile(id)) return;
  removeBest(id);
  removeSecret(id);
  if (wasCur) switchProfile(profiles.cur);
}
// 言語の切り替えを使っている人に覚えさせる（次にその人を選んだとき同じ言語で開く）
export const rememberLang = (l: Lang) => updateProfile(profiles.cur, { lang: l });

export const get = (c: string): CharProgress => cur().progress[c] ?? { trace: 0, free: 0, test: 0 };
// 獲得済みのメダル: ことば ごとの記録と、ことば をまたいで共有する記録を合わせて見る
export const earned = () => ({ ...shared.v, ...cur().earned });
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

function earn(id: string) {
  if (SHARED_IDS.has(id)) {
    shared.v[id] = today();
    saveJSON(sharedKey(profiles.cur), shared.v);
    return;
  }
  data[lang.v].earned[id] = today();
  save(lang.v, 'earned');
}

export const charCleared = (c: string) => clearedIn(get(c));
export const charGold = (c: string) => goldIn(get(c));
// 単語の星は「その単語を最後まで練習した」記録。文字を他の単語でそろえても勝手には付かない。王冠は星 + 全文字が金の星。
// 1 文字練習は単語の記録を持たないので、字のクリア・金星をそのまま使う
export const wordStar = (w: Word) => (isCharWord(w) ? charCleared(w.name) : cur().words[w.id] != null);
export const wordCrown = (w: Word) => (isCharWord(w) ? charGold(w.name) : wordStar(w) && lettersOf(w).every(charGold));
// やりかけ（始めたが、まだ最後まで練習していない）の単語 id を最近書いた順に
export const openWordIds = () =>
  Object.entries(cur().words)
    .filter(([, v]) => v === null)
    .map(([id]) => id)
    .reverse();
// 1 文字練習は単語の記録に入れない（ひらがな などでは /chars からの脇道）。単語の無い ことば（かんじ）だけは字が単語の代わりなので
// 同じ記録に入れ、ホームの つづきから に出す。済みの判定は記録そのもので見る（wordStar は 1 文字だと字のクリアを返し、
// クリアした直後の recordWordDone が空振りするため）
const aside = (w: Word) => isCharWord(w) && TOTAL(lang.v).words > 0;
const hasRecord = (w: Word) => cur().words[w.id] != null;
export function recordWordStart(w: Word) {
  if (aside(w) || hasRecord(w) || Object.keys(cur().words).at(-1) === w.id) return;
  // $state のプロキシは delete して入れ直してもキー順が変わらないので、並べ直したオブジェクトに置き換える
  const rest = Object.fromEntries(Object.entries(cur().words).filter(([id]) => id !== w.id));
  cur().words = { ...rest, [w.id]: null };
  save(lang.v, 'words');
}
export function recordWordDone(w: Word) {
  if (aside(w) || hasRecord(w)) return;
  cur().words[w.id] = today();
  save(lang.v, 'words');
}

// 任意の人・ことばの記録を消す。使用中の人なら画面の状態も空にする
export function resetRecords(pid: string, langs: Lang[]) {
  for (const l of langs) {
    for (const name of DATA_NAMES) removeKey(keyOf(pid, l, name));
    if (pid === profiles.cur) data[l] = { progress: {}, earned: {}, days: [], quiz: {}, words: {} };
  }
  // ことばをまたぐ かくし要素の記録は「すべて」のときだけ消す（1 ことば だけのリセットでは残す）
  if (langs.length === LANGS.length) {
    removeSecret(pid);
    removeBest(pid);
    removeKey(sharedKey(pid));
    if (pid === profiles.cur) shared.v = {};
  }
}
// 現在の人・言語の記録だけ消す
export const reset = () => resetRecords(profiles.cur, [lang.v]);

// 練習した日は 全ことば をまたいで 1 つに（連続日数とカレンダー用）。Set は重複除去に使うだけで描画には持ち出さない
// eslint-disable-next-line svelte/prefer-svelte-reactivity
export const allDays = () => [...new Set(LANGS.flatMap((l) => data[l].days))];
export const streakNow = () => streak(allDays(), today());
const secretStats = (pid: string) => ({ ...secretOf(pid), balloon: loadBests()[pid]?.score ?? 0 });
export const stats = () =>
  computeStats(
    lang.v,
    charCleared,
    charGold,
    (id) => cur().words[id] != null,
    days().length,
    quiz(),
    streakNow(),
    secretStats(profiles.cur)
  );

// にがてな文字: おてほんなし で 2 回以上外したか、じぶんでかく の最高が星 1 のまま。外した回数が多い順
const weakIn = (progress: Data['progress']) =>
  Object.entries(progress)
    .filter(([, p]) => (p.miss ?? 0) >= 2 || p.star === 1)
    .sort((a, b) => (b[1].miss ?? 0) - (a[1].miss ?? 0))
    .map(([c, p]) => ({ c, miss: p.miss ?? 0 }));
export const weakOf = (pid: string, l: Lang) => weakIn(loadOf(pid, l).progress).map((w) => w.c);

// 保護者向けの詳細: 集計値に加えて メダル数・最後に練習した日・にがてな文字（外した回数つき）
export type Detail = Stats & {
  medals: number;
  medalTotal: number;
  last: string | null;
  weak: { c: string; miss: number }[];
};
export function detailOf(pid: string, l: Lang): Detail {
  const d = loadOf(pid, l);
  const g = (c: string) => d.progress[c] ?? { trace: 0, free: 0, test: 0 };
  const st = computeStats(
    l,
    (c) => clearedIn(g(c)),
    (c) => goldIn(g(c)),
    (id) => d.words[id] != null,
    d.days.length,
    d.quiz,
    0,
    secretStats(pid)
  );
  return {
    ...st,
    medals: badgesOf(l).filter((b) => (b.shared ? loadShared(pid) : d.earned)[b.id]).length,
    medalTotal: badgesOf(l).length,
    last: d.days.length ? [...d.days].sort().at(-1)! : null,
    weak: weakIn(d.progress)
  };
}
// その人が練習した日付（全ことば の union）と連続日数
// eslint-disable-next-line svelte/prefer-svelte-reactivity
export const daysOf = (pid: string) => [...new Set(LANGS.flatMap((l) => loadOf(pid, l).days))];
export const streakOf = (pid: string) => streak(daysOf(pid), today());

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
  const { chars, gold, words, crowns, medals, days, quiz } = detailOf(pid, l);
  return { chars, gold, words, crowns, medals, days, quiz: Object.values(quiz).reduce((a, b) => a + b, 0) };
}

// 削除の最終確認用: かくし要素（ことばをまたいで共有のためことば別ではなく人単位）
export function secretSummary(pid: string): { balloon: number; pinball: number } {
  return { balloon: loadBests()[pid]?.score ?? 0, pinball: secretOf(pid).pinball };
}

// 新しく条件を満たしたメダルを獲得済みにして返す
export function checkBadges(): Badge[] {
  const fresh = earnedBadges(lang.v, stats()).filter((b) => !earned()[b.id]);
  for (const b of fresh) earn(b.id);
  return fresh;
}
