// かくし演出「ピンボール」: 練習画面の単語カードを 10 回タップすると、そのイラストがカードから跳び出し、着地して右へ走り抜ける
// （カードには灰色のシルエットが残る）。
// 走っているイラストをタップすると弾かれて画面の端で跳ね返りながら飛び回り、タップするたびに速く・回転が増す。
// 右の壁に着くと向きを変えて地面を走って戻り、カードの真下から跳び上がって元の場所に収まる。
// 弾かれて時間切れになったときも、落ちて地面を走って同じ道で帰る（画面の外には出ない）。
// 座標は画面の px（左上原点）。イラストの大きさは SIZE の正方形とみなす
export const SIZE = 160;
export const TAPS = 10;
export const RUN_SPEED = 520; // 着地後の px/秒
const JUMP = 560; // 跳び出す初速（上向き）
const GRAVITY = 1500; // 跳び出しの落下
export const LIFE = 6; // 弾いてから消えるまでの秒数（タップするたびに延びる）
export const GOAL = 100; // 壁に当たった回数がここに届くと紙吹雪
const KICK_MIN = 560;
export const RETURN = 0.5; // カードの真下から跳び上がって収まる秒数
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export class Bouncer {
  x = $state(0);
  y = $state(0);
  rot = $state(0);
  phase = $state<'run' | 'pinball' | 'back' | 'up' | 'done'>('run');
  kicks = $state(0);
  hits = $state(0); // 壁に当たった回数
  right = $state(true); // 右へ進んでいる（絵の向きを合わせる）
  private vx = RUN_SPEED * 0.6;
  private vy = -JUMP;
  private spin = 0;
  private life = 0;
  // 帰り道の行き先（カードの元の場所）と、跳び上がりの出発点・経過
  private home: { x: number; y: number };
  private up = { y: 0, rot: 0, t: 0 };

  // start はイラストの中心（画面 px）。そこから跳び出す
  constructor(
    private w: number,
    private h: number,
    start: { x: number; y: number },
    private rnd = Math.random
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
    if (this.phase === 'up') {
      this.up.t = Math.min(1, this.up.t + dt / RETURN);
      const k = ease(this.up.t);
      this.y = this.up.y + (this.home.y - this.up.y) * k;
      this.rot = this.up.rot * (1 - k);
      if (this.up.t >= 1) this.phase = 'done';
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.vx !== 0) this.right = this.vx >= 0;
    const ground = this.h - SIZE - 20;
    if (this.phase === 'run') {
      // 放物線で落ちて、地面（画面下）に着いたら右へ走る。右の壁で折り返して帰り道へ
      this.vy += GRAVITY * dt;
      if (this.y >= ground) {
        this.y = ground;
        this.vy = 0;
        this.vx = RUN_SPEED;
      }
      if (this.x >= this.w - SIZE) {
        this.x = this.w - SIZE;
        this.vx = -RUN_SPEED;
        this.phase = 'back';
      }
      return;
    }
    if (this.phase === 'back') {
      // 空中なら落ちてから、地面をカードの真下まで走り、着いたら跳び上がる
      if (this.y < ground) {
        this.vy += GRAVITY * dt;
        return;
      }
      this.y = ground;
      this.vy = 0;
      const dx = this.home.x - this.x;
      if (Math.abs(dx) <= RUN_SPEED * dt) {
        this.x = this.home.x;
        this.vx = 0;
        this.phase = 'up';
        this.up = { y: this.y, rot: this.rot % 360, t: 0 };
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
    if (this.life <= 0) this.goHome();
  }

  // 弾かれた状態から帰り道へ: 横の速さと回転を止めて落ちる
  private goHome() {
    this.phase = 'back';
    this.vx = 0;
    this.spin = 0;
  }

  // 指で弾く: 上向き寄りのランダムな方向へ、いまより速く飛ばす
  kick() {
    if (this.phase !== 'run' && this.phase !== 'pinball') return;
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
