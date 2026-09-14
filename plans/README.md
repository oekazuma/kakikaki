# Implementation Plans

`/improve deep` が 2026-09-14 に commit `b611db7` で生成した。ユーザー不在の自律モードで実行したため、
レバレッジ上位の 6 件を計画にした（既定の挙動。他の指摘は下の「未計画の指摘」にあり、依頼があれば計画化する）。
実行者は計画を全部読んでから始め、STOP 条件を守り、終わったら自分の行を更新する。

## Execution order & status

| Plan | Title                                                                                | Priority | Effort | Depends on                         | Status |
| ---- | ------------------------------------------------------------------------------------ | -------- | ------ | ---------------------------------- | ------ |
| 001  | 削除・リセットは「削除する」で即時実行され、演出中に閉じても取り消されない           | P1       | M      | —                                  | DONE   |
| 002  | 書き取り面は 1 本の指（pointerId）だけを追う                                         | P1       | S      | —                                  | DONE   |
| 003  | localStorage の読み書きを `storage.ts` に集約し、壊れた保存値でも起動する            | P1       | M      | —                                  | DONE   |
| 004  | 人を消すと `kk:balloon` も消え、記録キー名は `profiles` に一本化                     | P1       | S      | 003                                | DONE   |
| 005  | Canvas のタイマーは再マウントで止まり、URL の `w=` / `level=` 不正で白画面にならない | P2       | S      | （002 と同じファイル。002 の後に） | DONE   |
| 006  | 生成ファイルの整形除外・ドキュメント誤り・KanjiVG 固定・`@types/eslint`・CI 権限     | P2       | S      | —                                  | DONE   |

| 007 | 風船の終了処理・更新ボタン・読み上げ・viewport・写真 URL の小さな不具合 | P2 | S | — | DONE |
| 008 | テンプレート二重生成・実績画面の再計算・全要素 transition・風船の再配列・CTM | P2 | S | — | DONE |
| 009 | days・むずかしい・Service Worker・readingOf のテストと `pnpm verify` | P2 | S | — | DONE |
| 010 | 重複判定式・`char-`・メダルの段・`today()`・意味色・切り抜き座標の整理 | P3 | M | 008 | DONE |
| 011 | scripts の型検査・`$app/*` 禁止の機械化・Node 版・エディタ設定・古い設計文書・CI | P3 | S-M | — | DONE |
| 012 | 「みる」ボタン、そ・ぽ の単語、記録のバックアップ（書き出し・読み込み） | P3 | M | 003 | DONE |
| 013 | えいご の単語は先頭を大文字で見せ、大文字 26 字を単語とクイズから届くように | P1 | S | — | DONE |
| 014 | 「アプリについて」に全員 × 3 ことば の進み具合の表 | P1 | S | — | DONE |
| 015 | 文字ごとの星と不合格回数を残し、「にがてな もじ」を保護者の表に | P2 | M | 014 | DONE |
| 016 | 連続日数（ことばをまたぐ）とカレンダー、連続日数のメダル | P2 | S-M | — | DONE |
| 017 | かきクイズに「きいて かく」形式 | P3 | S-M | — | DONE |
Status values: TODO | IN PROGRESS | DONE | BLOCKED (理由 1 行) | REJECTED (理由 1 行)

## Dependency notes

- 004 は 003 の `src/lib/storage.ts`（`loadJSON` / `saveJSON` / `removeKey`）を前提に書いてある。003 なしで実行するなら抜粋を現状の `store()?.setItem` 形に読み替える。
- 005 は 002 と同じ `Canvas.svelte` を触る。並行させず 002 → 005 の順に。
- 001・003・006 は互いに独立。001 だけはブラウザ（`pnpm build && pnpm preview`）での確認が検証ゲート。
- すべての計画の共通ゲート: `pnpm lint` / `pnpm check` / `pnpm test:run` / `pnpm vitals`（Health 100）/ `pnpm build`。

## 監査で分かったこと（要約）

ベースラインは緑（vitest 69 件、svelte-check 0、lint 0、svelte-vitals 100/100、`pnpm audit` は dev のみの low 1 件）。
8 カテゴリを並列監査し、指摘はすべて該当コードを開いて確認した。以下は表に載せたが今回計画化しなかったもの。

## 007〜012 に計画化した指摘（2026-09-14 追記。以下は計画化前の一覧）

正確性:

