# Implementation Plans

`/improve deep` が 2026-09-14（commit `b611db7`）と 2026-09-15（commit `dbe4daa`）に生成した。
どちらもユーザー不在の自律モードで実行したため、レバレッジ上位を計画にし、残りは下の「未計画の指摘」に置いた（依頼があれば計画化する）。
実行者は計画を全部読んでから始め、STOP 条件を守り、終わったら自分の行を更新する。

## Execution order & status

### 2026-09-15 の監査（018〜023）

| Plan | Title                                                                                      | Priority | Effort | Depends on | Status |
| ---- | ------------------------------------------------------------------------------------------ | -------- | ------ | ---------- | ------ |
| 018  | バックアップの読み込みは途中で失敗しても元の記録を残し、常識外のファイルは弾く             | P1       | S      | —          | DONE   |
| 019  | Service Worker は自分のキャッシュだけを消し、install を非原子化。教科書体を preload        | P1       | S      | —          | DONE   |
| 020  | 走る絵の向き・ピンボールの記録・読み上げの点灯・判定の二重実行・クイズの離脱・リセット漏れ | P1       | M      | —          | DONE   |
| 021  | メダル確定・容量超過の巻き戻し・他人の集計・データ不変条件（向き・クイズ・同名語）のテスト | P1       | S      | 020        | DONE   |
| 022  | 保護者向けガイドと CLAUDE.md の更新、`verify` に build、Markdown だけの変更でも CI         | P2       | S      | 019        | DONE   |
| 023  | ホームに「つづきから」の 1 枚                                                              | P2       | S      | —          | DONE   |

### 2026-09-14 の監査（001〜017、すべて DONE）

| Plan | Title                                                                                | Priority | Effort | Depends on | Status |
| ---- | ------------------------------------------------------------------------------------ | -------- | ------ | ---------- | ------ |
| 001  | 削除・リセットは「削除する」で即時実行され、演出中に閉じても取り消されない           | P1       | M      | —          | DONE   |
| 002  | 書き取り面は 1 本の指（pointerId）だけを追う                                         | P1       | S      | —          | DONE   |
| 003  | localStorage の読み書きを `storage.ts` に集約し、壊れた保存値でも起動する            | P1       | M      | —          | DONE   |
| 004  | 人を消すと `kk:balloon` も消え、記録キー名は `profiles` に一本化                     | P1       | S      | 003        | DONE   |
| 005  | Canvas のタイマーは再マウントで止まり、URL の `w=` / `level=` 不正で白画面にならない | P2       | S      | 002        | DONE   |
| 006  | 生成ファイルの整形除外・ドキュメント誤り・KanjiVG 固定・`@types/eslint`・CI 権限     | P2       | S      | —          | DONE   |
| 007  | 風船の終了処理・更新ボタン・読み上げ・viewport・写真 URL の小さな不具合              | P2       | S      | —          | DONE   |
| 008  | テンプレート二重生成・実績画面の再計算・全要素 transition・風船の再配列・CTM         | P2       | S      | —          | DONE   |
| 009  | days・むずかしい・Service Worker・readingOf のテストと `pnpm verify`                 | P2       | S      | —          | DONE   |
| 010  | 重複判定式・`char-`・メダルの段・`today()`・意味色・切り抜き座標の整理               | P3       | M      | 008        | DONE   |
| 011  | scripts の型検査・`$app/*` 禁止の機械化・Node 版・エディタ設定・古い設計文書・CI     | P3       | S-M    | —          | DONE   |
| 012  | 「みる」ボタン、そ・ぽ の単語、記録のバックアップ（書き出し・読み込み）              | P3       | M      | 003        | DONE   |
| 013  | えいご の単語は先頭を大文字で見せ、大文字 26 字を単語とクイズから届くように          | P1       | S      | —          | DONE   |
| 014  | 「アプリについて」に全員 × 3 ことば の進み具合の表                                   | P1       | S      | —          | DONE   |
| 015  | 文字ごとの星と不合格回数を残し、「にがてな もじ」を保護者の表に                      | P2       | M      | 014        | DONE   |
| 016  | 連続日数（ことばをまたぐ）とカレンダー、連続日数のメダル                             | P2       | S-M    | —          | DONE   |
| 017  | かきクイズに「きいて かく」形式                                                      | P3       | S-M    | —          | DONE   |

