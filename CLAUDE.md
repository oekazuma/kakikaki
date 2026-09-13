# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

iPad 横画面用の子ども向けひらがな書き練習 PWA。SvelteKit（Svelte 5 runes、TypeScript）+ adapter-static で、`main` への push で GitHub Pages（`/kakikaki/`）へ自動デプロイされる。UI 文言は子ども向けのひらがな中心、保護者向け画面（`/about`）だけ漢字可。追加ランタイム依存はゼロで、パーティクル・効果音・手書き認識はすべて自前実装。

## コマンド

```bash
pnpm dev                      # http://localhost:5173/kakikaki/
pnpm test:run                 # vitest 一括実行（unit プロジェクト、happy-dom）。pnpm test で watch
pnpm exec vitest run src/lib/judge.test.ts   # 単一ファイル
pnpm lint                     # prettier --check と eslint（CI と同じ）
pnpm format                   # prettier --write
pnpm check                    # svelte-check
pnpm build && pnpm preview    # 静的ビルドと確認（Service Worker は build でのみ有効）
pnpm strokes                  # KanjiVG から src/lib/strokes.ts を再生成
pnpm strokes:en               # アルファベット 52 文字の書き順を線分・円弧の DSL から生成（src/lib/strokes-en.ts）
pnpm images                   # words.ts の emoji から Twemoji SVG を static/img/ に取得（既存は上書きしない）
pnpm icon                     # アイコン/ロゴマーク SVG を生成（引数で文字と色を変えれば姉妹アプリ用になる。PNG 化手順は出力に表示）
```

依存は `pnpm-workspace.yaml` の catalog で一元管理し（`minimumReleaseAge` あり）、Renovate が minor/patch を自動マージする。CI（`.github/workflows/ci.yml`）は lint / check / test / build を並列に回す。内部リンクは `resolve()`（クエリ付きは `src/lib/nav.ts` の `practiceUrl`）で書く。eslint の `no-navigation-without-resolve` に従うため。

`main` に push すると GitHub Actions が GitHub Pages にデプロイする（`BASE_PATH=/<リポジトリ名>` を渡す）。公開先を変えるときは `BASE_PATH=/ pnpm build` のように base を変え、`static/manifest.webmanifest` の `start_url` と `scope` を合わせる。

SvelteKit の設定は `svelte.config.js` ではなく `vite.config.ts` の `sveltekit({...})` にある。`base` は `BASE_PATH` 環境変数で上書き可。`+layout.ts` で `ssr = false` + `prerender = true` のため、各ルートは HTML シェルとしてプリレンダーされる。

`scripts/*.ts` は Node 24 の型ストリップで直接実行するため、`src/lib/words.ts` と `chars.ts` は `$app/*` を import してはいけない（`base` が必要な `imageUrl` は `src/lib/image.ts` に分離してある）。

## アーキテクチャ

ひらがな（`ja`）と英語（`en`）の 2 言語を `lang.svelte.ts` の `lang.v` で切り替える。文字セット・書き順・読み上げ言語・表示名は `LANG_INFO` / `strokesOf` / `nameOf` / `lettersOf` 経由で取り、各画面や `Canvas` は言語を直接知らない。テーマ色は `<html data-lang>` に応じて `app.css` の CSS 変数が変わる。

座標系はすべて KanjiVG の 109×109 viewBox（アルファベットも同じ枠に合わせて自作）。`Canvas.svelte` が `getScreenCTM()` でポインタ座標を viewBox 単位に変換し、判定・採点・認識はその単位で行う純粋関数に委ねる。

- `geometry.ts`: SVG path（M/L/H/V/C/S/Z）を等間隔の点列にする。`getPointAtLength` は使わず自前で平坦化するので、テストと実行時で同じ点列になる。
- `judge.ts`: なぞる（`advance` が cursor をサンプル列上で進め、-1 で逸脱）/ じぶんでかく（`coverage` が塗れた割合）。しきい値は `JUDGE`。
- `score.ts`: 軌跡とお手本の距離と向きから 0〜1 → 星 1〜3。
- `recognize.ts`: 全 81 文字のお手本を N 点に再サンプリング・重心合わせした `TEMPLATES` と、書いた画列を画ごとに対応させて距離を取る。`passes` は「1 位が目標」または「2 位以内かつ差が MARGIN 未満」。しきい値は `RECOG`。
- `progress.svelte.ts`: `localStorage` 直結の `$state`。キーは言語ごとに `kk:<lang>:progress`（文字ごとの回数）、`kk:<lang>:earned`（メダル id → 獲得日）、`kk:<lang>:days`（練習した日付）。旧キー `kk:progress` 等は起動時に `ja` へ移行する。関数は現在の言語の記録を対象にし、`wordStar` / `wordCrown` は `Word` を受け取る。文字クリア = trace 2 + free 1、金星 = test 1、単語の星/王冠は全文字の集計。`checkBadges()` が新規獲得メダルを確定して返し、練習画面がトーストを出す。
- `badges.ts`: `badgesOf(lang)` と `computeStats(lang, …)`。行グループは ja が五十音の行、en が 7 文字ずつ。ストアに依存せず集計値 `Stats` だけを受け取る純粋関数で、`need(s)` は `[達成数, 必要数]` を返す（未獲得時の「あと n」表示に使う）。
- `Canvas.svelte`: 3 モード（`trace` / `free` / `test`）の入力処理と描画。文字やモードの切替は親が `{#key}` で再マウントする前提で、内部で props 変化を監視していない。`onDone` に `Result` を返し、進捗の記録や演出は `routes/practice/+page.svelte` 側で行う。
- `quiz.ts`: クイズの出題（純粋関数）。`levelOf` が文字数で かんたん/ふつう/むずかしい（Level 1〜3）を決め（ja: 〜2 / 3 / 4〜、en: 〜4 / 5〜6 / 7〜）、`makeReadQuiz` は word→picture と picture→word を交互に、選択肢は同カテゴリ（Level 3 は同文字数）優先で 3 つ。正解数は `progress.svelte.ts` の `recordQuiz` で `kk:<lang>:quiz` の `read1` などに積む（初回正答のみ、かきクイズはお手本を使わなかった単語のみ）。`routes/quiz/write` は `Canvas` を test モードで使い、2 回不正解で trace モードに切り替える。
- `fx.ts` / `audio.ts`: 全画面 canvas のパーティクル、WebAudio の効果音、Web Speech の読み上げ。iOS の制約で `unlock()` はユーザー操作のハンドラ内で呼ぶ。

## 単語を増やす

`src/lib/words.ts` のカテゴリ配列に `['id', 'ひらがな', '絵文字', 'english']` を追加し（カードの補助行のカタカナはひらがなから自動変換）、`node scripts/fetch-images.ts` で Twemoji の SVG を `static/img/<id>.svg` に取得する。自前のイラストを使うときは同じパスに置く（画像が無い単語は頭文字のカードで表示される）。全文字が `strokes.ts` に存在する必要があり、`words.test.ts` がそれを検証する。

## 実機で調整する前提の値

判定の手触りは iPad 実機で決めるものとして、`JUDGE`（特に先読み `K`）、`RECOG`、`Canvas.svelte` の おてほんなし自動判定（4 秒）を定数にまとめてある。

## UI 確認

ブラウザペインは幅が狭く横画面レイアウトを確認できないため、1180×820 のスクリーンショットや Pointer 操作のテストは Playwright を一時ディレクトリに入れて行う（dev サーバーは初回コンパイルが遅いので、練習画面は `style[data-vite-dev-id*="practice"]` の出現を待ってから撮る）。
