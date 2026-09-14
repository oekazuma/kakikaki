export type PwaStatus = { standalone: boolean; swActive: boolean; cached: boolean };

// ホーム画面から起動しているか / Service Worker が有効か / オフライン用の保存があるか
export async function pwaStatus(): Promise<PwaStatus> {
  const standalone =
    matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const swActive = !!(await navigator.serviceWorker?.getRegistration())?.active;
  const ks = (await caches?.keys()) ?? [];
  const k = ks.find((k) => k.startsWith('kk-'));
  const cached = !!k && (await (await caches.open(k)).keys()).length > 0;
  return { standalone, swActive, cached };
}

// 新しい Service Worker を取りに行き、取り込み（HTTP キャッシュを無視した再取得）が終わってから読み直す
export async function updateApp() {
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) {
    await reg.update();
    const w = reg.installing ?? reg.waiting;
    if (w) {
      await new Promise<void>((done) => {
        const t = setTimeout(done, 30000);
        w.addEventListener('statechange', () => {
          if (w.state === 'activated' || w.state === 'redundant') {
            clearTimeout(t);
            done();
          }
        });
      });
    }
  } else {
    await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
  }
  location.reload();
}
