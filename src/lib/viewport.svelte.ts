// 画面の大きさと向き。iPad のホーム画面アプリは起動直後や回転直後に innerWidth/innerHeight が古い値のままで
// resize も来ないことがあるので、複数のイベントで測り直し、向きは matchMedia で判定する
export const vp = $state({ w: 0, h: 0, portrait: false });

export function measure() {
  const de = document.documentElement;
  vp.w = Math.round(visualViewport?.width ?? de.clientWidth ?? innerWidth);
  vp.h = Math.round(visualViewport?.height ?? de.clientHeight ?? innerHeight);
  const mq = matchMedia('(orientation: portrait)');
  vp.portrait = mq.media !== 'not all' ? mq.matches : vp.h > vp.w;
}

// 起動・回転・前面復帰のあと、少し遅れて確定する値を拾うために数回測り直す。タイマーの集合は描画に使わないので反応性は不要
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const timers = new Set<ReturnType<typeof setTimeout>>();
const settle = () => {
  measure();
  for (const ms of [100, 400, 1200]) {
    const t = setTimeout(() => {
      timers.delete(t);
      measure();
    }, ms);
    timers.add(t);
  }
};

export function watchViewport() {
  settle();
  const events: [EventTarget, string][] = [
    [window, 'resize'],
    [window, 'orientationchange'],
    [window, 'pageshow'],
    [window, 'focus'],
    [document, 'visibilitychange']
  ];
  for (const [t, e] of events) t.addEventListener(e, settle);
  visualViewport?.addEventListener('resize', measure);
  const mq = matchMedia('(orientation: portrait)');
  mq.addEventListener('change', settle);
  return () => {
    for (const [t, e] of events) t.removeEventListener(e, settle);
    visualViewport?.removeEventListener('resize', measure);
    mq.removeEventListener('change', settle);
    for (const t of timers) clearTimeout(t);
    timers.clear();
  };
}