- ふうせん ぽん の終了後、自己ベスト未更新だと `finish()` が毎フレーム呼ばれ `localStorage` を読み続ける（`src/routes/balloon/+page.svelte:31,37-38`）。S。
- 「最新版に更新」「確認する」は `updated.check()` / `updateApp()` の失敗で `updating` / `checking` が戻らずボタンが死ぬ（`AppStatus.svelte:14-24`、`pwa.ts:16-35`）。S。
- `say()` は全 utterance に `onerror → finish` を付けるため、二重タップで前の呼び出しの `cancel()` が新しい方の Promise を早く解決し、スピーカーの点灯が音声より先に消える（`audio.ts:49,64`）。S。
- `watchViewport` の cleanup が `matchMedia(...).addEventListener('change')` を外さない・`settle` の 3 つの `setTimeout` を止めない（`viewport.svelte.ts:14-34`）。実害は無い（layout は 1 回しかマウントしない）。S。
- `loadImage` の object URL が成功時に revoke されない（`avatar.ts:33-42`。revoke は `AvatarCrop` を閉じた後に）。S。

性能:

- `TEMPLATES` がモジュール読み込み時に即時計算され、`templatesFor(STROKES)` で ja のテンプレートがもう 1 回作られる（`recognize.ts:20-31`）。`TEMPLATES` の参照はテストと既定引数だけ。S、確実に無駄。
- 実績画面で `stats()` が 4〜5 回、`badgesOf()` が 9 回呼ばれる（`Hero.svelte:12-13`、`StatTiles.svelte:10`、`BadgeGrid.svelte:7,9`、`trophies/+page.svelte:14`）。S。
- `static/app.css:23-29` の `main, main *` transition が 210 カードの全要素に掛かる。S、実機の効果は未計測。
- pointermove ごとに `poly(t.trail)` で `points` 文字列を全点作り直し、`getScreenCTM().inverse()` を毎回呼ぶ（`Board.svelte:21-26,62`、`tracer.svelte.ts:54`）。**実機で計測してから**。なぞる モードで描画されない `trail` に push している分だけは安全に外せる。
- CI は `main` push で `ci.yml` の build と `deploy.yml` の build を 2 回回す。`pnpm vitals` の全体スキャンは `main` で走らない（PR の差分のみ）。S。

テスト:

- `days`（練習した日付）の追加・重複排除に assertion が無い（`progress.svelte.ts:72-74,85-87`）。`vi.setSystemTime` で S。
- `quiz.test.ts:55-60` は「同じ文字数が優先」を主張するがカテゴリしか assert しない。同じ文字数の同カテゴリが 2 つ以上ある語（例: はんばーがー）に差し替える。S。
- `service-worker.ts` の 2 つの判断（`version.json` を素通し、同一オリジンの `ok` だけキャッシュ）を純粋関数に出して単体テスト。S。
- `AvatarCrop.svelte:17-26,55-79` の切り抜き座標計算をクラス/純粋関数に出してテスト（199 行で上限ぎりぎり、修正コミット 2 回）。M。
- `package.json` に `verify`（lint && check && test:run）を足す。S。

技術的負債:

- `progress.svelte.ts` 内でクリア条件（`trace >= 2 && free >= 1`）が `charCleared` と `summaryOf` に二重に書かれ、`CAP` と独立（`:16,96-97,128-129`）。「今日を days に足す」も 2 回（`:71-75,84-88`）。S。
- `char-` 接頭辞を `words.ts` 以外の 4 か所が知っている（`practice.svelte.ts:51,56`、`CompleteModal.svelte:27`、`chars/+page.svelte:18`）。`isCharWord` / `charWordId` を `words.ts` に。S。
- `badges.ts:159-174` の `groupOf` が id 接頭辞を再解析し、未知の接頭辞は黙って「はじめて」に落ちる。`Badge` に `group` を持たせる。S。
- `gate.svelte.ts:1` が `today()` のために `progress.svelte.ts`（→ badges → words → strokes 全部）を import する。`today` を小さなモジュールへ。S。
- `practice/+page.svelte:48` の `lang.v === 'en' ? s.c : readingOf(s.c)` の en 分岐は無意味（`readingOf` はかな以外を素通し）。S。
- 意味色（`#e08a00` ×24、`#e53935` ×15、`#c62828` ×9、`#eef1f4` ×13）が CSS 変数化されていない。`Egg.svelte:17` は `COLORS` の一部を手で写している。S。

依存・DX・ドキュメント:

- `scripts/**` と `src/service-worker.ts` はどの型検査にも入っていない（`.svelte-kit/tsconfig.json` の include/exclude）。S〜M。
- `words.ts` / `chars.ts` の `$app/*` 禁止を `no-restricted-imports` で機械化する。S。
- `@types/node ^26` に対しランタイムは Node 24。`^24` に揃える。S。
- 公開リポジトリに LICENSE が無い: **対応済み（2026-09-14、計画外）**。コードは MIT、同梱データは元のライセンスを `LICENSE` に明記。
- `docs/superpowers/**` は初日の設計/計画で、カテゴリ・ゲート・ルートが現状と違い、命令形で書かれている。先頭に「2026-09-13 時点の初期計画。現行仕様は CLAUDE.md」の 1 行を足すか `docs/archive/` へ。計画内のスペックへのパス（`…-kakikaki-design.md`）は存在しないファイルを指す。S。
- `.node-version`、`.vscode/settings.json`（prettier を既定フォーマッタに）、`eslint.config.js` の `ignores: ['src/lib/strokes.ts', 'src/lib/strokes-*.ts']`（`strokes.test.ts` を巻き込まない）。S。
- `pnpm-workspace.yaml` の `allowBuilds: esbuild` は vite 8（rolldown）では死んだ設定。S。
- vitest 5 は peer が揃っており上げられる唯一のメジャー。TypeScript 7 は typescript-eslint / svelte-check / kit の peer が未対応で待ち。

