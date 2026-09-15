// 画面の大きさと向き。iPad のホーム画面アプリは起動直後や回転直後に innerWidth/innerHeight が古い値のままで
// resize も来ないことがあるので、複数のイベントで測り直し、向きは matchMedia で判定する。
// 大きさはレイアウトビューポート（documentElement.client*）を使う。visualViewport はソフトキーボードが出ると縮み、
// 名前入力中に「がめんを もっと おおきく」の案内が出て入力できなくなるため
export const vp = $state({ w: 0, h: 0, portrait: false });

function measure() {
  const de = document.documentElement;
  vp.w = Math.round(de.clientWidth || innerWidth);
  vp.h = Math.round(de.clientHeight || innerHeight);
  const mq = matchMedia('(orientation: portrait)');
  vp.portrait = mq.media !== 'not all' ? mq.matches : vp.h > vp.w;
}

// 起動・回転・前面復帰のあと、少し遅れて確定する値を拾うために数回測り直す
const settle = () => {
  measure();
  for (const ms of [100, 400, 1200]) setTimeout(measure, ms);
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
  };
}