Status values: TODO | IN PROGRESS | DONE | BLOCKED (理由 1 行) | REJECTED (理由 1 行)

## 2026-09-15 の実行結果（execute）

018〜023 は `/improve` の execute 手順で、計画ごとに独立した git worktree の実行担当（sonnet）が実装し、レビューで差分・done criteria・テストの中身を確認して承認した。ユーザーのブランチ `claude/quiz-mode-back-button-confirm-04fbfc`（`dbe4daa`）には何もコミットしていない。

| 計画 | ブランチ                           | 先頭      | 備考                                                                                             |
| ---- | ---------------------------------- | --------- | ------------------------------------------------------------------------------------------------ |
| 018  | `worktree-agent-af0079be11d183771` | `799f9f3` | `Storage.prototype` への spy が happy-dom で効かず `localStorage` インスタンスに spy（記録済み） |
| 019  | `worktree-agent-a9beadfe1bf8086b2` | `f1413a3` | Playwright で Cache Storage と `hitoiki-test` の残存を確認済み                                   |
| 020  | `worktree-agent-aa6437461ab8bc6de` | `da1a00f` | 1 項目 1 コミット（10 個）。`settled` は eslint の未使用で削除                                   |
| 021  | `worktree-agent-ac945d381a27c98da` | `3b408e4` | 020 を含む。`vite-config.test.ts` は `import.meta.url` が file: でないため `process.cwd()`       |
| 022  | `worktree-agent-a260b27e967d60f26` | `956075a` | 019 を含む。CLAUDE.md の backup の巻き戻しの一文は REVISE で復元                                 |
| 023  | `worktree-agent-ac9762ef7ab195d04` | `11e46db` | ブラウザで「つづきから」の表示は確認済み、クリック遷移は未確認                                   |

統合ブランチ `integ/improve-2026-09-15`（`dbe4daa` に 6 本を順にマージ、衝突なし）で `pnpm verify`（build 込み）が exit 0、テスト 116 件、svelte-vitals 100/100。取り込みは `git merge integ/improve-2026-09-15`（fast-forward）か、上の表のブランチを個別に merge / cherry-pick する。

019 の install の非原子化は取り込み後に一部を戻した。build（ハッシュ付き JS/CSS）と prerendered（殻 HTML）は版が揃わないと起動しないので `addAll` でまとめて入れ、1 件でも失敗したら install を失敗させて前の版を残す。`Promise.allSettled` は files（イラスト・フォント・効果音）だけに使う。全部を `allSettled` にすると、デプロイ直後に CDN の古い HTML と新しい JS が混ざった状態でも install が成功して古い正常なキャッシュを消してしまうため。

取り込み後に済んだこと。

- `oekazuma/hitoiki` の Service Worker にも同じ接頭辞フィルタ（`hitoiki-`）と install の形（build + prerendered は `addAll`、files だけ `allSettled`）が入った（hitoiki の `05cc8af`）。実ブラウザで `kk-test` が残り `hitoiki-old` だけ消えることを確認済み。
- `docs/intro.gif` を描画し直した（`faf76f8`）。
- 023 の「つづきから」は、人 × ことば ごとに最後に練習に入った単語を `kk:<pid>:<lang>:last` に覚え、その単語がやりかけのときだけ出す形に変えた（`24b7cec` / `1fe5fe7`）。

iPad 実機でも 2026-09-15 に確認済み（走る絵の向き・読み上げの点灯・できた の連打・クイズの離脱・つづきから・すべてリセット・オフライン起動・記録の読み込み）。残作業は無い。

## 2026-09-15 の追加対応（監査で計画にしなかった項目）

索引の「方向性」「先送り」に残していたもののうち、オーナーの指示で次を実装した（`12123ae` まで）。

- DIR-03 共有シート: バックアップを `navigator.share` で送る「共有する」ボタン（対応端末だけ表示）。
- DIR-04 かきクイズの穴埋め: 絵 → 聞く → 穴埋め の順で出題し、穴埋めは ？ の 1 文字だけ書く。
- DIR-05 数字: えいご の 1 文字練習に 0〜9 を追加（`scripts/make-strokes-en.ts` の DSL、行「すうじ」、クイズの選択肢には出さない）。
- 削除・リセットの最終確認に かくし要素（ふうせん ぽん の自己ベスト・ピンボール）の件数。
- TEST-08: 単語カードの連打（`taps.ts`）と起動画面の終了判定（`splash-gate.ts`）をクラスに出してテスト。
- CORR-13: アバター一覧の長押しの取り残し（`hold.ts`）。
- PERF-05: 風船の位置更新を `translate` に。PERF-03 は既にキャッシュ済みで対応不要、PERF-06 は実機で縁の確認が要るので見送り。
- DIR-02（苦手な文字から練習へ）は保護者だけが見る前提のため不要と判断。

