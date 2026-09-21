import { defineConfig } from 'svelte-vitals';

export default defineConfig({
  failOn: 'warning',
  // 個人用・検索対象外（noindex）の PWA なので、共有向けメタデータや SEO 配信の規則は対象外にする
  seo: { indexable: false },
  rules: {
    // 画像はすべて SVG なので srcset は不要
    'performance/responsive-image': 'off',
    // ディレクトリ名は kebab-case（src/lib/components、src/routes/quiz/read など）
    'architecture/directory-naming': {
      options: { directories: { 'src/lib/*': 'kebab-case', 'src/routes/**': 'kebab-case' } }
    },
    // 全ページに <main> を置く
    'a11y/required-element': { options: { elements: ['main'] } }
  }
});
