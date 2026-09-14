/// <reference types="vitest/config" />
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import { svelteVitals } from '@svelte-vitals/vite';

export default defineConfig({
  plugins: [
    // ssr = false のため、プリレンダー済み HTML の殻には title/description/h1/main が無い。
    // レンダリング解析だけが誤検出するので、これらはプラグインでは見ず CLI のソース解析に任せる
    // （svelte-vitals 側の対応待ち: https://github.com/oekazuma/svelte-vitals/issues/682）
    svelteVitals({
      overrides: [
        {
          route: '/**',
          rules: {
            'seo/title-presence': 'off',
            'seo/description-presence': 'off',
            'seo/single-h1': 'off',
            'seo/indexability': 'off',
            'a11y/required-element': 'off'
          }
        }
      ]
    }),
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
      },
      adapter: adapter(),
      paths: { base: (process.env.BASE_PATH ?? '/kakikaki') as `/${string}` },
      serviceWorker: { register: true }
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
