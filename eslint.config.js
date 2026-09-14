import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
  includeIgnoreFile(gitignorePath),
  // 生成物（KanjiVG / DSL からの書き順データ）は lint しない
  { ignores: ['src/lib/strokes.ts', 'src/lib/strokes-*.ts'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    // scripts/*.ts が Node で直接読むモジュールは SvelteKit の仮想モジュールに依存できない（CLAUDE.md「scripts/*.ts」）
    files: ['src/lib/words.ts', 'src/lib/chars.ts', 'src/lib/storage.ts', 'src/lib/today.ts', 'src/lib/crop.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: ['$app/*', '$env/*', '$service-worker'] }] }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser
      }
    }
  }
);
