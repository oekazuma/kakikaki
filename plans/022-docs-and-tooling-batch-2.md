# Plan 022: 保護者向けガイドと CLAUDE.md を現状に合わせ、`verify` に build を足し、Markdown だけの変更でも CI を回す

> **Executor instructions**: 上から順に。各ステップの検証を確認してから次へ。STOP 条件に当たったら報告。
> 終わったら `plans/README.md` の行を更新。
>
> **Drift check（最初に実行）**:
> `git diff --stat dbe4daa..HEAD -- src/lib/components/about/Guide.svelte CLAUDE.md package.json .github/workflows/ci.yml renovate.json docs/superpowers/plans/2026-09-13-kakikaki-hiragana.md video/src/scenes/Home.tsx video/src/scenes/Trophies.tsx`
> 差分があれば「Current state」と見比べ、食い違えば STOP。計画 019 が先に入っていれば `src/app.html` などの差分は無関係。

## Status

- Priority = P2 · Effort = S · Risk = LOW · Depends on = 019（Step 3 の `verify` は build を含めるので、019 で SW の build 確認が通っていること） · Category = docs / dx
- Planned at = commit `dbe4daa`, 2026-09-15

## Why this matters

- アプリ内の保護者向け説明（`Guide.svelte`）は「なぞる → じぶんで かく → おてほんなし の順に自動で進む」と書いているが、`f8f5ae0` で おてほんなし は自動進行から外れ、完了モーダルの「おてほんなしに ちょうせん」から入る。README と CLAUDE.md は直したがこのファイルだけ取りこぼした。保護者は「おてほんなしが出ない = 不具合」と受け取る。同じガイドが、保護者向けに作った「みんなの進み具合」「にがてな もじ」、連続日数とカレンダー、かきクイズの「きいて かく」を一切説明していない。
- `CLAUDE.md` はエージェントの仕様書だが、フォント再生成コマンドが Regular 1 本だけ（SemiBold が取り残される）、`storage.ts` / `today.ts` / `backup.ts` / `sw-rules.ts` / `crop.ts` が一覧に無い（`localStorage` 直アクセスや `today()` の再実装を招く）、`kk:lang` がキー一覧に無い、「6 秒でお手本を自動再生」が実機調整値の節に無い、z-index の階層表が無い、`pnpm verify` を「CI と同じ」と書いているが build を含まない。
- CI は `paths-ignore: '**/*.md'` なので Markdown だけの変更で 1 ジョブも走らないが、`pnpm lint` は prettier で Markdown も検査する。整形の崩れが次の無関係な PR で発覚する。
- Renovate の `lockFileMaintenance` は自動マージ対象の `matchUpdateTypes` に入っておらず、PR が手動待ちで溜まる。
- `docs/superpowers/plans/…` にエージェント宛の命令文（「For agentic workers: REQUIRED SUB-SKILL …」）が残っている。打ち消しの注記はあるが、命令の形をした文はリポジトリに置かない。
- 紹介動画のソースにメダル総数 `12 / 54`（実数は ひらがな 60、えいご 55）が残っている。`dbe4daa` が「増減しやすい数は消す」と決めた方針の取りこぼし。

## Current state

`src/lib/components/about/Guide.svelte:10-12`:

```svelte
<li>
  単語カードか「もじから えらぶ」で文字を選びます。文字ごとに <b>なぞる（2 回）→ じぶんで かく → おてほんなし</b> の順に自動で進みます。
</li>
```

`:29-47` が「星・メダル・クイズ」節（`:36` トロフィー画面の説明、`:37-40` クイズの説明）。`:81-101` が「データについて」節。116 行（`architecture/component-size` の上限 200 に余裕あり）。
正しい流れは `README.md:26`: 「1 文字ごとに なぞる（2 回）→ じぶんで かく と自動で進む。単語の全文字を終えると完了画面から おてほんなし に挑戦できる」。

`CLAUDE.md` の該当行（行番号は `cat -n CLAUDE.md`）。

