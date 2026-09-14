import { LANGS, type Lang } from './lang.svelte';

// 使う人（きょうだい・大人）ごとの記録の入れ物。記録のキーは kk:<id>:<lang>:<name>
export type Profile = { id: string; name: string; avatar: string; lang: Lang };
export const MAX_PROFILES = 10;
export const NAME_MAX = 10;
export const DEFAULT_AVATAR = 'cat';
const KEY = 'kk:profiles';
const DATA_NAMES = ['progress', 'earned', 'days', 'quiz'];
const store = () => (typeof localStorage === 'undefined' ? null : localStorage);
type Saved = { list: Profile[]; cur: string };

const move = (from: string, to: string) => {
  const v = store()?.getItem(from);
  if (v == null) return;
  if (store()?.getItem(to) == null) store()?.setItem(to, v);
  store()?.removeItem(from);
};

// プロフィール導入前の記録は p1 に引き継ぐ（kk:progress → kk:ja:progress → kk:p1:ja:progress の順に 1 回だけ）
function migrate(): Saved {
  for (const n of DATA_NAMES) move(`kk:${n}`, `kk:ja:${n}`);
  for (const l of LANGS) for (const n of DATA_NAMES) move(`kk:${l}:${n}`, `kk:p1:${l}:${n}`);
  const old = store()?.getItem('kk:lang');
  const lang = LANGS.find((l) => l === old) ?? 'ja';
  const s = { list: [{ id: 'p1', name: 'わたし', avatar: DEFAULT_AVATAR, lang }], cur: 'p1' };
  store()?.setItem(KEY, JSON.stringify(s));
  return s;
}
function load(): Saved {
  try {
    const s = JSON.parse(store()?.getItem(KEY) ?? 'null');
    if (s?.list?.length) return s;
  } catch {
    /* 壊れた保存値は作り直す */
  }
  return migrate();
}

export const profiles = $state<Saved>(load());
export const current = () => profiles.list.find((p) => p.id === profiles.cur) ?? profiles.list[0];
export const byId = (id: string) => profiles.list.find((p) => p.id === id);

// アバター画像（data URL）が大きいと Safari の 5MB 上限に当たるので、保存失敗は呼び出し側に知らせる
function save(): boolean {
  try {
    store()?.setItem(KEY, JSON.stringify({ list: profiles.list, cur: profiles.cur }));
    return true;
  } catch {
    return false;
  }
}

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
  for (const l of LANGS) for (const n of DATA_NAMES) store()?.removeItem(`kk:${id}:${l}:${n}`);
  return true;
}
