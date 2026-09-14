import { defineConfig } from 'svelte-vitals';

// 個人用・検索対象外（noindex）の PWA なので、共有向けメタデータや SEO 配信の規則は対象外にする
export default defineConfig({
  failOn: 'warning',
  rules: {
    'seo/canonical-url': 'off',
    'seo/og-title': 'off',
    'seo/og-description': 'off',
    'seo/og-image': 'off',
    'seo/og-url': 'off',
    'seo/twitter-card': 'off',
    'seo/json-ld': 'off',
    'seo/sitemap-xml': 'off',
    'seo/sitemap-in-robots': 'off',
    'seo/description-length': 'off',
    // オフラインで動く SPA として意図的に ssr = false
    'seo/ssr-disabled': 'off',
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
