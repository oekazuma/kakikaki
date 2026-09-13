/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { base, build, files, prerendered, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `kk-${version}`;
const ASSETS = [...build, ...files, ...prerendered];

sw.addEventListener('install', (e) => {
	e.waitUntil(
		caches
			.open(CACHE)
			.then((c) => c.addAll(ASSETS))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (e) => {
	e.waitUntil(
		caches
			.keys()
			.then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

// cache-first。?w=... 付きの練習画面もクエリ無視で prerendered の shell に当てる
sw.addEventListener('fetch', (e) => {
	if (e.request.method !== 'GET') return;
	e.respondWith(
		caches.match(e.request, { ignoreSearch: true }).then(
			(hit) =>
				hit ??
				fetch(e.request)
					.then((res) => {
						if (res.ok && new URL(e.request.url).origin === location.origin) {
							const copy = res.clone();
							void caches.open(CACHE).then((c) => c.put(e.request, copy));
						}
						return res;
					})
					.catch(async () => (e.request.mode === 'navigate' && (await caches.match(`${base}/`))) || Response.error())
		)
	);
});
