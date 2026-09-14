// localStorage 直結ストアの共通部分。壊れた・古い形の保存値で起動が止まらないよう、読むときは形を確かめる
const store = () => (typeof localStorage === 'undefined' ? null : localStorage);

export const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

// ok は形の確認だけ（型述語にすると isObject のような粗い guard で T が狭く推論されてしまう）
export function loadJSON<T>(key: string, fallback: T, ok: (v: unknown) => boolean): T {
  try {
    const v: unknown = JSON.parse(store()?.getItem(key) ?? 'null');
    return ok(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

// Safari の約 5MB 上限などで失敗したら false（呼び出し側が知らせるか、黙って続ける）
export function saveJSON(key: string, value: unknown): boolean {
  try {
    store()?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const getRaw = (key: string) => store()?.getItem(key) ?? null;
export const setRaw = (key: string, value: string) => {
  try {
    store()?.setItem(key, value);
  } catch {
    /* 容量超過は無視（言語などの小さな値なので次回の保存で追いつく） */
  }
};
export const removeKey = (key: string) => store()?.removeItem(key);