- `:16` `pnpm verify                   # lint / check / test:run / vitals をまとめて実行（CI と同じ判定）`
- `:31` 「CI（`.github/workflows/ci.yml`）は lint / check / test / build を並列に回す。」実際は `ci.yml:60-61` で build は `if: github.event_name == 'pull_request'`、lint ジョブは `pnpm vitals --reporter console` も回す。
- `:41` 末尾の再生成コマンド: `pyftsubset KleeOne-Regular.ttf --unicodes="U+0020-007E,…,U+00D7" --flavor=woff2 --layout-features='*'`（1 本だけ）。`static/fonts/` には Regular と SemiBold の 2 本があり `static/app.css:45-56` が両方を宣言、`video/src/theme.ts:5-6` も両方を読む。
- `:45-62` アーキテクチャの箇条書き。`storage.ts` / `today.ts` / `backup.ts` / `sw-rules.ts` / `crop.ts` への言及は無い。`kk:lang`（`src/lib/lang.svelte.ts:10`）も無い。
- `:70` 「`JUDGE`（特に先読み `K`）、`RECOG`、`Canvas.svelte` の おてほんなし自動判定（4 秒）を定数にまとめてある」。`Canvas.svelte:67` の `setTimeout(playDemo, 6000)`（なぞる／じぶんでかく で 6 秒無操作ならお手本再生）は無い。
- `:61` は Bouncer の 59 と BackButton の 61 だけ。実際の z-index（`grep -rn z-index src static/app.css`）: 5 `Egg`、50 `+layout` の fx canvas、59 `Bouncer` の覆い、60 `Bouncer` の絵と回数・`DriveBy`・よみクイズの ○、61 `BackButton`、70 `.dim`（`app.css`）・`BadgeToast`、71 `ProfileEditor` / `DangerModal` / `DeleteConfirm` / `ProgressDetail` / `QuizHeader` の確認、80 `CompleteModal` / `QuizResult` / `Shredder`、100 `+layout` の画面サイズ案内、110 `Splash`。（1〜3 は風船ページ内の局所。）

`package.json:19`: `"verify": "pnpm lint && pnpm check && pnpm test:run && pnpm vitals"`。`video/package.json:9` に `"check": "tsc"` があるがどこからも呼ばれない。

`.github/workflows/ci.yml:4-11`:

```yaml
on:
  push:
    branches:
      - main
    paths-ignore:
      - '**/*.md'
  pull_request:
    paths-ignore:
      - '**/*.md'
```

`deploy.yml:4-8` と `svelte-vitals.yml:5-7` にも同じ `paths-ignore` がある（こちらは残す。Markdown でデプロイや差分レポートは要らない）。

`renovate.json:8-10`: `"lockFileMaintenance": { "enabled": true }`。`:18-23` の自動マージは `"matchUpdateTypes": ["minor", "patch", "pin", "digest"]`。

`docs/superpowers/plans/2026-09-13-kakikaki-hiragana.md:3-5`:

```
> 2026-09-13 時点の初期計画。すべて実装済みで、現行仕様は `CLAUDE.md` が正。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
```

`video/src/scenes/Home.tsx:60` と `video/src/scenes/Trophies.tsx:21` に `12 / 54`。`Home.tsx:159` 付近で単語数・カテゴリ数は既に数を出さない見せ方に変えてある。

方針: コメント・ドキュメントは非自明な WHY だけ、変更履歴や経緯は書かない（`~/.claude/CLAUDE.md`）。CLAUDE.md は最新仕様のスナップショット。

## Commands you will need

| Purpose  | Command                  | Expected                                      |
| -------- | ------------------------ | --------------------------------------------- |
| 整形     | `pnpm lint`              | prettier / eslint とも OK                     |
| 一括     | `pnpm verify`            | exit 0（Step 3 以降は build も含む）          |
| video 型 | `pnpm --dir video check` | exit 0（`cd video && pnpm install` 済みなら） |
| vitals   | `pnpm vitals --diff`     | warning 0                                     |

## Scope

**In scope**:

- `src/lib/components/about/Guide.svelte`
- `CLAUDE.md`
- `package.json`（`verify` と `check:video` のみ）
- `.github/workflows/ci.yml`（`paths-ignore` のみ）
- `renovate.json`（`lockFileMaintenance` のみ）
- `docs/superpowers/plans/2026-09-13-kakikaki-hiragana.md`（`:5` の段落削除のみ）
- `video/src/scenes/Home.tsx`、`video/src/scenes/Trophies.tsx`（`12 / 54` の 2 か所のみ）

**Out of scope**:

- `README.md`（現状正しい）。
- `docs/intro.gif` の再描画（Mac のフォントと ffmpeg が要る。オーナーの作業。ソースだけ直す）。
- `plans/README.md` の過去の記述（今回の索引更新で対応済み）。
- `deploy.yml` / `svelte-vitals.yml` の `paths-ignore`。
- `static/fonts/*` の再生成（コマンドの記述を直すだけ）。

## Git workflow

