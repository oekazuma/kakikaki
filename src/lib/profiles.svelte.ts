import { LANGS, type Lang } from './lang.svelte';
import { getRaw, isObject, loadJSON, removeKey, saveJSON, setRaw } from './storage';

// 使う人（きょうだい・大人）ごとの記録の入れ物。記録のキーは kk:<id>:<lang>:<name>
export type Profile = { id: string; name: string; avatar: string; lang: Lang };
export const MAX_PROFILES = 10;
export const NAME_MAX = 10;
export const DEFAULT_AVATAR = 'cat';
const KEY = 'kk:profiles';
// 人と言語ごとの記録。名前を足すときはここだけ増やす（削除・リセット・移行がすべてこの一覧を回る）
export const DATA_NAMES = ['progress', 'earned', 'days', 'quiz', 'last'] as const;
type DataName = (typeof DATA_NAMES)[number];
export const keyOf = (pid: string, l: Lang, name: DataName) => `kk:${pid}:${l}:${name}`;
type Saved = { list: Profile[]; cur: string };

const move = (from: string, to: string) => {
  const v = getRaw(from);
  if (v == null) return;
  if (getRaw(to) == null) setRaw(to, v);
  removeKey(from);
};

// プロフィール導入前の記録は p1 に引き継ぐ（kk:progress → kk:ja:progress → kk:p1:ja:progress の順に 1 回だけ）
function migrate(): Saved {
  for (const n of DATA_NAMES) move(`kk:${n}`, `kk:ja:${n}`);
  for (const l of LANGS) for (const n of DATA_NAMES) move(`kk:${l}:${n}`, keyOf('p1', l, n));
  const old = getRaw('kk:lang');
  const lang = LANGS.find((l) => l === old) ?? 'ja';
  const s = { list: [{ id: 'p1', name: 'わたし', avatar: DEFAULT_AVATAR, lang }], cur: 'p1' };
  saveJSON(KEY, s);
  return s;
}
const isProfile = (v: unknown): v is Profile =>
  isObject(v) &&
  typeof v.id === 'string' &&
  typeof v.name === 'string' &&
  typeof v.avatar === 'string' &&
  LANGS.includes(v.lang as Lang);
// 壊れた保存値は作り直す（他の人の記録キーには触れない）。cur が一覧に無ければ先頭の人にする
function load(): Saved {
  const s = loadJSON<{ list: unknown[]; cur: unknown }>(
    KEY,
    { list: [], cur: '' },
    (v) => isObject(v) && Array.isArray(v.list)
  );
  const list = s.list.filter(isProfile);
  if (list.length === 0) return migrate();
  const cur = list.some((p) => p.id === s.cur) ? (s.cur as string) : list[0].id;
  return { list, cur };
}

export const profiles = $state<Saved>(load());
export const current = () => profiles.list.find((p) => p.id === profiles.cur) ?? profiles.list[0];
export const byId = (id: string) => profiles.list.find((p) => p.id === id);

// アバター画像（data URL）が大きいと Safari の 5MB 上限に当たるので、保存失敗は呼び出し側に知らせる
const save = () => saveJSON(KEY, { list: profiles.list, cur: profiles.cur });

export function addProfile(name: string, avatar = DEFAULT_AVATAR, lang: Lang = 'ja'): Profile | null {
  if (profiles.list.length >= MAX_PROFILES) return null;
  let n = 1;
  while (byId(`p${n}`)) n++;
  const p = { id: `p${n}`, name: name.trim().slice(0, NAME_MAX) || 'なまえ', avatar, lang };
  profiles.list.push(p);
  if (!save()) {
    profiles.list.pop();
    return null;
  }
  return p;
}

export function updateProfile(id: string, patch: Partial<Omit<Profile, 'id'>>): boolean {
  const p = byId(id);
  if (!p) return false;
  const before = { ...p };
  Object.assign(p, patch, patch.name != null ? { name: patch.name.trim().slice(0, NAME_MAX) || p.name } : {});
  if (save()) return true;
  Object.assign(p, before);
  return false;
}

export function setCurrent(id: string) {
  if (!byId(id)) return;
  profiles.cur = id;
  save();
}

// 最後の 1 人は消せない。消した人が使用中なら先頭の人に切り替える
export function removeProfile(id: string): boolean {
  if (profiles.list.length <= 1 || !byId(id)) return false;
  profiles.list = profiles.list.filter((p) => p.id !== id);
  if (profiles.cur === id) profiles.cur = profiles.list[0].id;
  save();
  for (const l of LANGS) for (const n of DATA_NAMES) removeKey(keyOf(id, l, n));
  return true;
}
