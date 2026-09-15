// かくし演出「ピンボール」: 練習画面の単語カードを 10 回タップすると、そのイラストが画面下を走り抜ける。
// 走っているイラストをタップすると弾かれて画面の端で跳ね返りながら飛び回り、タップするたびに速く・回転が増す。
// 座標は画面の px（左上原点）。イラストの大きさは SIZE の正方形とみなす
export const SIZE = 160;
export const TAPS = 10;
export const RUN_SPEED = 520; // px/秒
export const LIFE = 6; // 弾いてから消えるまでの秒数（タップするたびに延びる）
const KICK_MIN = 560;

export class Bouncer {
  x = $state(0);
  y = $state(0);
  rot = $state(0);
  phase = $state<'run' | 'pinball' | 'done'>('run');
  kicks = $state(0);
  private vx = RUN_SPEED;
  private vy = 0;
  private spin = 0;
  private life = 0;

  constructor(
    private w: number,
    private h: number,
    private rnd = Math.random
  ) {
    this.x = -SIZE;
    this.y = h - SIZE - 20;
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
      if (this.x > this.w) this.phase = 'done';
      return;
    }
    // 画面の端で跳ね返る
    if (this.x <= 0) {
      this.x = 0;
      this.vx = Math.abs(this.vx);
    } else if (this.x >= this.w - SIZE) {
      this.x = this.w - SIZE;
      this.vx = -Math.abs(this.vx);
    }
    if (this.y <= 0) {
      this.y = 0;
      this.vy = Math.abs(this.vy);
    } else if (this.y >= this.h - SIZE) {
      this.y = this.h - SIZE;
      this.vy = -Math.abs(this.vy);
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
