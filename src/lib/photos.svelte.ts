// アップロードした写真（切り抜き済みの data URL）の一覧。使う人をまたいで共有し、端末内にだけ保存する
export const PHOTOS_MAX = 20;
const KEY = 'kk:photos';
const store = () => (typeof localStorage === 'undefined' ? null : localStorage);

const load = (): string[] => {
  try {
    const v = JSON.parse(store()?.getItem(KEY) ?? 'null');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
export const photos = $state<{ list: string[] }>({ list: load() });

function save(next: string[]): boolean {
  try {
    store()?.setItem(KEY, JSON.stringify(next));
    photos.list = next;
    return true;
  } catch {
    return false; // 容量超過。一覧は変えない
  }
}
// 新しいものを先頭に。上限を超えたら古いものから消える
export const addPhoto = (url: string) => save([url, ...photos.list.filter((p) => p !== url)].slice(0, PHOTOS_MAX));
export const removePhoto = (url: string) => save(photos.list.filter((p) => p !== url));
