// 新しいバージョンの検知。Service Worker は skipWaiting で即座に入れ替わるが、開いているページは古い JS のまま
// なので、「新しい SW が入った／制御を取った」= 読み直せば新しくなる、として知らせる
export const update = $state({ ready: false, checking: false, checkedAt: 0 });

let watching = false;
let lastCheck = 0;
export function watchUpdates(container: ServiceWorkerContainer | undefined = navigator.serviceWorker) {
  if (watching || !container) return;
  watching = true;
  const mark = () => (update.ready = true);
  // 初回インストールの clients.claim() でも controllerchange が来るので、最初から制御されていたときだけ更新扱い
  if (container.controller) container.addEventListener('controllerchange', mark);
  container.getRegistration().then((reg) => {
    if (!reg) return;
    if (reg.waiting) mark();
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => {
        // 初回インストール（controller なし）は更新ではない
        if ((w.state === 'installed' || w.state === 'activated') && container.controller) mark();
      });
    });
    // ホーム画面のアプリは navigation が起きにくいので、前面に戻ったときに自分で確認する（1 分に 1 回まで）
    const check = () => {
      if (document.visibilityState !== 'visible' || Date.now() - lastCheck < 60_000) return;
      lastCheck = Date.now();
      reg.update().catch(() => {});
    };
    document.addEventListener('visibilitychange', check);
    check();
  });
}

// 「確認する」ボタン用。新しい SW を探しに行き、数秒待って見つかったかを返す
export async function checkForUpdate(container: ServiceWorkerContainer | undefined = navigator.serviceWorker) {
  update.checking = true;
  try {
    const reg = await container?.getRegistration();
    await reg?.update();
    lastCheck = Date.now();
    for (let i = 0; i < 20 && !update.ready; i++) await new Promise((r) => setTimeout(r, 150));
  } catch {
    /* オフラインなど。ready は変えない */
  }
  update.checking = false;
  update.checkedAt = Date.now();
  return update.ready;
}
