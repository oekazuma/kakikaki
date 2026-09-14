import { isObject } from './storage';
import { today } from './today';

// 記録のバックアップ。localStorage の kk: で始まるキーをまとめて 1 つの JSON にし、読み込みは全部置き換える
// （サーバーや同期は持たない。保護者が自分で持つファイルだけ）
export type Backup = { app: 'kakikaki'; version: string; at: string; data: Record<string, string> };
const PREFIX = 'kk:';

const keys = () => Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));

export function exportAll(version: string): string {
  const data: Record<string, string> = {};
  for (const k of keys()) data[k] = localStorage.getItem(k) ?? '';
  const b: Backup = { app: 'kakikaki', version, at: today(), data };
  return JSON.stringify(b);
}

// 形が違えば throw（呼び出し側が「読み込めません」と出す）
export function parseBackup(text: string): Backup {
  const v: unknown = JSON.parse(text);
  if (!isObject(v) || v.app !== 'kakikaki' || !isObject(v.data)) throw new Error('backup');
  for (const [k, val] of Object.entries(v.data)) {
    if (!k.startsWith(PREFIX) || typeof val !== 'string') throw new Error('backup');
  }
  return v as Backup;
}

export function importAll(b: Backup) {
  for (const k of keys()) localStorage.removeItem(k);
  for (const [k, v] of Object.entries(b.data)) localStorage.setItem(k, v);
}

// 読み込み前の確認に見せる数字
export function summarize(b: Backup): { people: number; keys: number; at: string } {
  let people = 0;
  try {
    const p: unknown = JSON.parse(b.data['kk:profiles'] ?? 'null');
    if (isObject(p) && Array.isArray(p.list)) people = p.list.length;
  } catch {
    /* profiles が無い・壊れているバックアップは 0 人と表示 */
  }
  return { people, keys: Object.keys(b.data).length, at: b.at };
}