`docs/intro.gif` の履歴肥大は、履歴の書き換え（`git filter-repo` + force push）が自動実行の許可外だったため未着手。手順は会話に記載。

## Dependency notes

- 021 は 020 と同じテストファイル（`progress.test.ts` / `profiles.test.ts`）を触るので、020 の後に。020 を飛ばす場合は 021 の Drift check に書いたとおり、`CAP` の export と `resetRecords` のテストが無い前提で読む。
- 022 は `pnpm verify` に `pnpm build` を足すので、019 で Service Worker のビルド確認が通っていることが前提。CLAUDE.md のフォント再生成の記述（Regular と SemiBold の 2 本）は 019 の「Regular は消さない」判断と対になっている。
- 018 と 023 は独立。018 は方向性 DIR-03（共有シート）の前提になる。
- 019 の Service Worker の修正は姉妹アプリ `oekazuma/hitoiki` にも同じものが要る（片側だけでは かきかき のキャッシュが消され続ける）。別リポジトリなので計画外。完了報告に書くこと。
- すべての計画の共通ゲートは `pnpm verify`（022 以降は build を含む）。worktree で `Tsconfig not found` が出たら本体側の `.svelte-kit/tsconfig.json` をコピーする（各計画の STOP 条件に記載）。
- 001 だけはブラウザ（`pnpm build && pnpm preview`）での確認が検証ゲート（完了済み）。

## 2026-09-15 の監査で分かったこと

ベースラインは緑（vitest 100 件、svelte-check 0、lint 0、svelte-vitals 100/100、`pnpm audit` は dev 経由の low 1 件）。
9 カテゴリを 8 本の並列監査で回し、表に載せた指摘はすべて該当コードを開いて確認した。前回（2026-09-14）以降の 65 コミット（風船・ピンボール・スプラッシュ・かくしメダル・バックアップ・保護者の詳細・カレンダー）を重点にした。

### 未計画の指摘（依頼があれば計画化する）

正確性

- `kk:profiles` が壊れて `migrate()` が走ると一覧が `p1` 1 人に置き換わり、他の人の `kk:p2:*` などの記録は残るのに到達不能になる（`profiles.svelte.ts:40-50`）。作り直す前に生値を `kk:profiles.bak` に退避し、`kk:p<N>:` キーから一覧を再構成する案。S〜M。
- `+layout.svelte:17-20` の `$effect` は `profiles` を読みながら `rememberLang` → `updateProfile` で同じ `$state` に書く。いま無限ループにならないのは effect が `p.lang` を読んでいないという一点に依存する。書き込み側を `untrack` で囲むだけで恒久的に安全。S。
- `practice/+page.svelte:34` の `strokes[s.c].length` は `strokes`（現在の言語）と `s.chars`（セッション生成時の言語）を混ぜる。練習画面に言語切替を足した瞬間に白画面になる。いまは到達しない。S。
- `AvatarPicker.svelte:37-51` の長押しが `pointercancel` / `pointerleave` で中断されると `justHeld` が残り、次の 1 タップが飲まれる。実機で再現確認が先。S。
- `resolveWord('char-')`（空の擬似単語。手入力 URL のみ）で `lettersOf` が空になり `strokes[undefined]` で落ちる。`lettersOf(w, l).length > 0` の 1 条件。S。
- `detailOf(pid, l)` は 1 ことば の集計に ことば横断の `secretStats` を混ぜるので、`ProgressDetail` の 3 行が同じかくしメダルを 3 回数える。`DeleteConfirm` の合計も ことば をまたいで同じ単語を最大 3 回数える（記録は ことば ごとに別なので設計上は妥当とも言える）。表示の意図を決めてから。S。

性能（いずれも実機計測が先）