- コミット例: `docs: 保護者向けガイドを現状の流れ（おてほんなし は完了モーダルから）に合わせ、進み具合・にがてな もじ・カレンダー・きいて かく を足す`、`chore: pnpm verify に build を足し、Markdown だけの変更でも CI を回す`。push / PR は指示が無い限りしない。

## Steps

### Step 1: `Guide.svelte` を現状に合わせる

- `:11` を README の流れに: 「単語カードか「もじから えらぶ」で文字を選びます。文字ごとに <b>なぞる（2 回）→ じぶんで かく</b> と自動で進み、単語の全文字を終えると完了画面の<b>「おてほんなしに ちょうせん」</b>から おてほんなし に挑戦できます（上のモード切替から選ぶこともできます）。」
- 「星・メダル・クイズ」節（`:31-46`）に 2 項目追加。
  - 「トロフィー画面には今月のカレンダーと「つづけて n にち」が出ます。連続日数は ひらがな・かたかな・えいご をまたいで数え、今日まだ練習していなくても前日まで続いていれば切れません。」
  - `:37-40` のクイズの説明に「かき は 絵を見て書く・聞いて書く を交互に出します」を足す。
- 「データについて」節の直前（`:80` の後）に節を 1 つ。
  ```svelte
  <section class="card">
    <h2>みんなの進み具合</h2>
    <p>
      このページ上部の一覧で、人ごとに
      ことば別のクリア文字数が見られます。押すと文字・単語・行ごとの進み具合、クイズの正解数、
      「苦手な文字」（おてほんなしで 2 回以上間違えた文字と、じぶんでかくが星 1
      のままの文字）が開きます。苦手な文字は子どもの画面には出しません。
    </p>
  </section>
  ```
  （文言は `LangDetail.svelte:78` の説明と一致させる。）

**Verify**: `pnpm lint` OK、`pnpm vitals --diff` warning 0（行数 200 未満）。`grep -c "おてほんなしに ちょうせん" src/lib/components/about/Guide.svelte` が 1。

### Step 2: `CLAUDE.md` を直す

- `:41` の再生成コマンドを「Regular と SemiBold の 2 本を同じ `--unicodes` で作る」形に（例: `for w in Regular SemiBold; do pyftsubset KleeOne-$w.ttf --unicodes="…" --flavor=woff2 --layout-features='*'; done`。`video/src/theme.ts` も両方を読むので 2 本とも必要、と 1 文）。
- `:45` の箇条書きの前（`geometry.ts` の上）に 1 項目: 「`storage.ts` / `today.ts`: `localStorage` の読み書きは必ず `loadJSON`（形を確かめて既定値に落とす）/ `saveJSON`（容量超過は `false`）経由。`kk:` 接頭辞の全キー列挙が仕事の `backup.ts` だけが例外。ローカル日付 `YYYY-MM-DD` は `today()` だけが作る（記録日・獲得日・ゲート・風船のベストが同じ「今日」を使うため）。`kk:lang` は現在のことば。」
- `:56` の `gate.svelte.ts / pwa.ts` の項に `backup.ts`（`kk:*` を 1 つの JSON に書き出し、読み込みは掛け算ゲート → 件数確認 → 全部置き換え。途中で失敗したら元に戻す ※計画 018 後の挙動）と `sw-rules.ts`（Service Worker の判断を純粋関数にして vitest で検証。`service-worker.ts` は `$service-worker` に依存するので直接読めない）を 1 文ずつ足す。
- `:49` の `AvatarCrop` の説明に「座標計算は `crop.ts`（純粋関数、`crop.test.ts`）」を足す。
- `:70` に「なぞる／じぶんでかく で 6 秒無操作ならお手本を自動再生（`Canvas.svelte`）」を足す。
- `:61` の Bouncer の項の後、または `:62` の後に z-index の表を 1 段落（「Current state」の一覧を、値と役割で。「新しい覆い・モーダルはこの表に入れる」の 1 文付き）。
- `:16` を「lint / check / test:run / vitals / build をまとめて実行（PR の CI と同じ判定）」に、`:31` を「CI は PR で lint（+ svelte-vitals 全体）/ check / test / build を並列に、`main` への push では build を除く 3 つ（ビルドは `deploy.yml`）」に直す。

**Verify**: `pnpm lint` OK。`grep -c "storage.ts\|today.ts\|sw-rules.ts\|crop.ts\|kk:lang" CLAUDE.md` が 5 以上。`grep -c "SemiBold" CLAUDE.md` が 1 以上。`grep -c "6 秒" CLAUDE.md` が 1 以上。

### Step 3: `verify` に build を足し、video の型検査を script にする

`package.json`:

