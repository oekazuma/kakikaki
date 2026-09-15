import type { Pt } from './geometry';

// かくし演出「ピンボール」: 練習画面の単語カードを 10 回タップすると、そのイラストがカードから跳び出し、着地したあと
// 画面の真ん中で単語の頭文字を書き順どおりに走って書き（通った跡が線で残る）、書き終えるとカードの元の場所へ跳んで戻る
// （カードには灰色のシルエットが残る）。
// 走っているイラストをタップすると弾かれて画面の端で跳ね返りながら飛び回り、タップするたびに速く・回転が増す。
// 弾かれて時間切れになると落ちて地面をカードの真下まで走り、跳び上がって戻る（画面の外には出ない）。
// 座標は画面の px（左上原点）。イラストの大きさは SIZE の正方形とみなす
export const SIZE = 160;
export const TAPS = 10;
export const RUN_SPEED = 520; // 地面を走る px/秒
const JUMP = 560; // 跳び出す初速（上向き）
const GRAVITY = 1500; // 跳び出しの落下
export const LIFE = 6; // 弾いてから消えるまでの秒数（タップするたびに延びる）
export const GOAL = 100; // 壁に当たった回数がここに届くと紙吹雪
const KICK_MIN = 560;
export const WRITE = 2.4; // 文字を書く秒数（全画の合計。画の長さで按分）
const HOP = 0.2; // 画と画の間を移動する秒数
export const RETURN = 0.5; // カードへ跳んで収まる秒数
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

