const HOLD_MS = 600;

/**
 * 長押し検知。pointercancel / pointerleave でタイマーが発火した後に
 * pointerup が来ないことがある（指が要素の外に流れて離れる等）ため、
 * 「発火した」フラグは up() で消費して即リセットする。こうしておけば
 * 次の押下の up() がそれを見て無関係なタップまで無視してしまわない。
 */
export class Hold {
  #timer: ReturnType<typeof setTimeout> | undefined;
  #fired = false;

  down(onFire: () => void, ms = HOLD_MS) {
    clearTimeout(this.#timer);
    this.#fired = false;
    this.#timer = setTimeout(() => {
      this.#fired = true;
      onFire();
    }, ms);
  }

  cancel() {
    clearTimeout(this.#timer);
  }

  fired(): boolean {
    return this.#fired;
  }

  // pointerup で呼ぶ。true なら長押しの解放なのでクリックとして扱わない
  up(): boolean {
    clearTimeout(this.#timer);
    const held = this.#fired;
    this.#fired = false;
    return held;
  }
}
