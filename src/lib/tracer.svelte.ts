import { pathToPoints, type Pt } from './geometry';
import { canStart, advance, traceDone, coverage, JUDGE } from './judge';
import { strokeScore } from './score';
import { recognize, passes, testScore, templatesFor } from './recognize';
import type { Mode } from './progress.svelte';

export type Result = { mode: Mode; score: number; ok: boolean; top: string };
// up() の結果: 画が完成 / 文字が完成 / 逸脱でやり直し / まだ途中（じぶんでかく）/ 1 画ぶん描いた（おてほんなし）
export type UpEvent = 'stroke' | 'done' | 'fail' | 'pending' | 'drawn' | 'idle';

// 1 文字ぶんの書き取りの状態機械。座標は 109 マスの viewBox 単位。描画・演出・タイマーは Canvas.svelte が持つ
export class Tracer {
  si = $state(0);
  cursor = $state(0);
  trail = $state<Pt[]>([]);
  trails = $state<Pt[][]>([]);
  tracing = $state(false);
  readonly samples: Pt[][];
  private scores: number[] = [];
  // いま追っている指。2 本目の指や手のひらは無視する（1 本目の画を壊さない）
  private pointer: number | null = null;

  constructor(
    readonly char: string,
    readonly strokes: Record<string, string[]>,
    readonly mode: Mode
  ) {
    this.samples = strokes[char].map((d) => pathToPoints(d));
  }

  get total() {
    return this.samples.length;
  }
  get finished() {
    return this.si >= this.total;
  }
  get current() {
    return this.samples[this.si];
  }

  // 指を置いた。なぞるでは始点の近くでないと無視する
  down(p: Pt, id = 0): boolean {
    if (this.finished || this.pointer !== null) return false;
    if (this.mode === 'trace') {
      if (!canStart(this.current, p)) return false;
      this.cursor = 0;
    }
    this.pointer = id;
    this.tracing = true;
    this.trail = [p];
    return true;
  }

  // 指が動いた。なぞるで線から外れたら 'fail'
  move(p: Pt, id = 0): 'moved' | 'fail' | 'idle' {
    if (!this.tracing || id !== this.pointer) return 'idle';
    this.trail.push(p);
    if (this.mode === 'trace') {
      const c = advance(this.current, this.cursor, p);
      if (c === -1) {
        this.fail();
        return 'fail';
      }
      this.cursor = c;
    }
    return 'moved';
  }

  up(id = 0): UpEvent {
    if (!this.tracing || id !== this.pointer) return 'idle';
    this.pointer = null;
    this.tracing = false;
    if (this.mode === 'trace') {
      if (traceDone(this.current, this.cursor)) return this.complete(1);
      this.fail();
      return 'fail';
    }
    this.trails.push(this.trail);
    this.trail = [];
    if (this.mode === 'free') {
      const all = this.trails.flat();
      if (coverage(this.current, all) >= JUDGE.FREE_DONE) return this.complete(strokeScore(all, this.current));
      return 'pending';
    }
    return 'drawn';
  }

  private fail() {
    this.pointer = null;
    this.tracing = false;
    this.cursor = 0;
    this.trail = [];
  }

  private complete(score: number): 'stroke' | 'done' {
    this.scores.push(score);
    this.trail = [];
    this.trails = [];
    this.cursor = 0;
    this.si += 1;
    return this.finished ? 'done' : 'stroke';
  }

  // なぞる / じぶんでかく の結果（全画の平均点）
  result(): Result {
    const s = this.scores.reduce((a, b) => a + b, 0) / Math.max(1, this.scores.length);
    return { mode: this.mode, score: s, ok: true, top: this.char };
  }

  // おてほんなし: 書いた画列を全文字のお手本と照合する。何も書いていなければ null
  judge(): Result | null {
    if (this.trails.length === 0) return null;
    const r = recognize(this.trails, templatesFor(this.strokes));
    const mine = r.find((x) => x.char === this.char)!;
    return { mode: 'test', score: testScore(mine.dist), ok: passes(this.char, r), top: r[0].char };
  }
}
