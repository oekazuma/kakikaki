/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { base, build, files, prerendered, version } from '$service-worker';
import { bypass, cacheable, stale } from './lib/sw-rules';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `kk-${version}`;

// ハッシュ付きの build は HTTP キャッシュのままでよい。files / prerendered は URL が変わらないので取り直す。
// 1 件の失敗で全体を捨てない（残りは使われたときに fetch ハンドラが入れる）
sw.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) =>
        Promise.allSettled([
          ...build.map((u) => c.add(u)),
          ...[...files, ...prerendered].map((u) => c.add(new Request(u, { cache: 'reload' })))
        ])
      )
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