## 方向性（機能）

上の 5 件（英語の大文字、保護者向けの表、文字ごとの質、連続日数とカレンダー、かきクイズの新形式）は 013〜017 に計画化した。
記録の書き出し・そ・ぽ の単語・「みる」ボタンは 012 で実装済み。

## 計画外で対応したもの（2026-09-14）

- おてほんなし の見本カードを左上に移し、字は「みる」を押したときだけ 2 秒見せる（右上は右手で隠れる。「おてほんなし」と表示の食い違いを解消）。
- カレンダーの印を固定サイズの丸・テーマ色に、「つづけて n にち」を星アイコンのピルに。
- 「みんなの進み具合」の説明文を削除。
- 過剰設計の監査（ponytail-audit）で挙がった 20 件を適用: `app.d.ts`・未使用アイコン・再エクスポート・使われていない `export` の削除、`Gate` の store 注入と `viewport` のタイマー集合の撤去、`backup` / `streak` / `allDays` の標準 API 化、`clamp` / `Pt` / `dist` / 言語の頭文字 / `.dim` 暗幕の一本化、`fx.ts` をクラスから関数に。`make-icon.ts` の手描き `A` は公開中のロゴが変わるので残した。

## Findings considered and rejected

- コンポーネント import の書き方が 3 種類（`./` `../` `$lib/`）: 見た目だけ。lint 規則を入れないなら一度直しても戻る。
- `.npmrc` の `engine-strict=true` が「`engines` が無いので無意味」という指摘: 誤り。依存パッケージ側の `engines`（例: svelte-vitals の node >= 24.16）に効く。
- 「Renovate が一度も動いていない」: リポジトリの全コミットが 2026-09-14 の 1 日分なので当然。設定の検証は最初の PR で。
- 3 言語の書き順データを遅延読み込みに: 初回だけの 54KB（gzip 15〜20KB）で、`strokesOf()` を非同期化する範囲が広い。やらない。
- TypeScript 7 へ: typescript-eslint（<6.1）/ svelte-check / kit の peer が未対応。待つ。
- CLAUDE.md の「2026-09 に緩めた」「2026-09 に試して撤去」の日付: 非自明な WHY（実機で駄目だった）を運ぶ文なので残す。書き換えるなら現在形の制約文に。
- `はな`（花・鼻）`あめ`（雨・飴）の同名語がよみクイズの選択肢で衝突する可能性: 選択肢は同カテゴリ優先で、各級の同カテゴリ語が 2 つ以上あるため現在のデータでは衝突しない。データ依存で壊れやすいので、単語を増やしたら `quiz.test.ts` に「同名語が同じ問題に出ない」assertion を足すこと。
- `Content-Security-Policy` の `<meta>`: **対応済み（2026-09-14、計画外）**。`vite.config.ts` の `csp`（hash、`connect-src 'self'`、`img-src` に data:/blob:、`style-src` に unsafe-inline）。全ページと写真の切り抜きで違反 0 を preview で確認。
- `AvatarPicker` の長押し削除モードから抜ける操作が無い: **対応済み（2026-09-14、計画外）**。同じ写真をもう一度タップ、または用意した絵を選ぶと抜ける。
- `Board.getScreenCTM()!` が null になり得る: 再現手順が無い。観察されたら扱う。
- `fx.ts` / `nav.ts` / `image.ts` / `pwa.ts` のテスト: モックを試すだけになる。書かない。
- `progress.svelte.ts` / `practice.svelte.ts` / `badges.ts` の分割: 149〜200 行で凝集している。分けない。

## 監査していないもの

- `scripts/make-strokes-en.ts` / `make-icon.ts` の中身（生成物はテストで検証されている）。
- `static/img/**` の自作 SVG と Twemoji 上流の差分（README の「自作」表記の裏取り）。
- 実機・ブラウザでの動作確認。すべての指摘はコードの読解と `pnpm test:run` 等の読み取り専用コマンドによる。特に 001 の CSS 包含ブロックの見え方は preview ビルドで確認が必要。
- `docs/superpowers/**` の本文（初日の計画。現行仕様は CLAUDE.md）。