// 書く道のり。draw の区間は通った跡を残す
type Seg = { pts: Pt[]; cum: number[]; draw: boolean; dur: number };
const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
function segment(pts: Pt[], draw: boolean, dur: number): Seg {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
  return { pts, cum, draw, dur };
}
// 道のりの f（0〜1）の位置
function along(s: Seg, f: number): Pt {
  const total = s.cum[s.cum.length - 1];
  if (total === 0) return s.pts[s.pts.length - 1];
  const d = f * total;
  let i = 1;
  while (i < s.cum.length - 1 && s.cum[i] < d) i++;
  const t = (d - s.cum[i - 1]) / (s.cum[i] - s.cum[i - 1] || 1);
  const a = s.pts[i - 1],
    b = s.pts[i];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export class Bouncer {
  x = $state(0);
  y = $state(0);
  rot = $state(0);
  phase = $state<'run' | 'write' | 'pinball' | 'back' | 'home' | 'done'>('run');
  kicks = $state(0);
  hits = $state(0); // 壁に当たった回数
  right = $state(true); // 右へ進んでいる（絵の向きを合わせる）
  trails = $state<Pt[][]>([]); // 書いた跡（イラストの中心の軌跡。画ごと）
  private vx = RUN_SPEED * 0.6;
  private vy = -JUMP;
  private spin = 0;
  private life = 0;
  private home: { x: number; y: number };
  private segs: Seg[] = [];
  private seg = 0;
  private segT = 0;
  private fly = { x: 0, y: 0, rot: 0, t: 0 };

  // start はイラストの中心（画面 px）。そこから跳び出す。letter は書く文字の画（109 マスの座標の点列）
  constructor(
    private w: number,
    private h: number,
    start: { x: number; y: number },
    private rnd = Math.random,
    private letter: Pt[][] = []
  ) {
    this.x = start.x - SIZE / 2;
    this.y = start.y - SIZE / 2;
    this.home = { x: this.x, y: this.y };
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
  }

  tick(dt: number) {
    if (this.phase === 'done') return;
    if (this.phase === 'home') return this.tickHome(dt);
    if (this.phase === 'write') return this.tickWrite(dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.vx !== 0) this.right = this.vx >= 0;
    const ground = this.h - SIZE - 20;
    if (this.phase === 'run') {
      // 放物線で落ちて、地面（画面下）に着いたら文字を書きに行く
      this.vy += GRAVITY * dt;
      if (this.y >= ground) {
        this.y = ground;
        this.vy = 0;
        this.vx = 0;
        this.startWrite();
      }
      return;
    }
    if (this.phase === 'back') {
      // 空中なら落ちてから、地面をカードの真下まで走り、着いたら跳び上がる
      if (this.y < ground) {
        // 上へ飛んでいる途中で時間切れになっても画面の上には出さない
        if (this.y < 0) {
          this.y = 0;
          this.vy = 0;
        }
        this.vy += GRAVITY * dt;
        return;
      }
      this.y = ground;
      this.vy = 0;
      const dx = this.home.x - this.x;
      if (Math.abs(dx) <= RUN_SPEED * dt) {
        this.x = this.home.x;
        this.vx = 0;
        this.goHome();
        return;
      }
      this.vx = Math.sign(dx) * RUN_SPEED;
      return;
    }
    // 画面の端で跳ね返る（回数を数える）
    if (this.x <= 0) {
      this.x = 0;
      this.vx = Math.abs(this.vx);
      this.hits++;
    } else if (this.x >= this.w - SIZE) {
      this.x = this.w - SIZE;
      this.vx = -Math.abs(this.vx);
      this.hits++;
    }
    if (this.y <= 0) {
      this.y = 0;
      this.vy = Math.abs(this.vy);
      this.hits++;
    } else if (this.y >= this.h - SIZE) {
      this.y = this.h - SIZE;
      this.vy = -Math.abs(this.vy);
      this.hits++;
    }
    this.rot += this.spin * dt;
    this.life -= dt;
    if (this.life <= 0) {
      this.phase = 'back';
      this.vx = 0;
      this.spin = 0;
    }
  }

  // 文字を画面の真ん中に大きく置き、画ごとに「始点へ移動 → 書く」の区間を作る。文字が無ければそのまま帰る
  private startWrite() {
    if (!this.letter.length) return this.goHome();
    const S = Math.min(this.w * 0.55, this.h * 0.62);
    const ox = (this.w - S) / 2 - SIZE / 2,
      oy = (this.h - S) / 2 - SIZE / 2;
    const strokes = this.letter.map((pts) => pts.map((p) => ({ x: ox + (p.x / 109) * S, y: oy + (p.y / 109) * S })));
    const lens = strokes.map((pts) => segment(pts, true, 0).cum.at(-1)!);
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    let at: Pt = { x: this.x, y: this.y };
    this.segs = strokes.flatMap((pts, i) => {
      const move = segment([at, pts[0]], false, HOP);
      at = pts[pts.length - 1];
      return [move, segment(pts, true, WRITE * (lens[i] / total))];
    });
    this.seg = 0;
    this.segT = 0;
    this.trails = [];
    this.phase = 'write';
  }

  private tickWrite(dt: number) {
    this.segT += dt;
    let s = this.segs[this.seg];
    while (this.segT >= s.dur) {
      this.segT -= s.dur;
      const end = s.pts[s.pts.length - 1];
      this.moveTo(end, s.draw);
      if (++this.seg >= this.segs.length) return this.goHome();
      s = this.segs[this.seg];
      if (s.draw) this.trails.push([]);
    }
    if (this.seg === 0 && this.trails.length === 0 && s.draw) this.trails.push([]);
    this.moveTo(along(s, this.segT / s.dur), s.draw);
  }

  private moveTo(p: Pt, draw: boolean) {
    if (Math.abs(p.x - this.x) > 0.5) this.right = p.x >= this.x;
    this.x = p.x;
    this.y = p.y;
    if (draw) {
      if (!this.trails.length) this.trails.push([]);
      this.trails[this.trails.length - 1].push({ x: p.x + SIZE / 2, y: p.y + SIZE / 2 });
    }
  }

  // カードへ跳んで戻る。回転は一周未満に丸めてから 0 へ
  private goHome() {
    this.phase = 'home';
    this.fly = { x: this.x, y: this.y, rot: this.rot % 360, t: 0 };
    if (Math.abs(this.home.x - this.x) > 0.5) this.right = this.home.x >= this.x;
  }

  private tickHome(dt: number) {
    this.fly.t = Math.min(1, this.fly.t + dt / RETURN);
    const k = ease(this.fly.t);
    this.x = this.fly.x + (this.home.x - this.fly.x) * k;
    this.y = this.fly.y + (this.home.y - this.fly.y) * k;
    this.rot = this.fly.rot * (1 - k);
    if (this.fly.t >= 1) this.phase = 'done';
  }

  // 指で弾く: 上向き寄りのランダムな方向へ、いまより速く飛ばす。書いている途中なら跡は消える
  kick() {
    if (this.phase !== 'run' && this.phase !== 'write' && this.phase !== 'pinball') return;
    this.phase = 'pinball';
    this.trails = [];
    this.kicks++;
    const speed = Math.max(KICK_MIN, Math.hypot(this.vx, this.vy) * 1.25);
    const a = -Math.PI * (0.15 + this.rnd() * 0.7); // -27°〜-153°（上半分）
    this.vx = Math.cos(a) * speed;
    this.vy = Math.sin(a) * speed;
    this.spin = (this.rnd() < 0.5 ? -1 : 1) * (180 + this.kicks * 90);
    this.life = LIFE;
  }
}
