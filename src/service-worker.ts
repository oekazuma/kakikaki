/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { base, build, files, prerendered, version } from '$service-worker';
import { bypass, cacheable, stale } from './lib/sw-rules';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `kk-${version}`;

// build（ハッシュ付き）と prerendered（殻 HTML）は版が揃わないと起動しないので addAll でまとめて入れ、1 件でも失敗したら
// install ごと失敗させて前の版を残す（デプロイ直後は CDN の古い HTML と新しい JS が混ざることがある）。
// files（イラスト・フォント・効果音）は 1 件の失敗で全体を捨てず、残りは使われたときに fetch ハンドラが入れる。
// ハッシュ付きの build は HTTP キャッシュのままでよく、URL が変わらない files / prerendered だけ取り直す
sw.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then(async (c) => {
        await c.addAll([...build, ...prerendered.map((u) => new Request(u, { cache: 'reload' }))]);
        await Promise.allSettled(files.map((u) => c.add(new Request(u, { cache: 'reload' }))));
      })
      .then(() => sw.skipWaiting())
  );
});

sw.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => stale(k, CACHE)).map((k) => caches.delete(k))))
      .then(() => sw.clients.claim())
  );
});

// cache-first。?w=... 付きの練習画面もクエリ無視で prerendered の shell に当てる
sw.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (bypass(e.request.url)) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(
      (hit) =>
        hit ??
        fetch(e.request)
          .then((res) => {
            if (cacheable(res, e.request.url, location.origin)) {
              const copy = res.clone();
              void caches.open(CACHE).then((c) => c.put(e.request, copy));
            }
            return res;
          })
          .catch(async () => (e.request.mode === 'navigate' && (await caches.match(`${base}/`))) || Response.error())
    )
  );
});
