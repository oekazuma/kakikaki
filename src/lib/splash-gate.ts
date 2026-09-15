// 起動画面を消すタイミングの判定。iPad のホーム画面アプリは起動直後に縦向きの座標系で
// 一度描かれてから横向きに組み替わるため、画面サイズが落ち着き・フォントが読めるまで待つ。
// ただし見栄えのため最短 1.3 秒は見せ、組み替わりが終わらない機種でも最長 2.5 秒で切り上げる。
// フォント読み込みだけは 1.5 秒で見切る（サイズの安定待ちの上限 2.5 秒より短いので、
// 全体の待ち時間を延ばすことはない）
const MIN = 1300;
const MAX = 2500;
const FONT_TIMEOUT = 1500;
const SETTLE = 200;

export class SplashGate {
  private lastResize: number;
  private fontsOk = false;

  constructor(private readonly start: number) {
    this.lastResize = start;
  }

  resize(now: number) {
    this.lastResize = now;
  }

  fontsReady() {
    this.fontsOk = true;
  }

  done(now: number): boolean {
    const elapsed = now - this.start;
    if (elapsed < MIN) return false;
    if (elapsed >= MAX) return true;
    const fontsOk = this.fontsOk || elapsed >= FONT_TIMEOUT;
    return fontsOk && now - this.lastResize >= SETTLE;
  }
}
