import { WORDS, wordById, charWordId, isCharWord, type Word } from './words';
import {
  get,
  record,
  recordStar,
  recordMiss,
  charCleared,
  charGold,
  wordStar,
  wordCrown,
  checkBadges,
  CAP,
  lastWord,
  type Mode
} from './progress.svelte';
import { lettersOf, charsOf, strokesOf, type Lang } from './lang.svelte';
import type { Badge } from './badges';
import { stars, praise } from './score';
import type { Result } from './tracer.svelte';

// 演出は差し替え可能にしておく（テストでは何もしない）
export type Effects = {
  buu?: () => void;
  pon?: () => void;
  kira?: () => void;
  fanfare?: () => void;
  confetti?: (n: number) => void;
};

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
    hint: 'おもいだして かいてみよう',
    title: 'おてほんなしで かいてみよう！'
  }
];

// URL の w= から練習する単語を決める。その言語に書き順の無い文字を含む（例: 言語が en のときの char-あ）なら既定の単語に戻す
export function resolveWord(id: string | null, l: Lang): Word {
  const w = id ? wordById(id) : undefined;
  const strokes = strokesOf(l);
  return w && lettersOf(w, l).every((c) => c in strokes) ? w : wordById('patocar')!;
}

// その文字で次にやるべきモード。クリア（なぞる 2 回 + じぶんでかく）済みなら null。おてほんなし は挑戦として別枠
export function nextMode(ch: string): Mode | null {
  const p = get(ch);
  return p.trace < CAP.trace ? 'trace' : p.free < CAP.free ? 'free' : null;
}

export const wordDone = (w: Word) => lettersOf(w).every((ch) => nextMode(ch) === null);

// 1 文字でも書いた記録があるか（開いただけの単語は「やりかけ」にしない）
const started = (w: Word) =>
  lettersOf(w).some((ch) => {
    const p = get(ch);
    return p.trace + p.free + p.test > 0;
  });

// ホームの「つづきから」: 最後に練習に入った単語に書いた記録があり、まだクリアしていなければそれ。無ければ null（カードを出さない）
export function nextOpenWord(): Word | null {
  const w = wordById(lastWord() ?? '');
  return w && started(w) && !wordDone(w) ? w : null;
}

// まだ終わっていない次の単語（同じ並び順で後ろから探し、末尾なら先頭へ）。全部終わっていれば null
export function nextWordId(word: Word): string | null {
  if (isCharWord(word)) {
    const list = charsOf();
    const k = list.indexOf(word.name);
    for (let n = 1; n < list.length; n++) {
      const ch = list[(k + n) % list.length];
      if (nextMode(ch) !== null) return charWordId(ch);
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

// 1 単語ぶんの練習の進行。文字は左から順に解放し、文字ごとに なぞる 2 回 → じぶんでかく で次の文字へ。
// 全文字クリアの完了モーダルから おてほんなし に挑戦でき、通ると次のまだ金星でない文字の おてほんなし へ進む
export class PracticeSession {
  readonly chars: string[];
  i = $state(0);
  mode = $state<Mode>('trace');
  gen = $state(0); // 同じ文字・モードで書き取り面を作り直すためのカウンタ
  stroke = $state(0);
  msg = $state('');
  drawn = $state(false); // おてほんなしで 1 画以上書いた
  busy = $state(false);
  complete = $state(false); // 単語の最後の文字を終えた（完了モーダル）
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

  // 完了モーダルの「おてほんなしに ちょうせん」: まだ金星でない最初の文字から
  challenge() {
    const k = this.chars.findIndex((ch) => !charGold(ch));
    if (k < 0) return;
    this.complete = false;
    this.select(k, 'test');
  }

  nextId() {
    return nextWordId(this.word);
  }

  // かくし演出のあとなど、書き取り以外で条件を満たしたメダルを確定してトーストを出す
  celebrate() {
    const fresh = checkBadges();
    if (fresh.length) this.showBadges(fresh, 0);
  }

  done(r: Result) {
    if (this.busy) return;
    if (r.mode === 'test' && !r.ok) {
      recordMiss(this.c);
      this.msg = `おしい！ 「${r.top}」に みえるよ。もういちど！`;
      this.fx.buu?.();
      this.drawn = false;
      return;
    }
    this.busy = true;
    const c = this.c;
    const wasC = charCleared(c),
      wasW = wordStar(this.word),
      wasG = wordCrown(this.word);
    record(c, r.mode);
    const st = r.mode === 'trace' ? 3 : stars(r.score);
    if (r.mode === 'free') recordStar(c, st);
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
      const k = r.mode === 'test' ? this.chars.findIndex((ch, n) => n > this.i && !charGold(ch)) : -1;
      if (next) this.select(this.i, next);
      else if (k >= 0) this.select(k, 'test');
      else if (r.mode !== 'test' && this.i < this.chars.length - 1) this.select(this.i + 1);
      // 完了モーダルは新しく星か王冠を取ったときだけ。クリア済みの単語をやり直したときは出さない
      else if (!wasW || (!wasG && wordCrown(this.word))) this.complete = true;
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