- 認識テンプレートは「できた」を押した瞬間に初めて作られる（`tracer.svelte.ts:110` → `templatesFor`、ja は 81 文字 229 パス）。test モードの `Canvas` のマウント時に `templatesFor(strokes)` を呼んで暖める。S。
- 「みんなの進み具合」は人数 × 3 ことば ぶん `detailOf` の完全集計を作って `chars` 1 個しか使わない（`Progress.svelte:11-16`）。クリア文字数だけを返す軽い関数に。S。
- 風船を `left` / `top` で動かしていて毎フレームレイアウトが走る（`Field.svelte:9-11`）。`transform` に寄せる。S、実機で Layout のバーを確認してから。
- スプラッシュの背景 `inset: -50vmax` は画面の約 6 倍の面積で、フェード中に合成レイヤーになる（`Splash.svelte:88-92`）。`-50%` 程度に縮められるが、CLAUDE.md が記録する「起動直後に縁が見える」不具合の再発を実機で確認する必要がある。S。
- `WordCard` の `<img>` に `decoding="async"` が無い。別件で触るときに 1 行。

技術的負債

- メダルのトースト提示が 3 か所に分裂（`practice.svelte.ts:223-235`、`balloon/+page.svelte:49-57`、`trophies/+page.svelte:16-18`）。風船だけ無音、実績画面は何を取ったか見せない。`checkBadges()` の隣に「新規メダルを順に見せる」1 関数を置く。S。
- モーダルの中央寄せが `inset: 0; margin: auto`（`ProfileEditor` / `CompleteModal`）と `transform: translate(-50%, -50%)`（`DangerModal` / `DeleteConfirm` / `QuizHeader` / `ProgressDetail`）の 2 流儀。後者は子孫の `fixed` が壊れる罠（`4996ff5` で一度踏んだ）。z-index は 13 段が 20 ファイルに散在（022 で CLAUDE.md に表を足す）。統一は M、目視確認が要る。
- `AvatarCrop.svelte:26-71` の指の追跡（`pts` / `drag` / `pinch`）が `.svelte` に残る唯一の状態機械。`crop.svelte.ts` の `CropGesture` に出してテスト。M、ピンチの手触りは実機。
- `video/src/theme.ts:11-27` が `app.css` の色 16 個を手写し。GIF は年に数回しか描き直さないので、コメントを強める程度で十分。
- モジュール外から使われていない `export` が 8 件（`SecretStats` / `NO_SECRET` / `BadgeGroup` / `READ_KINDS` / `shuffle` / `CharProgress` / `Summary` / `Secret`）。`RECOG` / `RUN_SPEED` は調整点の目印なので残す。S。
- `Splash.svelte:47` と `routes/+page.svelte:35` のロゴマークのファイル名規約が逐語同一。`LANG_INFO` に `mark` を足す。S。

テスト

- `.svelte` に残る状態機械（`Canvas` の 4 秒 / 6 秒タイマー、`WordWithHear` の 10 タップ、`Splash` の settled、`QuizHeader` の guard、`AvatarCrop` の指）。定数は実機調整値なので据え置きで構造だけ出す。S〜M。
- 日付のテストがタイムゾーンを固定していない（`streak.ts` は UTC 解釈、`today.ts` はローカル）。現状は相殺されて通る。vitest の `env.TZ` を固定するか、UTC ランナーで整合する 1 ケース。S。

依存・DX・ドキュメント

- vitest 4 → 5 は peer が揃っている（vite 8 / Node 24 / @types/node 24）。Renovate はメジャーを自動マージしないので PR を手で見る。S。
- `globals.node` が `.svelte` を含む全ファイルに適用され、ブラウザ側に `process` などが紛れても止まらない。`scripts/**` と設定ファイルだけに絞る。S。
- `docs/intro.gif`（6.4MB）が 4 回描き直され、履歴に約 26MB 積まれている。以後は fps / 幅 / 尺を落として小さく描くか Git LFS。履歴の書き換えは対象外。S。
- `progress.svelte.ts` の save 失敗（容量超過）は子どもにも保護者にも見えない設計。「きろくが ほぞんできませんでした」を `/about` に出す案。M。
- CLAUDE.md の「UI 確認」（Playwright を一時ディレクトリに）はブラウザペインで 1180×820 が撮れるなら書き換えられる。確認してから。S。
- CLAUDE.md にかくしメダルの追加手順（`secret.ts` → `badges.ts` → `checkBadges()` を呼ぶ画面）とアバターの追加手順（`person-*` は `pnpm images` で取れない）が無い。S。
- 紹介動画の GIF の再描画（022 でソースの `12 / 54` を直した後、`cd video && pnpm render`）。オーナーの Mac で。

