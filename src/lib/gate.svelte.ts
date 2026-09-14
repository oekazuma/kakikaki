import { isObject, loadJSON, saveJSON } from './storage';
import { today } from './today';

const KEY = 'kk:gate';
export const MAX_FAILS = 3;

// 保護者ゲート: 掛け算。1 日 3 回間違えると翌日までロック（日付が変わればリセット）
export class Gate {
  fails = $state(0);
  passed = $state(false);
  wrong = $state(false);
  readonly a: number;
  readonly b: number;

  constructor(rnd = Math.random) {
    this.a = Math.floor(rnd() * 7) + 3;
    this.b = Math.floor(rnd() * 7) + 3;
    const g = loadJSON<{ date?: unknown; fails?: unknown }>(KEY, {}, isObject);
    if (g.date === today() && Number.isInteger(g.fails) && (g.fails as number) >= 0) this.fails = g.fails as number;
  }
  get locked() {
    return this.fails >= MAX_FAILS;
  }
  get left() {
    return MAX_FAILS - this.fails;
  }
  submit(ans: string | number): boolean {
    if (this.locked) return false;
    if (Number(ans) === this.a * this.b) {
      this.passed = true;
      return true;
    }
    this.fails++;
    this.wrong = true;
    saveJSON(KEY, { date: today(), fails: this.fails });
    return false;
  }
}
