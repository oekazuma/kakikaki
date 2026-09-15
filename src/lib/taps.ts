// カード連打でかくし演出を起こす判定。直前のタップから gap 以上あくと数え直す
export class TapCounter {
  private count = 0;
  private last = 0;

  constructor(
    readonly need: number,
    readonly gap: number
  ) {}

  tap(now: number): boolean {
    this.count = now - this.last < this.gap ? this.count + 1 : 1;
    this.last = now;
    if (this.count < this.need) return false;
    this.count = 0;
    return true;
  }
}
