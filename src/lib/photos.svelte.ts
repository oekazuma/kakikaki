// アップロードした写真（切り抜き済みの data URL）の一覧。使う人をまたいで共有し、端末内にだけ保存する
export const PHOTOS_MAX = 20;
const KEY = 'kk:photos';
import { loadJSON, saveJSON } from './storage';

const load = () => loadJSON<string[]>(KEY, [], (v) => Array.isArray(v) && v.every((p) => typeof p === 'string'));
export const photos = $state<{ list: string[] }>({ list: load() });

// 容量超過で保存できなければ一覧は変えない
function save(next: string[]): boolean {
  if (!saveJSON(KEY, next)) return false;
  photos.list = next;
  return true;
}
// 新しいものを先頭に。上限を超えたら古いものから消える
export const addPhoto = (url: string) => save([url, ...photos.list.filter((p) => p !== url)].slice(0, PHOTOS_MAX));
export const removePhoto = (url: string) => save(photos.list.filter((p) => p !== url));
