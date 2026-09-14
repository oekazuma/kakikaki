# Plan 006: 生成ファイルの整形除外・ドキュメントの誤り・KanjiVG の固定・不要な型定義・CI 権限をまとめて直す

> **Executor instructions**: この計画を上から順に実行する。各ステップは独立しているので、1 つが STOP に
> 当たっても他は進めてよい（報告で「どのステップを飛ばしたか」を明記する）。検証コマンドの期待結果を
> 確認してから次へ進む。終わったら `plans/README.md` の自分の行のステータスを更新する。
>
> **Drift check（最初に実行）**:
> `git diff --stat b611db7..HEAD -- .prettierignore CLAUDE.md README.md scripts/fetch-strokes.ts package.json pnpm-workspace.yaml .github/workflows/deploy.yml .github/workflows/ci.yml`
> 変わっていたら該当ステップの「Current state」と実物を見比べ、食い違えばそのステップだけ STOP。

## Status

- **Priority**: P2
- **Effort**: S（合計で半日以内）
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx + docs + security（CI 権限）
- **Planned at**: commit `b611db7`, 2026-09-14

## Why this matters

どれも 1〜3 行の変更だが、放置すると具体的なコストがある:

- **A. `strokes-kana.ts` が prettier の対象**: `pnpm strokes` は 2 ファイルを同じ `JSON.stringify(out, null, '\t')` で書くが、`.prettierignore` には `strokes.ts` と `strokes-en.ts` しか無く、`strokes-kana.ts` は prettier 整形済み（2 スペース・引用符なし）の姿でコミットされている。再生成すると `pnpm lint` が落ち、`pnpm format` すると生成物と食い違う。CLAUDE.md の再生成手順が CI を壊す。
- **B. `BASE_PATH=/ pnpm build` は動かない**: SvelteKit は `paths.base` が `/` で終わることを拒む（空文字か、`/` で始まり `/` で終わらない文字列）。公開先を変える唯一の手順が失敗する。正しくは `BASE_PATH= pnpm build`。
- **C. CLAUDE.md / README の 3 つの誤り**: `passes` の説明が 1 位側の距離条件（`D_MAX × 2`）を落としている。`RECOG` は実機調整の対象と明記された定数なので、`D_MAX` を星の曲線だけと思って動かすと合否も動く。英語の行グループは「7 文字ずつ」ではなく 13 文字の行を 7+6 に割った 8 グループで、メダル数は ja/kana 51 に対し en は 46（README は一律 51）。
- **D. KanjiVG が `master` 参照**: `scripts/fetch-strokes.ts` は KanjiVG の `master` から取る。上流が画を直すと再生成で全文字の座標が黙って変わり、判定・採点・認識のすべてがその座標系に乗っている。`fetch-images.ts` は Twemoji を `@15.1.0` で固定しており、同じことをすればよい。
- **E. `@types/eslint` は未使用**: ESLint 10 は自前の型を持ち、リポジトリのどこからも参照されていない。v9 の型定義を v10 に対して持ち続けている。
- **F. deploy の `pages: write` / `id-token: write` がワークフロー全体**: `build` ジョブ（依存インストールとビルド）にも OIDC トークン発行権限と Pages 書き込み権限が渡る。必要なのは `deploy` ジョブだけ。`svelte-vitals.yml` はすでに `persist-credentials: false` を付けているが、`ci.yml` と `deploy.yml` の checkout は付けていない。

## Current state

**A.** `.prettierignore:6-9`:

```
# 生成物
src/lib/strokes.ts
src/lib/strokes-en.ts
static/img/
```

`scripts/fetch-strokes.ts:5-8,23-26` は `src/lib/strokes.ts` と `src/lib/strokes-kana.ts` を同じ書式で出す。
`head -3 src/lib/strokes.ts` はタブ + `"あ": [`、`head -3 src/lib/strokes-kana.ts` は 2 スペース + `ア: [`。

**B.** `CLAUDE.md:30` に `BASE_PATH=/ pnpm build` という文字列がある。`vite.config.ts:31`:
`paths: { base: (process.env.BASE_PATH ?? '/kakikaki') as \`/${string}\` }`。

**C.** `CLAUDE.md:45` に「`passes` は「1 位が目標」または「2 位以内かつ差が MARGIN 未満」」。
実装 `src/lib/recognize.ts:50-54`:

