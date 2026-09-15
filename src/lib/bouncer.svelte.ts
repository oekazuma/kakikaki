// かくし演出「ピンボール」: 練習画面の単語カードを 10 回タップすると、そのイラストがカードから跳び出し、着地して右へ走り抜ける
// （カードには灰色のシルエットが残る）。
// 走っているイラストをタップすると弾かれて画面の端で跳ね返りながら飛び回り、タップするたびに速く・回転が増す。
// 座標は画面の px（左上原点）。イラストの大きさは SIZE の正方形とみなす
export const SIZE = 160;
export const TAPS = 10;
export const RUN_SPEED = 520; // 着地後の px/秒
const JUMP = 560; // 跳び出す初速（上向き）
const GRAVITY = 1500; // 跳び出しの落下
export const LIFE = 6; // 弾いてから消えるまでの秒数（タップするたびに延びる）
export const GOAL = 100; // 壁に当たった回数がここに届くと紙吹雪
const KICK_MIN = 560;

export class Bouncer {
  x = $state(0);
  y = $state(0);
  rot = $state(0);
  phase = $state<'run' | 'pinball' | 'done'>('run');
  kicks = $state(0);
  hits = $state(0); // 壁に当たった回数
  private vx = RUN_SPEED * 0.6;
  private vy = -JUMP;
  private spin = 0;
  private life = 0;

  // start はイラストの中心（画面 px）。そこから跳び出す
  constructor(
    private w: number,
    private h: number,
    start: { x: number; y: number },
    private rnd = Math.random
  ) {
    this.x = start.x - SIZE / 2;
    this.y = start.y - SIZE / 2;
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
  }

  tick(dt: number) {
    if (this.phase === 'done') return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.phase === 'run') {
      // 放物線で落ちて、地面（画面下）に着いたら走る
      const ground = this.h - SIZE - 20;
      this.vy += GRAVITY * dt;
      if (this.y >= ground) {
        this.y = ground;
        this.vy = 0;
        this.vx = RUN_SPEED;
      }
      if (this.x > this.w) this.phase = 'done';
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
    if (this.life <= 0) this.phase = 'done';
  }

  // 指で弾く: 上向き寄りのランダムな方向へ、いまより速く飛ばす
  kick() {
    if (this.phase === 'done') return;
    this.phase = 'pinball';
    this.kicks++;
    const speed = Math.max(KICK_MIN, Math.hypot(this.vx, this.vy) * 1.25);
    const a = -Math.PI * (0.15 + this.rnd() * 0.7); // -27°〜-153°（上半分）
    this.vx = Math.cos(a) * speed;
    this.vy = Math.sin(a) * speed;
    this.spin = (this.rnd() < 0.5 ? -1 : 1) * (180 + this.kicks * 90);
    this.life = LIFE;
  }
}