セキュリティ（決定として記録するもの）

- `oekazuma.github.io` は `hitoiki` などの姉妹プロジェクトと同一オリジンで、`localStorage`（子どもの名前・写真）と `Cache Storage` を共有する。このアプリの CSP と `ssr = false` は隣のサイトの侵害には効かない。選択肢は (a) 専用サブドメインに移す（既存端末の記録はバックアップで移行）、(b) 現状を受け入れて CLAUDE.md に前提として明記する。今回は (b) を採り、Cache Storage の具体的な衝突だけ 019 で直す。
- `scripts/fetch-images.ts` は取得した SVG を無検査で書き出す（現物 230 件は script 要素・イベント属性・外部参照ゼロを確認済み）。`fetch-strokes.ts` と同じ発想で検査を足し、タグ固定をコミット SHA に。S。
- meta CSP に `form-action 'none'` を足す（`frame-ancestors` は meta では表現できない）。`static/robots.txt` はサブパス配信では効かず、実際の noindex は `app.html` の meta。S。
- `setup-node/action.yml` の `jq` 出力を検証せず `GITHUB_OUTPUT` に書く。fork PR の token は読み取り専用なので実害は CI が落ちる程度。`svelte-vitals.yml` の `pull-requests: write` が action 内で repo の依存を実行するかは未確認。S。

## 方向性（機能）

2026-09-15 の監査で挙がった 5 件のうち、最も安い「つづきから」を 023 に計画化した。残りは選択肢として記録する。

- 保護者の「苦手な文字」から、その子・そのことばの練習画面へ直接飛ぶ（`weakOf` は export されているのに呼び出し元ゼロ）。人の切り替えを伴うので確認モーダルが要る。S。
- バックアップの受け渡しを共有シート（`navigator.share` のファイル共有）に載せ、AirDrop で隣の iPad へ。iPadOS のホーム画面アプリで `canShare({ files })` が通るかの実機スパイクが先。使えなければ Guide に手順を 1 行。S。018 が前提。
- かきクイズに「穴埋めの 1 文字だけを書く」形式。むずかしい は 1 問 10 文字になり得るので短い挑戦として。正解数の意味が変わるので `write1〜3` の扱いを決めてから。S〜M。
- すうじ 0〜9。`make-strokes-en.ts` の DSL で 30 行程度だが、`CHARS_EN` に混ぜるとメダルの分母と認識（`0`/`O`、`1`/`I`/`l`）に影響する。数字専用の書き順表で なぞる・じぶんでかく だけにする (b) 案から。設計スパイク。M。

前回（2026-09-14）の 5 件（英語の大文字、保護者向けの表、文字ごとの質、連続日数とカレンダー、かきクイズの新形式）は 013〜017 で実装済み。

## 計画外で対応したもの

- 2026-09-15 時点の確認: `.node-version` / `.npmrc` / `.vscode` は 011 で入れたあと `7e14794` と `76f3af4` で意図的に削除された（Node の版は `package.json` の `devEngines` に一本化。CI の setup-node も同じ場所を読む）。前回の索引が却下に記録していた `.npmrc` の `engine-strict` の記述は、削除コミット自身の理由（`engines` が無いので効いていない）と食い違っていたが、ファイルが無い今はどちらも無効。
- 2026-09-14: おてほんなし の見本カードを左上に移し、字は「みる」を押したときだけ 2 秒見せる（その後 `ea8c0f7` / `73d07d5` で画数表示と「みる」は削除）。カレンダーの印を固定サイズの丸・テーマ色に。「みんなの進み具合」の説明文を削除。過剰設計の監査で挙がった 20 件を適用（`272ba29`）。LICENSE の追加。CSP の `<meta>`（`vite.config.ts` の `csp`）。`AvatarPicker` の削除モードから抜ける操作。

## Findings considered and rejected

