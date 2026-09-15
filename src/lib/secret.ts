import { isObject, loadJSON, saveJSON } from './storage';

// かくし要素の記録（メダル用）。使う人ごとに 1 つ、ことばをまたいで共有（kk:secret = { pid: { balloons, eggs, pinball } }）
export type Secret = { balloons: number; eggs: number; pinball: number };
const KEY = 'kk:secret';
const EMPTY: Secret = { balloons: 0, eggs: 0, pinball: 0 };
const loadAll = () => loadJSON<Record<string, Partial<Secret>>>(KEY, {}, isObject);
export const secretOf = (pid: string): Secret => ({ ...EMPTY, ...loadAll()[pid] });

function update(pid: string, patch: (s: Secret) => Partial<Secret>) {
  const all = loadAll();
  all[pid] = { ...secretOf(pid), ...patch(secretOf(pid)) };
  saveJSON(KEY, all);
}
// ふうせん ぽん を 1 回遊んだ
export const recordBalloon = (pid: string) => update(pid, (s) => ({ balloons: s.balloons + 1 }));
// 単語カードの絵を跳び出させた
export const recordEgg = (pid: string) => update(pid, (s) => ({ eggs: s.eggs + 1 }));
// ピンボールで壁に当てた最高回数
export const recordPinball = (pid: string, hits: number) =>
  update(pid, (s) => ({ pinball: Math.max(s.pinball, hits) }));
export function removeSecret(pid: string) {
  const all = loadAll();
  delete all[pid];
  saveJSON(KEY, all);
}
