import { pathToPoints, dist, type Pt } from './geometry';
import type { Sample } from './ribbon';
import { canStart, advance, traceDone, coverage, JUDGE, TOL, type Tolerance } from './judge';
import { strokeScore } from './score';
import { recognize, passes, testScore, templatesFor } from './recognize';
import type { Mode } from './progress.svelte';

export type Result = { mode: Mode; score: number; ok: boolean; top: string };
// up() の結果: 画が完成 / 文字が完成 / 逸脱でやり直し / まだ途中（じぶんでかく）/ 1 画ぶん描いた（おてほんなし）
type UpEvent = 'stroke' | 'done' | 'fail' | 'pending' | 'drawn' | 'idle';

// 1 文字ぶんの書き取りの状態機械。座標は 109 マスの viewBox 単位。描画・演出・タイマーは Canvas.svelte が持つ
export class Tracer {
  si = $state(0);
  cursor = $state(0);
  trail = $state<Sample[]>([]);
  trails = $state<Sample[][]>([]);
  pr = $state<number[]>([]); // なぞる で通ったお手本の点ごとの筆圧（Pencil のときだけ。線の太さに使う）
  private last: Pt | null = null; // 直前の指の位置（なぞる の先読み幅を動いた距離で決める）
  tracing = $state(false);
  readonly samples: Pt[][];
  private scores: number[] = [];
  // いま追っている指。2 本目の指や手のひらは無視する（1 本目の画を壊さない）
  private pointer: number | null = null;
  // おてほんなし: 前回の judge() から新しい線を足したか
  private judged = false;

  constructor(
    readonly char: string,
    readonly strokes: Record<string, string[]>,
    readonly mode: Mode,
    // おてほんなし で正解にする字（かんじ のかきクイズは同じ読みの字をどれも通す）
    private accept: string[] = [char],
    // なぞる の緩さ（ことば ごと）
    private tol: Tolerance = TOL
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
  down(p: Sample, id = 0): boolean {
    if (this.finished || this.pointer !== null) return false;
    if (this.mode === 'trace') {
      if (!canStart(this.current, p)) return false;
      this.cursor = 0;
    }
    this.pointer = id;
    this.tracing = true;
    this.trail = [p];
    this.pr = p.p != null ? [p.p] : [];
    this.last = p;
    return true;
  }

  // 指が動いた。なぞるで線から外れたら 'fail'
  move(p: Sample, id = 0): 'moved' | 'fail' | 'idle' {
    if (!this.tracing || id !== this.pointer) return 'idle';
    // なぞる では軌跡を描かず判定にも使わないので溜めない
    if (this.mode !== 'trace') this.trail.push(p);
    if (this.mode === 'trace') {
      // お手本の点は 1.5 単位おき。指が 1 回で動いた距離ぶんは先を探せるようにする
      const k = JUDGE.K + Math.ceil(dist(this.last ?? p, p) / 1.5);
      this.last = p;
      const c = advance(this.current, this.cursor, p, this.tol.r, k);
      if (c === -1) {
        // 終点まで来たあとは、少しはみ出しても失敗にしない（離せば完成）。線は終点まで指に追従させる
        if (traceDone(this.current, this.cursor, this.tol.end)) return 'moved';
        this.fail();
        return 'fail';
      }
      if (p.p != null) for (let k = this.pr.length; k <= c; k++) this.pr[k] = p.p;
      this.cursor = c;
    }
    return 'moved';
  }

  up(id = 0): UpEvent {
    if (!this.tracing || id !== this.pointer) return 'idle';
    this.pointer = null;
    this.tracing = false;
    if (this.mode === 'trace') {
      if (traceDone(this.current, this.cursor, this.tol.end)) return this.complete(1);
      this.fail();
      return 'fail';
    }
    this.trails.push(this.trail);
    this.trail = [];
    this.judged = false;
    if (this.mode === 'free') {
      const all = this.trails.flat();
      if (coverage(this.current, all) >= JUDGE.FREE_DONE) return this.complete(strokeScore(all, this.current));
      return 'pending';
    }
    return 'drawn';
  }

  // ひとつ もどる: 最後に引いた線を消す。線が無ければ（じぶんでかく・なぞる）直前に完成した画を取り消す。戻せなければ null
  undo(): 'line' | 'stroke' | null {
    if (this.tracing) return null;
    if (this.trails.length > 0) {
      this.trails.pop();
      this.judged = false;
      return 'line';
    }
    if (this.mode !== 'test' && this.si > 0) {
      this.si -= 1;
      this.scores.pop();
      return 'stroke';
    }
    return null;
  }

  private fail() {
    this.pointer = null;
    this.tracing = false;
    this.cursor = 0;
    this.trail = [];
    this.pr = [];
  }

  private complete(score: number): 'stroke' | 'done' {
    this.scores.push(score);
    this.trail = [];
    this.trails = [];
    this.pr = [];
    this.cursor = 0;
    this.si += 1;
    return this.finished ? 'done' : 'stroke';
  }

  // なぞる / じぶんでかく の結果（全画の平均点）
  result(): Result {
    const s = this.scores.reduce((a, b) => a + b, 0) / Math.max(1, this.scores.length);
    return { mode: this.mode, score: s, ok: true, top: this.char };
  }

  // おてほんなし: 書いた画列を全文字のお手本と照合する。何も書いていない・前回の判定から線を足していなければ null
  judge(): Result | null {
    if (this.trails.length === 0 || this.judged) return null;
    this.judged = true;
    const r = recognize(this.trails, templatesFor(this.strokes));
    const mine = r.find((x) => this.accept.includes(x.char))!;
    return { mode: 'test', score: testScore(mine.dist), ok: passes(this.accept, r), top: r[0].char };
  }
}
