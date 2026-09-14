import { today } from './progress.svelte';

const KEY = 'kk:gate';
export const MAX_FAILS = 3;

// 保護者ゲート: 掛け算。1 日 3 回間違えると翌日までロック（日付が変わればリセット）
export class Gate {
  fails = $state(0);
  passed = $state(false);
  wrong = $state(false);
  readonly a: number;
  readonly b: number;

  constructor(
    rnd = Math.random,
    private store: Pick<Storage, 'getItem' | 'setItem'> = localStorage
  ) {
    this.a = Math.floor(rnd() * 7) + 3;
    this.b = Math.floor(rnd() * 7) + 3;
    try {
      const g = JSON.parse(store.getItem(KEY) ?? 'null');
      if (g?.date === today()) this.fails = g.fails;
    } catch {
      /* 壊れた保存値は 0 回扱い */
    }
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
    this.store.setItem(KEY, JSON.stringify({ date: today(), fails: this.fails }));
    return false;
  }
}
