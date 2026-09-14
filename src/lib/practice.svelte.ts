import { WORDS, type Word } from './words';
import { get, record, charCleared, wordStar, checkBadges, type Mode } from './progress.svelte';
import { lettersOf, charsOf } from './lang.svelte';
import type { Badge } from './badges';
import { stars, praise } from './score';
import type { Result } from './tracer.svelte';

// 演出は差し替え可能にしておく（テストでは何もしない）
export type Effects = { buu?: () => void; kira?: () => void; fanfare?: () => void; confetti?: (n: number) => void };

export const MODES: { id: Mode; icon: 'trace' | 'pencil' | 'star'; label: string; hint: string; title: string }[] = [
  {
    id: 'trace',
    icon: 'trace',
    label: 'なぞる',
    hint: 'の まるから みちに そって ゆっくり',
    title: 'なぞって みよう！'
  },
  {
    id: 'free',
    icon: 'pencil',
    label: 'じぶんで かく',
    hint: 'いろの みちを ぬろう。なんかいに わけても いいよ',
    title: 'じぶんで かいてみよう！'
  },
  {
    id: 'test',
    icon: 'star',
    label: 'おてほんなし',
    hint: 'おてほんを みないで かいてみよう',
    title: 'おてほんなしで かいてみよう！'
  }
];

// その文字で次にやるべきモード。全部終わっていれば null
export function nextMode(ch: string): Mode | null {
  const p = get(ch);
  return p.trace < 2 ? 'trace' : p.free < 1 ? 'free' : p.test < 1 ? 'test' : null;
}

const wordDone = (w: Word) => lettersOf(w).every((ch) => nextMode(ch) === null);

// まだ終わっていない次の単語（同じ並び順で後ろから探し、末尾なら先頭へ）。全部終わっていれば null
export function nextWordId(word: Word): string | null {
  if (word.id.startsWith('char-')) {
    const list = charsOf();
    const k = list.indexOf(word.name);
    for (let n = 1; n < list.length; n++) {
      const ch = list[(k + n) % list.length];
      if (nextMode(ch) !== null) return `char-${ch}`;
    }
    return null;
  }
  const k = WORDS.findIndex((w) => w.id === word.id);
  for (let n = 1; n < WORDS.length; n++) {
    const w = WORDS[(k + n) % WORDS.length];
    if (!wordDone(w)) return w.id;
  }
  return null;
}

// 1 単語ぶんの練習の進行。文字は左から順に解放し、文字ごとに なぞる 2 回 → じぶんでかく → おてほんなし
export class PracticeSession {
  readonly chars: string[];
  i = $state(0);
  mode = $state<Mode>('trace');
  gen = $state(0); // 同じ文字・モードで書き取り面を作り直すためのカウンタ
  stroke = $state(0);
  msg = $state('');
  drawn = $state(false); // おてほんなしで 1 画以上書いた
  busy = $state(false);
  complete = $state(false); // 単語の全文字を初めて終えた
  flyStar = $state(false);
  drive = $state(false);
  toast = $state<Badge | null>(null);
  shaking = $state(-1); // 鍵つきタブを押したとき横に揺らす

  constructor(
    readonly word: Word,
    private fx: Effects = {}
  ) {
    this.chars = lettersOf(word);
    this.select(
      Math.max(
        0,
        this.chars.findIndex((ch) => nextMode(ch) !== null)
      )
    );
  }

  get c() {
    return this.chars[this.i];
  }
  get cur() {
    return MODES.find((m) => m.id === this.mode)!;
  }
  // 左から順に解放: 前の文字がクリア済みなら選べる
  unlocked(n: number) {
    return n === 0 || charCleared(this.chars[n - 1]);
  }

  select(n: number, m: Mode = nextMode(this.chars[n]) ?? 'trace') {
    if (!this.unlocked(n)) return;
    this.i = n;
    this.mode = m;
    this.stroke = 0;
    this.msg = '';
    this.drawn = false;
    this.gen++;
  }

  // 鍵つきタブなら揺らして false
  tapTab(n: number): boolean {
    if (this.unlocked(n)) {
      this.select(n);
      return true;
    }
    this.shaking = -1;
    (globalThis.requestAnimationFrame ?? setTimeout)(() => (this.shaking = n));
    this.fx.buu?.();
    return false;
  }

  shaken() {
    this.shaking = -1;
  }

  replay() {
    this.complete = false;
    this.select(0, 'trace');
  }

  nextId() {
    return nextWordId(this.word);
  }

  done(r: Result) {
    if (this.busy) return;
    if (r.mode === 'test' && !r.ok) {
      this.msg = `おしい！ 「${r.top}」に みえるよ。もういちど！`;
      this.fx.buu?.();
      return;
    }
    this.busy = true;
    const c = this.c;
    const wasC = charCleared(c),
      wasW = wordStar(this.word);
    record(c, r.mode);
    const st = r.mode === 'trace' ? 3 : stars(r.score);
    this.msg = r.mode === 'trace' ? 'できた！' : `${'★'.repeat(st)} ${praise(st)}`;
    this.fx.kira?.();
    if (!wasC && charCleared(c)) {
      this.fx.confetti?.(120);
      this.flyStar = true;
      setTimeout(() => (this.flyStar = false), 900);
    }
    let wait = 1200;
    if (!wasW && wordStar(this.word)) {
      wait = 2600;
      setTimeout(() => {
        this.drive = true;
        this.fx.confetti?.(300);
        this.fx.fanfare?.();
      }, 600);
      setTimeout(() => (this.drive = false), 2600);
    }
    const fresh = checkBadges();
    if (fresh.length) {
      this.showBadges(fresh, wait);
      wait += fresh.length * 2600;
    }
    setTimeout(() => {
      this.busy = false;
      const next = nextMode(c);
      if (next) this.select(this.i, next);
      else if (this.i < this.chars.length - 1) this.select(this.i + 1);
      else this.complete = true;
    }, wait);
  }

  private showBadges(list: Badge[], delay: number) {
    list.forEach((b, k) => {
      setTimeout(
        () => {
          this.toast = b;
          this.fx.confetti?.(150);
          this.fx.fanfare?.();
          setTimeout(() => (this.toast = null), 2400);
        },
        delay + k * 2600
      );
    });
  }
}