```ts
export function passes(target: string, results: { char: string; dist: number }[]) {
  const i = results.findIndex((r) => r.char === target);
  if (i === 0) return results[0].dist < RECOG.D_MAX * 2;
  return i === 1 && results[1].dist - results[0].dist < RECOG.MARGIN;
}
```

`CLAUDE.md:48` に「en が 7 文字ずつ」。実装 `src/lib/badges.ts:25-28`:

```ts
const ROWS_EN: Row[] = ALPHABET.flatMap((row) => [row.slice(0, 7), row.slice(7)]).map((chars) => ({
  name: chars.join(''),
  chars
}));
```

（`ALPHABET` は 13 文字 × 4 行 → 7+6 が 4 組 = 8 グループ。固定メダル 38 + 行メダル: ja/kana 13 → 51、en 8 → 46。）
`README.md:28` に「51 個のメダル」。

**D.** `scripts/fetch-strokes.ts:12`:

```ts
const res = await fetch(`https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${cp}.svg`);
```

`scripts/fetch-strokes.ts:25` の生成ヘッダ:
`// KanjiVG (https://kanjivg.tagaini.net) の書き順データ。CC BY-SA 3.0。scripts/fetch-strokes.ts で生成。`

**E.** `package.json:37` `"@types/eslint": "catalog:"`、`pnpm-workspace.yaml:15` `'@types/eslint': ^9.6.1`。
`grep -rn "types/eslint" --exclude-dir=node_modules --exclude-dir=.svelte-kit .`（`pnpm-lock.yaml` を除く）はこの 2 行だけ。

**F.** `.github/workflows/deploy.yml:11-14`:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

`deploy.yml:25` と `ci.yml:27,37,47,57` の `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1` に `with:` が無い。
`svelte-vitals.yml:26-28` は `with: fetch-depth: 0` と `persist-credentials: false` を持つ。

規約: ドキュメントは最新仕様のスナップショットだけを書く（経緯・issue 参照は書かない）。README に開発系の
記述は載せない。「版」は「バージョン」と書く。コミットメッセージは日本語の conventional commits。

## Commands you will need

| Purpose                          | Command                                             | Expected on success                                               |
| -------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| Lint                             | `pnpm lint`                                         | exit 0                                                            |
| Typecheck                        | `pnpm check`                                        | `0 ERRORS 0 WARNINGS`                                             |
| Tests                            | `pnpm test:run`                                     | all pass                                                          |
| Build                            | `pnpm build`                                        | exit 0                                                            |
| Build（base 変更の確認）         | `BASE_PATH= pnpm build`                             | exit 0、`build/index.html` 内のリンクが `/kakikaki/` を含まない   |
| 再生成（D のみ、ネットワーク要） | `pnpm strokes`                                      | `src/lib/strokes.ts 81 chars`、`src/lib/strokes-kana.ts 81 chars` |
| ワークフロー構文                 | `gh workflow view "Deploy to GitHub Pages"`（任意） | エラーなし                                                        |

## Scope

**In scope**:

- `.prettierignore`、`CLAUDE.md`、`README.md`
- `scripts/fetch-strokes.ts`（URL とヘッダのみ）、`src/lib/strokes.ts` / `src/lib/strokes-kana.ts`（D の再生成で変わる分のみ）
- `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`（E の削除に伴う更新のみ）
- `.github/workflows/deploy.yml`、`.github/workflows/ci.yml`

**Out of scope**:

- `eslint.config.js` の `ignores`、`scripts/**` の型検査、`.node-version` / `.vscode/settings.json`、LICENSE の追加 — 索引の「未計画」に載せてある別件。
- `renovate.json`、`@types/node` のメジャー、vitest 5 への更新。
- `src/lib/strokes-en.ts`（DSL から生成。KanjiVG 由来ではない）。
- `vite.config.ts` のキャストの緩和（`'' | \`/${string}\``）は任意。やるなら 1 行だけ。

## Git workflow

- Branch: `advisor/006-tooling-docs-batch`
- ステップごとにコミットしてよい。例: `chore: strokes-kana.ts も生成物として prettier の対象外に` / `docs: BASE_PATH の指定と passes・行グループ・メダル数の説明を実装に合わせる` / `chore: KanjiVG の取得元をコミットで固定` / `chore: 未使用の @types/eslint を削除` / `ci: Pages の書き込み権限を deploy ジョブだけに絞り、checkout の認証情報を残さない`。末尾に `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`。

