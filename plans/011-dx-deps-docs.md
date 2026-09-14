# Plan 011: scripts の型検査・`$app/*` 禁止の機械化・Node の版揃え・エディタ設定・古い設計文書の印・CI の重複

> **Executor instructions**: 上から順に。各ステップは独立。STOP 条件に当たったら報告。
>
> **Drift check**: `git diff --stat 948551a..HEAD -- tsconfig.json package.json eslint.config.js pnpm-workspace.yaml renovate.json .github/workflows docs/superpowers .vscode .prettierignore`

## Status

- **Priority**: P3 · **Effort**: S〜M · **Risk**: LOW（型検査の拡張だけ MED） · **Depends on**: none · **Category**: dx / migration / docs
- **Planned at**: commit `948551a`, 2026-09-14

## Steps

1. **scripts の型検査**: `tsconfig.scripts.json` を新規作成（`extends: ./tsconfig.json`、`include: ['scripts/**/*.ts']`、`compilerOptions: { noEmit: true, allowImportingTsExtensions: true, types: ['node'] }`）。`package.json` の `check` を `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json && tsc -p tsconfig.scripts.json` に。出た型エラーは直す。
2. **`$app/*` 禁止**: `eslint.config.js` に `{ files: ['src/lib/words.ts', 'src/lib/chars.ts', 'src/lib/storage.ts', 'src/lib/today.ts'], rules: { 'no-restricted-imports': ['error', { patterns: ['$app/*', '$env/*', '$service-worker'] }] } }` を足す（`today.ts` は Plan 010 で作る。無ければ外す）。
3. **生成物の lint 除外**: `eslint.config.js` に `{ ignores: ['src/lib/strokes.ts', 'src/lib/strokes-*.ts'] }`。
4. **Node**: `pnpm-workspace.yaml` の `@types/node` を `^24` に下げ、`pnpm install`。`.node-version` に `24.18.1`。`allowBuilds` ブロックを削除。`vite` の下限を `^8.3.0`（`@svelte-vitals/vite` の peer）。
5. **Renovate**: `packageRules` に `{ "matchPackageNames": ["svelte-vitals{/,}**", "@svelte-vitals{/,}**"], "minimumReleaseAge": null }` を足す（pnpm の除外と揃える）。
6. **エディタ**: `.vscode/settings.json` に `editor.defaultFormatter: esbenp.prettier-vscode`、`editor.formatOnSave: true`、`[svelte]` も同じ。`extensions.json` に `esbenp.prettier-vscode`。
7. **CI**: `ci.yml` の `lint` ジョブに `pnpm vitals` ステップを足す（main でも全体スキャン）。`build` ジョブは `if: github.event_name == 'pull_request'`（main では deploy がビルドする）。`deploy.yml` の `paths-ignore` に `.vscode/**` を足す。
8. **古い設計文書**: `docs/superpowers/specs/2026-09-13-kakikaki-hiragana-design.md` と `plans/2026-09-13-kakikaki-hiragana.md` の先頭に「> 2026-09-13 時点の初期設計/計画。実装済みで、現行仕様は `CLAUDE.md` が正。」を 1 行足す。計画側の `**Spec:**` のパスを実在する `docs/superpowers/specs/2026-09-13-kakikaki-hiragana-design.md` に直す。
9. **全体**: `pnpm verify`、`pnpm build`。

## Done criteria

- [ ] `pnpm check` が `scripts/**` を含めて通る（`tsc -p tsconfig.scripts.json` exit 0）
- [ ] `src/lib/words.ts` に `import { base } from '$app/paths'` を一時的に書くと `pnpm lint` が落ちる（確認後に戻す）
- [ ] `cat .node-version` = `24.18.1`、`grep -c allowBuilds pnpm-workspace.yaml` 0、`grep '@types/node' pnpm-workspace.yaml` が `^24`
- [ ] すべての検証が通る

## STOP conditions

- Step 1 で `scripts/*.ts` の型エラーが 10 件を超える → `include` を追加せず報告。
- Step 4 で `@types/node ^24` にすると `vite.config.ts` が型エラー → エラー内容を報告。
