/// <reference types="vitest/config" />
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

import { svelteVitals } from '@svelte-vitals/vite';

// バージョン名 = ビルド時刻 + git の短いハッシュ。Service Worker のキャッシュ名にもなるのでビルドごとに必ず変わる。
// SvelteKit は client / server で設定を読み直すため、時刻は環境変数に固定して両者で同じ名前にする
process.env.KK_BUILD ??= String(Date.now());
const gitHash = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'local';
  }
})();

export default defineConfig({
  plugins: [
    svelteVitals(),
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
      },
      adapter: adapter(),
      paths: { base: (process.env.BASE_PATH ?? '/kakikaki') as '' | `/${string}` },
      serviceWorker: { register: true },
      // かくしゲームはどこからもリンクされないので、プリレンダー対象に明示する
      prerender: { entries: ['*', '/balloon'] },
      // pollInterval: 開いている間は 5 分ごとに _app/version.json を見て updated.current を立てる
      version: { name: `${process.env.KK_BUILD}-${gitHash}`, pollInterval: 300_000 },
      // GitHub Pages はヘッダを出せないので <meta http-equiv> で CSP を出す（プリレンダーなので hash）。
      // 依存パッケージ経由で混入したコードが名前や写真を外に送るのを connect-src で止めるのが目的。
      // style は Svelte の transition が <style> を差し込み、app.html に style 属性があるので unsafe-inline。
      // img は写真の data URL（保存済み）と blob:（切り抜き中）を使う
      csp: {
        mode: 'hash',
        directives: {
          'default-src': ['self'],
          'script-src': ['self'],
          'style-src': ['self', 'unsafe-inline'],
          'img-src': ['self', 'data:', 'blob:'],
          'font-src': ['self'],
          'connect-src': ['self'],
          'worker-src': ['self'],
          'manifest-src': ['self'],
          'object-src': ['none'],
          'base-uri': ['self']
        }
      }
    })
  ],
  test: {
    projects: [
      {
        // 純粋関数と localStorage 直結ストアのテスト（happy-dom）
        extends: true,
        test: {
          name: 'unit',
          environment: 'happy-dom',
          include: ['src/**/*.test.ts']
        }
      }
    ]
  }
});
