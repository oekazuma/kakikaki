import type { Profile } from './profiles.svelte';

// かくしゲーム「ふうせん ぽん」: 下から上がる風船をタップして割る。3 回見逃すと終わり
export type Balloon = { id: number; x: number; y: number; size: number; color: string; vy: number };
// 紫は見づらいので使わない
export const COLORS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#ec407a', '#26c6da'];
export const MISS_MAX = 3;
export const points = (combo: number) => 10 + Math.min(10, combo - 1) * 5; // 10, 15, … 60

export class BalloonGame {
  balloons = $state<Balloon[]>([]);
  score = $state(0);
  combo = $state(0);
  maxCombo = $state(0);
  misses = $state(0);
  popped = $state(0);
  over = $state(false);
  private time = 0;
  private nextSpawn = 0;
  private nextId = 1;
  constructor(private rnd = Math.random) {}

  start() {
    this.balloons = [];
    this.score = this.combo = this.maxCombo = this.misses = this.popped = 0;
    this.over = false;
    this.time = 0;
    this.nextSpawn = 0.3;
  }
  // 経過時間 dt 秒ぶん進める。y は画面の高さを 1 とした上からの位置（1 が下端、0 が上端）
  tick(dt: number) {
    if (this.over) return;
    this.time += dt;
    for (const b of this.balloons) b.y -= b.vy * dt;
    const gone = this.balloons.filter((b) => b.y < -0.25);
    this.balloons = this.balloons.filter((b) => b.y >= -0.25);
    for (let i = 0; i < gone.length && !this.over; i++) this.miss();
    while (!this.over && this.time >= this.nextSpawn) {
      this.spawn();
      // だんだん速く・多く（間隔 0.9 → 0.4 秒、速さ 0.22 → 0.6 画面/秒）
      this.nextSpawn += Math.max(0.4, 0.9 - this.time * 0.012);
    }
  }
  private spawn() {
    const size = 84 + Math.floor(this.rnd() * 44);
    this.balloons.push({
      id: this.nextId++,
      x: 0.08 + this.rnd() * 0.84,
      y: 1.1,
      size,
      color: COLORS[Math.floor(this.rnd() * COLORS.length)],
      vy: Math.min(0.6, 0.22 + this.time * 0.007) + this.rnd() * 0.08
    });
  }
  // 割れたら得点、見つからなければ 0
  pop(id: number): number {
    const b = this.balloons.find((b) => b.id === id);
    if (!b || this.over) return 0;
    this.balloons = this.balloons.filter((x) => x.id !== id);
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.popped++;
    const p = points(this.combo);
    this.score += p;
    return p;
  }
  private miss() {
    this.combo = 0;
    this.misses++;
    if (this.misses >= MISS_MAX) {
      this.over = true;
      this.balloons = [];
    }
  }
}

// ランキングは使う人をまたいで 1 つ（kk:balloon = { pid: { score, date } }）
export type Best = { score: number; date: string };
const KEY = 'kk:balloon';
const store = () => (typeof localStorage === 'undefined' ? null : localStorage);
export function loadBests(): Record<string, Best> {
  try {
    return JSON.parse(store()?.getItem(KEY) ?? 'null') ?? {};
  } catch {
    return {};
  }
}
// 自己ベストを更新したら true
export function saveScore(pid: string, score: number, date: string): boolean {
  const all = loadBests();
  if ((all[pid]?.score ?? 0) >= score) return false;
  all[pid] = { score, date };
  store()?.setItem(KEY, JSON.stringify(all));
  return true;
}
export function ranking(list: Profile[]): (Profile & Best)[] {
  const all = loadBests();
  return list
    .filter((p) => all[p.id])
    .map((p) => ({ ...p, ...all[p.id] }))
    .sort((a, b) => b.score - a.score);
}