## Steps

### Step A: `.prettierignore` を生成物の glob にする

`.prettierignore:7-8` の 2 行を `src/lib/strokes.ts` と `src/lib/strokes-*.ts` の 2 行に置き換える（`static/img/` はそのまま）。
`src/lib/strokes*.ts` にはしない。`src/lib/strokes.test.ts` まで除外してしまう。
`strokes-kana.ts` の現在の整形済みの姿はそのまま置いておく（Step D の再生成で生成器の書式に戻る。D を
飛ばす場合も、除外されたので `pnpm lint` は通る）。

**Verify**: `pnpm lint` → exit 0。`pnpm exec prettier --check src/lib/strokes-kana.ts` → `[warn]` が出ず、対象外として無視される（あるいは "No files matching" 相当のメッセージ）。

### Step B: `BASE_PATH` の手順を直す

`CLAUDE.md:30` の `BASE_PATH=/ pnpm build` を `BASE_PATH= pnpm build`（空文字でルート直下）に変え、
同じ文に「`/` で終わる値は SvelteKit が拒む」と一言添える。任意で `vite.config.ts:31` のキャストを
`as '' | \`/${string}\`` に緩める。

**Verify**: `BASE_PATH= pnpm build` → exit 0 かつ `grep -c "/kakikaki/" build/index.html` が 0。その後
`pnpm build`（既定 base）→ exit 0 で元に戻す。

### Step C: CLAUDE.md と README の説明を実装に合わせる

- `CLAUDE.md:45` の「`passes` は「1 位が目標」または「2 位以内かつ差が MARGIN 未満」」を
  「`passes` は「1 位が目標で距離が `D_MAX` × 2 未満」または「2 位以内かつ 1 位との差が `MARGIN` 未満」」に。
- `CLAUDE.md:48` の「en が 7 文字ずつ」を「en は 13 文字の行を 7+6 に割った 8 グループ」に。
- `README.md:28` の「51 個のメダル」を「51 個（えいご は 46 個）のメダル」に。

**Verify**: `grep -n "D_MAX" CLAUDE.md` が 1 件以上、`grep -n "7 文字ずつ" CLAUDE.md` が 0 件、
`grep -n "46 個" README.md` が 1 件。`pnpm lint` exit 0（prettier は md も見る）。

### Step D: KanjiVG の取得元をコミットで固定し、再生成して差分が無いことを確かめる

1. `git ls-remote https://github.com/KanjiVG/kanjivg.git refs/heads/master` で現在の `master` の SHA を取る。
2. `scripts/fetch-strokes.ts` の先頭に `const KANJIVG = '<40 桁の SHA>'; // 取得元のコミット。上げるときは pnpm strokes を回して差分を確認する` を置き、URL を `https://raw.githubusercontent.com/KanjiVG/kanjivg/${KANJIVG}/kanji/${cp}.svg` に変える。
3. 生成ヘッダ（`:25`）に `（KanjiVG ${KANJIVG.slice(0, 7)}）` を含める。
4. `pnpm strokes` を実行する（Step A を先に済ませておく）。
5. `git diff --stat src/lib/strokes.ts src/lib/strokes-kana.ts` を見る。期待は「両ファイルともヘッダ 1 行の変更」＋「`strokes-kana.ts` の書式が生成器の姿（タブ・引用符つき）に戻る差分」だけ。`strokes.ts` のパスデータ（`"あ": [` 以降の行）に差分があれば **STOP**（上流のデータが変わっている。どの版を採用するかは保守者の判断）。

**Verify**: `pnpm test:run` → all pass（`strokes.test.ts` / `recognize.test.ts` / `words.test.ts` がデータを検証する）。`git diff src/lib/strokes.ts | grep '^[-+]' | grep -v '^[-+]//' | grep -v '^[-+][-+]'` が空。

### Step E: `@types/eslint` を消す

`package.json:37` と `pnpm-workspace.yaml:15` の行を消し、`pnpm install`（ロックファイルを更新するため
`--frozen-lockfile` なし）を実行する。

**Verify**: `pnpm lint` exit 0、`pnpm check` `0 ERRORS`。`grep -c "types/eslint" pnpm-lock.yaml` が 0。

### Step F: deploy の権限をジョブ単位にし、checkout の認証情報を残さない