- コンポーネント import の書き方が 3 種類（`./` `../` `$lib/`）は見た目だけ。lint 規則を入れないなら一度直しても戻る。
- 「Renovate が一度も動いていない」はリポジトリが新しいだけ。設定の検証は最初の PR で。
- 3 言語の書き順データを遅延読み込みに。初回だけの 54KB（gzip 15〜20KB）で、`strokesOf()` を非同期化する範囲が広い。やらない。
- TypeScript 7 へ。typescript-eslint（<6.1）/ svelte-check / kit の peer が未対応。待つ（2026-09-15 も同じ）。
- CLAUDE.md の「2026-09 に緩めた」「2026-09 に試して撤去」の日付は非自明な WHY を運ぶ文なので残す。
- `はな` / `あめ` の同名語がよみクイズの選択肢で衝突する可能性は、選択肢が同カテゴリ優先で各級の同カテゴリ語が 2 つ以上あるため現在のデータでは起きない。021 が不変条件のテストを足す。
- `Board.getScreenCTM()!` が null になり得る件は再現手順が無い。観察されたら扱う。
- `fx.ts` / `nav.ts` / `image.ts` / `pwa.ts` のテストはモックを試すだけになる。書かない（2026-09-15 も同意見）。
- `progress.svelte.ts` / `practice.svelte.ts` / `badges.ts` の分割。凝集している。分けない。`progress.svelte.ts` の後半（保護者向けの読み取り専用集計）は 2026-09-15 時点で 53 行に増えたが、まだ分けない。220 行を超えたら分割の合図。
- おてほんなし で不合格になった線を消す。`fd16d59` の「つなげ書き・途中で離す・なぞり直しでも通る」意図と噛み合わないので消さない。直すのは判定の二重実行だけ（020）。
- `files`（画像 230 個）を Service Worker の precache から外して遅延取得に。README と Guide の「すべて端末の中に保存される」約束を壊す。全件 precache のまま非原子化だけ行う（019）。
- `KleeOne-Regular.woff2` の削除（283KB の削減）。`video/src/theme.ts` が直接読んでいるので不可。
- `balloon` と `bouncer` の rAF ループ共通化。8 行の足場が同形だが終了条件が違い、共通化しても 4 行しか減らない。
- `quiz/read` と `quiz/write` の重複。確認モーダル・結果・終了処理は既に部品に寄っている。これ以上寄せない。
- `.svelte` の hex 色の変数化。意味色は 010 で済み、残りは一点ものの装飾。
- 言語を 1 つ足すと 7 ファイルが連動する件。どれも言語ごとに本質的に違うデータで、1 テーブルに畳むのは早すぎる抽象化。4 つ目の言語が決まるまで動かさない。
- pre-commit hook。`pnpm verify` 1 コマンドと CI で足りる。毎コミットで svelte-check と vitest が走る体感悪化の方が大きい。
- `.editorconfig`。`.prettierrc` と二重定義になるだけ。
- `deploy.yml` の `BASE_PATH: /${{ github.event.repository.name }}` はスクリプトインジェクションにならない（`env:` への展開で、リポジトリ名はオーナーしか変えられない）。
- `@eslint/compat`。`includeIgnoreFile` の代替は ignore パターンの二重管理で、そちらの方が高い。残す。
- `-webkit-` プレフィックス 7 か所はすべて標準版と対で、iOS Safari に標準版が無いものもある。
- `orientationchange` は deprecated だが、CLAUDE.md が記録する「iPad で resize が来ない」対策の冗長性そのものが目的。外さない。
- 左利き向けの反転レイアウト、かくしゲームの一覧メニュー、カレンダーの月送り、練習量の きょうだい ランキング、子どもの画面に「にがてな もじ」を出す。根拠が無いか、記録された決定に反する。

## 監査していないもの

- `scripts/make-strokes-en.ts` / `make-icon.ts` の中身（生成物はテストで検証されている）。
- `static/img/**` の自作 SVG と Twemoji 上流の差分（README の「自作」表記の裏取り）。script 要素・イベント属性・外部参照が無いことだけは確認した。
- 実機・ブラウザでの動作確認。すべての指摘はコードの読解と読み取り専用コマンドによる。性能の指摘（テンプレート生成の待ち時間、風船のレイアウト、スプラッシュのレイヤー、ポインタ移動ごとの文字列生成）は実機で測ってから動かす。
- `docs/superpowers/**` の本文（初日の計画。現行仕様は CLAUDE.md）。
- `oekazuma/hitoiki` 側の Service Worker（別リポジトリ。019 の Maintenance notes に記載）。
- `video/` の Remotion シーンの見た目（キャプションの数字と色の手写しだけを見た）。