```json
    "check:video": "pnpm --dir video check",
    "verify": "pnpm lint && pnpm check && pnpm test:run && pnpm vitals && pnpm build"
```

（`check:video` は `verify` に入れない。`video/node_modules` が無い環境で落ちるため。CLAUDE.md の `:27` の `video/` の段落に「`video/` を触ったら `pnpm check:video`」を 1 文足す。）

**Verify**: `pnpm verify` → exit 0（build を含む）。`pnpm check:video` → `cd video && pnpm install` 済みなら exit 0、未インストールなら「未実行」と報告（STOP ではない）。

### Step 4: CI を Markdown でも回す

`ci.yml` の `push` と `pull_request` から `paths-ignore` ブロック（各 2 行）を削除。`deploy.yml` / `svelte-vitals.yml` は触らない。

**Verify**: `grep -c "paths-ignore" .github/workflows/ci.yml` が 0。`pnpm lint`（prettier は yml も見る）OK。

### Step 5: Renovate の lock 更新を自動マージに

`renovate.json`: `"lockFileMaintenance": { "enabled": true, "automerge": true }`。

**Verify**: `pnpm lint` OK（json の整形）。

### Step 6: エージェント宛の命令文を消す

`docs/superpowers/plans/2026-09-13-kakikaki-hiragana.md:5` の `> **For agentic workers:** …` の段落（引用ブロック 1 つ）を削除。`:3` の注記は残す。

**Verify**: `grep -c "For agentic workers" docs/superpowers/plans/2026-09-13-kakikaki-hiragana.md` が 0。

### Step 7: 動画ソースからメダル総数を消す

`Home.tsx:60` と `Trophies.tsx:21` の `12 / 54` を、数を見せない形（例: `12 こ`、または割合の輪だけ）にする。`Home.tsx:159` 付近で単語数を消したときの見せ方に合わせる。GIF は再描画しない（オーナー作業。完了報告に「`cd video && pnpm render` で反映」と書く）。

**Verify**: `grep -rn "/ 54" video/src` が 0 件。`pnpm lint` OK（prettier は `video/**/*.tsx` も見る）。`pnpm check:video` が実行できる環境なら exit 0。

## Test plan

- 自動テストの追加は無し（ドキュメントと設定）。検証は `pnpm verify`（build 込み）と grep。

## Done criteria

- [ ] `pnpm verify` が exit 0（`package.json` の `verify` に `pnpm build` を含む）
- [ ] `grep -c "自動で進みます" src/lib/components/about/Guide.svelte` が 0
- [ ] `grep -c "みんなの進み具合" src/lib/components/about/Guide.svelte` が 1 以上
- [ ] `grep -c "paths-ignore" .github/workflows/ci.yml` が 0
- [ ] `grep -c '"automerge": true' renovate.json` が 2
- [ ] `grep -c "For agentic workers" docs/superpowers/plans/2026-09-13-kakikaki-hiragana.md` が 0
- [ ] `grep -rn "/ 54" video/src` が 0 件
- [ ] `git status` で in scope 以外の変更が無い
- [ ] `plans/README.md` の 022 の行を更新

## STOP conditions

- `Guide.svelte:11` や `CLAUDE.md` の該当行が「Current state」と一致しない（誰かが先に直した）。
- `pnpm build` が worktree で `Tsconfig not found` で落ちる: `/Users/oekazuma/.claude/projects/-Users-oekazuma-localRepo-kakikaki/memory/kakikaki-worktree-build.md` の回避策を試し、駄目なら報告（`verify` に build を足すこと自体は保留にしない。回避策の記述を CLAUDE.md の「UI 確認」の近くに 1 文足してよい）。
- `Guide.svelte` が 200 行に近づく（`pnpm vitals --diff` が warning を出す）。

## Maintenance notes

- 保護者向けの機能を足したら `Guide.svelte` も同じコミットで更新する（README・CLAUDE.md と三重管理。今回の取りこぼしがその証拠）。
- z-index の表は「新しい層を足したら表も」と CLAUDE.md に書いたので、レビューで確認する。
- `verify` が build を含むようになったので手元の一括検証は数十秒延びる。速さが要るときは個別コマンド。
- 先送り: `CLAUDE.md:74` の「UI 確認」（ブラウザペインでも 1180×820 のスクリーンショットは撮れるかもしれない。確認してから書き換える）、かくしメダルとアバターの追加手順の追記（DOCS 監査の要望。書くなら `secret.ts` → `badges.ts` → `checkBadges()` を呼ぶ画面、の 3 点と、`person-*` は `pnpm images` で取れないこと）。