`deploy.yml:11-14` のワークフロー全体の `permissions:` を `contents: read` だけにし、`deploy` ジョブに
`permissions: { pages: write, id-token: write }` を移す。`build` ジョブには `permissions: { contents: read }`（ジョブ側に `permissions:` を書くとワークフロー側は継承されず置き換わるので、`build` が checkout に必要な `contents: read` を明示する）。
`deploy.yml:25` と `ci.yml:27,37,47,57` の checkout に `with: persist-credentials: false` を足す
（`svelte-vitals.yml:26-28` と同じ形）。

```yaml
deploy:
  needs: build
  runs-on: ubuntu-latest
  timeout-minutes: 15
  permissions:
    pages: write
    id-token: write
```

**Verify**: YAML として読める（`node -e "require('node:fs'); console.log('ok')"` ではなく、`gh workflow view` か
`pnpm exec prettier --check .github/workflows/*.yml`）。`grep -n "persist-credentials: false" .github/workflows/ci.yml | wc -l` が 4、
`deploy.yml` が 1。`deploy.yml` の先頭 `permissions:` ブロックに `pages`/`id-token` が無い。
実際のデプロイ成功は `main` へのマージ後に Actions で 1 回確認する（保守者）。

## Test plan

- 新しいテストは書かない。D は既存の `strokes.test.ts`（81/81 文字、画数の例）・`recognize.test.ts`（全文字が自分を 1 位に）・`words.test.ts`（全単語の全文字に書き順）が再生成データの回帰テストになる。
- A〜C・E・F は `pnpm lint` / `pnpm check` / `pnpm build` が検証。

## Done criteria

- [ ] `cat .prettierignore` に `src/lib/strokes.ts` と `src/lib/strokes-*.ts` があり、`strokes-en.ts` の個別行が無い。`pnpm exec prettier --check src/lib/strokes.test.ts` は引き続き対象になる
- [ ] `grep -n "BASE_PATH=/ pnpm build" CLAUDE.md` が 0 件
- [ ] `grep -n "7 文字ずつ" CLAUDE.md` 0 件、`grep -n "D_MAX" CLAUDE.md` 1 件以上、`grep -n "46 個" README.md` 1 件
- [ ] `grep -n "kanjivg/master" scripts/fetch-strokes.ts` が 0 件（D を実行した場合）
- [ ] `grep -rn "types/eslint" package.json pnpm-workspace.yaml` が 0 件（E を実行した場合）
- [ ] `deploy.yml` の `deploy` ジョブだけが `pages: write` / `id-token: write` を持つ
- [ ] `pnpm lint` exit 0、`pnpm check` `0 ERRORS`、`pnpm test:run` all pass、`pnpm build` exit 0
- [ ] In scope 以外に変更なし
- [ ] `plans/README.md` 更新（飛ばしたステップがあれば理由を書く）

## STOP conditions

- D: ネットワークに出られない → D を飛ばして報告。`pnpm strokes` 後に `strokes.ts` のパスデータに差分 → 再生成を `git checkout -- src/lib/strokes.ts src/lib/strokes-kana.ts` で戻し、SHA の固定だけ残して報告（データ更新は保守者の判断）。
- E: `pnpm install` 後に `pnpm lint` が型解決で落ちる（`@types/eslint` を何かが暗黙に使っていた）→ 差分を戻して報告。
- F: `gh workflow view` が無い環境ならスキップせず、YAML の構文だけ prettier で確認して進める。
- B: `BASE_PATH= pnpm build` が別の理由で失敗する（`manifest.webmanifest` の `start_url` などは対象外。ビルド自体が失敗した場合のみ STOP）。

## Maintenance notes

- 生成物を増やしたら `.prettierignore` の `src/lib/strokes-*.ts` に載る名前（`strokes-<lang>.ts`）にする。テストファイル（`*.test.ts`）を巻き込む glob にはしない。
- KanjiVG の SHA を上げるときの手順は Step D と同じ。差分が出たら `strokes.test.ts` と `recognize.test.ts` に加えて iPad 実機で数文字なぞって確かめる（判定の手触りは実機で決める方針）。
- Renovate が `@types/eslint` を再提案することはない（依存から消えるため）。
- ワークフローの権限は「そのジョブが叩く API に必要な分だけ」を保つ。新しいジョブを足すときはワークフロー全体ではなくジョブに `permissions:` を書く。
