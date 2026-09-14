import { makeReadQuiz, makeWriteQuiz, type Kind, type Level, type ReadQ } from './quiz';
import { lettersOf, lang } from './lang.svelte';
import { recordQuiz, checkBadges, type Mode } from './progress.svelte';
import type { Word } from './words';
import type { Result } from './tracer.svelte';
import type { Effects } from './practice.svelte';

export const levelFromParam = (v: string | null): Level =>
  Math.min(3, Math.max(1, Math.round(Number(v) || 1))) as Level;

// 終了時の記録と演出は よみ・かき で共通
function finish(kind: Kind, level: Level, correct: number, total: number, fx: Effects) {
  recordQuiz(kind, level, correct);
  checkBadges();
  if (correct >= total * 0.7) {
    fx.confetti?.(correct === total ? 300 : 120);
    fx.fanfare?.();
  }
}

// よみクイズ: 文字→イラスト / イラスト→文字 の 3 択。最初の一発で当てた分だけ正解
export class ReadQuiz {
  qs = $state<ReadQ[]>([]);
  i = $state(0);
  correct = $state(0);
  wrong = $state<string[]>([]); // この問題で外した選択肢
  hit = $state<string | null>(null);
  done = $state(false);

  constructor(
    readonly level: Level,
    private fx: Effects = {},
    private rnd = Math.random
  ) {
    this.start();
  }
  get q() {
    return this.qs[this.i];
  }
  start() {
    this.qs = makeReadQuiz(lang.v, this.level, undefined, this.rnd);
    this.i = 0;
    this.correct = 0;
    this.wrong = [];
    this.hit = null;
    this.done = false;
  }
  // key は単語の id か、穴埋めなら文字
  pick(key: string): 'hit' | 'wrong' | 'ignored' {
    if (this.hit) return 'ignored';
    if (key !== this.q.key) {
      this.wrong = [...this.wrong, key];
      this.fx.buu?.();
      return 'wrong';
    }
    this.hit = key;
    if (this.wrong.length === 0) this.correct++;
    this.fx.kira?.();
    setTimeout(() => {
      if (this.i < this.qs.length - 1) {
        this.i++;
        this.wrong = [];
        this.hit = null;
      } else {
        this.done = true;
        finish('read', this.level, this.correct, this.qs.length, this.fx);
      }
    }, 900);
    return 'hit';
  }
}

// かきクイズ: イラストを見て 1 文字ずつお手本なしで書く。2 回外すとお手本をなぞる（その単語は正解に数えない）
export class WriteQuiz {
  words = $state<Word[]>([]);
  i = $state(0); // 問題
  k = $state(0); // 文字
  miss = $state(0);
  helped = $state(false);
  correct = $state(0);
  mode = $state<Mode>('test');
  gen = $state(0);
  msg = $state('');
  drawn = $state(false);
  done = $state(false);

  constructor(
    readonly level: Level,
    private fx: Effects = {},
    private rnd = Math.random
  ) {
    this.start();
  }
  get word() {
    return this.words[this.i];
  }
  get letters() {
    return this.word ? lettersOf(this.word) : [];
  }
  get c() {
    return this.letters[this.k];
  }
  start() {
    this.words = makeWriteQuiz(lang.v, this.level, undefined, this.rnd);
    this.i = 0;
    this.correct = 0;
    this.done = false;
    this.nextLetter(0);
  }
  nextLetter(n: number) {
    this.k = n;
    this.miss = 0;
    this.mode = 'test';
    this.msg = '';
    this.drawn = false;
    this.gen++;
    if (n === 0) this.helped = false;
  }
  onDone(r: Result) {
    if (r.mode === 'test' && !r.ok) {
      this.miss++;
      this.fx.buu?.();
      if (this.miss >= 2) {
        this.helped = true;
        this.mode = 'trace';
        this.msg = 'おてほんを なぞって みよう';
        this.gen++;
      } else this.msg = `おしい！ 「${r.top}」に みえるよ。もういちど！`;
      return;
    }
    this.fx.pon?.();
    if (this.k < this.letters.length - 1) return this.nextLetter(this.k + 1);
    if (!this.helped) this.correct++;
    this.fx.kira?.();
    this.fx.confetti?.(80);
    this.msg = this.helped ? 'かけたね！' : 'せいかい！';
    setTimeout(() => {
      if (this.i < this.words.length - 1) {
        this.i++;
        this.nextLetter(0);
      } else {
        this.done = true;
        finish('write', this.level, this.correct, this.words.length, this.fx);
      }
    }, 1400);
  }
}
