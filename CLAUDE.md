# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

iPad 横画面用の子ども向け ひらがな・カタカナ・アルファベット 書き練習 PWA。SvelteKit（Svelte 5 runes、TypeScript）+ adapter-static で、`main` への push で GitHub Pages（`/kakikaki/`）へ自動デプロイされる。UI 文言は子ども向けのひらがな中心、保護者向け画面（`/about`）だけ漢字可。追加ランタイム依存はゼロで、パーティクル・効果音・手書き認識はすべて自前実装。

## コマンド

```bash
pnpm dev                      # http://localhost:5173/kakikaki/
pnpm test:run                 # vitest 一括実行（unit プロジェクト、happy-dom）。pnpm test で watch
pnpm exec vitest run src/lib/judge.test.ts   # 単一ファイル
pnpm lint                     # prettier --check と eslint（CI と同じ）
pnpm verify                   # lint / check / test:run / vitals / build をまとめて実行（PR の CI と同じ判定）
pnpm vitals                   # svelte-vitals の全体スキャン。編集後は `pnpm vitals --diff`、コミット前は `pnpm vitals --staged`
pnpm format                   # prettier --write
pnpm check                    # svelte-check
pnpm build && pnpm preview    # 静的ビルドと確認（Service Worker は build でのみ有効）
pnpm strokes                  # KanjiVG から src/lib/strokes.ts（ひらがな）と strokes-kana.ts（カタカナ）を再生成
pnpm strokes:en               # アルファベット 52 文字の書き順を線分・円弧の DSL から生成（src/lib/strokes-en.ts）
pnpm images                   # words.ts の emoji から Twemoji SVG を static/img/ に取得（既存は上書きしない）
pnpm icon                     # アイコン/ロゴマーク SVG を生成（引数で文字と色を変えれば姉妹アプリ用になる。PNG 化手順は出力に表示）
```

`video/` は README の紹介動画（`docs/intro.gif`）を作る Remotion プロジェクトで、本体とは別の pnpm プロジェクト（`cd video && pnpm install`）。`pnpm dev` で Studio、`pnpm render` で MP4（`video/out/`、コミットしない）を描画し、ffmpeg で `docs/intro.gif` に変換する（GitHub の README はリポジトリ内の動画を埋め込めないので GIF だけを使う）。BGM は `video/scripts/make-bgm.ts` がオシレータで合成して `src/bgm.wav`（生成物、コミットしない）に書き、`dev` / `render` の前に自動で作る。イラスト・ロゴ・Klee One は `static/` を `publicDir` として直接参照し、書き順と単語は `src/lib/` を import するので複製しない。UI の丸ゴシックは Mac のシステムフォント（Hiragino Maru Gothic ProN）に頼るため、Linux で描画すると字面が変わる。`video/` を触ったら `pnpm check:video` で型を確認する。

svelte-vitals は `svelte-vitals.config.ts` の方針（個人用・noindex なので共有向け SEO 規則はオフ、ディレクトリは kebab-case、全ページに `<main>`、`failOn: 'warning'`）で動く。コンポーネントは 200 行未満に保つ（`architecture/component-size`、抑制ファイルは使っていない）。画面の状態遷移はクラス（`tracer.svelte.ts` / `practice.svelte.ts` / `quiz-session.svelte.ts` / `gate.svelte.ts`）に寄せて vitest で検証し、`.svelte` は描画とイベント配線だけにする。Vite プラグインは `ssr = false` のプリレンダー済みルート（殻 HTML）を自動で飛ばし、それらは CLI のソース解析で検査される（svelte-vitals 0.54.6 以降）。PR では `.github/workflows/svelte-vitals.yml` の action が差分だけを報告する。

依存は `pnpm-workspace.yaml` の catalog で一元管理し（`minimumReleaseAge` あり）、Renovate が minor/patch を自動マージする。CI（`.github/workflows/ci.yml`）は PR では lint（+ svelte-vitals 全体スキャン）/ check / test / build を並列に、`main` への push では build を除く 3 つを回す（ビルドと配信は `deploy.yml`）。内部リンクは `resolve()`（クエリ付きは `src/lib/nav.ts` の `practiceUrl`）で書く。eslint の `no-navigation-without-resolve` に従うため。

`main` に push すると GitHub Actions が GitHub Pages にデプロイする（`BASE_PATH=/<リポジトリ名>` を渡す）。公開先を変えるときは `BASE_PATH=/other pnpm build`（ルート直下なら `BASE_PATH= pnpm build`。`/` で終わる値は SvelteKit が拒む）のように base を変え、`static/manifest.webmanifest` の `start_url` と `scope` を合わせる。

SvelteKit の設定は `svelte.config.js` ではなく `vite.config.ts` の `sveltekit({...})` にある。`version.name` は「ビルド時刻-git 短縮ハッシュ」で、時刻は `KK_BUILD` 環境変数に固定している（SvelteKit が client / server で設定を読み直しても同じ名前になるように。ずれると `__sveltekit_<hash>` が食い違ってページが起動しない）。「アプリについて」はこれを日付とハッシュに分けて表示する。`base` は `BASE_PATH` 環境変数で上書き可。CSP は同じ場所の `csp`（`mode: 'hash'`）で `<meta http-equiv>` として出す（GitHub Pages はヘッダ不可）。外部への通信は `connect-src 'self'` で止め、新しい外部リソースを足すときはここに許可を足す。`+layout.ts` で `ssr = false` + `prerender = true` のため、各ルートは HTML シェルとしてプリレンダーされる。

`scripts/*.ts` は Node 24 の型ストリップで直接実行するため、`src/lib/words.ts` と `chars.ts` は `$app/*` を import してはいけない（`base` が必要な `imageUrl` は `src/lib/image.ts` に分離してある）。

## アーキテクチャ

ひらがな（`ja`）・カタカナ（`kana`）・英語（`en`）の 3 言語を `lang.svelte.ts` の `lang.v` で切り替える。カタカナの単語名・文字セット・行グループはひらがなから `toKatakana` で導出し、専用データは書き順（`strokes-kana.ts`）だけ。文字セット・書き順・読み上げ言語・表示名は `info()` / `strokesOf` / `nameOf` / `lettersOf` 経由で取り、各画面や `Canvas` は言語を直接知らない。テーマ色は `<html data-lang>` に応じて `app.css` の CSS 変数が変わる。書く対象の文字・単語（WordCard の名前、CharTabs、LetterSlots、chars のセル、よみクイズの語と選択肢、完了モーダル）だけ `.kyokasho` クラスで教科書体の Klee One（`static/fonts/`、SIL OFL）を使い、説明文などの UI は丸ゴシックのまま。端末のフォントだと り・き・さ が一筆につながり、KanjiVG のお手本（分かれた字形）と違って子どもが混乱する一方、教科書体を全体に使うと読みづらいと言われたため。ひらがな・カタカナ・英字・記号だけに絞った woff2 で、`static/fonts/` には Regular と SemiBold の 2 本があり（`app.css` と `video/src/theme.ts` の両方が両方を読む）、再生成は同じ `--unicodes` で 2 本とも作る（`for w in Regular SemiBold; do pyftsubset KleeOne-$w.ttf --unicodes="U+0020-007E,U+00A0-00FF,U+2010-2027,U+3000-303F,U+3040-309F,U+30A0-30FF,U+FF01-FF5E,U+2190-2193,U+2605-2606,U+25CB,U+25EF,U+00D7" --flavor=woff2 --layout-features='*'; done`。fonttools + brotli。

座標系はすべて KanjiVG の 109×109 viewBox（アルファベットも同じ枠に合わせて自作）。`Canvas.svelte` が `getScreenCTM()` でポインタ座標を viewBox 単位に変換し、判定・採点・認識はその単位で行う純粋関数に委ねる。

- `storage.ts` / `today.ts`: `localStorage` の読み書きは必ず `loadJSON`（形を確かめて既定値に落とす）/ `saveJSON`（容量超過は `false`）経由。`kk:` 接頭辞の全キー列挙が仕事の `backup.ts` だけが例外。ローカル日付 `YYYY-MM-DD` は `today()` だけが作る（記録日・獲得日・ゲート・風船のベストが同じ「今日」を使うため）。`kk:lang` は現在のことば。
- `geometry.ts`: SVG path（M/L/H/V/C/S/Z）を等間隔の点列にする。`getPointAtLength` は使わず自前で平坦化するので、テストと実行時で同じ点列になる。
- `judge.ts`: なぞる（`advance` が cursor をサンプル列上で進め、-1 で逸脱）/ じぶんでかく（`coverage` が塗れた割合）。しきい値は `JUDGE`。
- `score.ts`: 軌跡とお手本の距離と向きから 0〜1 → 星 1〜3。
- `recognize.ts`: 現在の言語の全文字のお手本を N 点に再サンプリング・重心合わせしたテンプレート（`Canvas` が `templatesFor(strokes)` で文字セットごとに 1 回だけ作り、`Tracer` が必ず渡す）と、書いた画列を画ごとに対応させて距離を取る（書き順は問わず最も近い画を貪欲に当てる。画数の違いは `PENALTY_STROKE` で加点）。`passes` は「1 位が目標で距離が `D_MAX` × 2 未満」または「2 位以内かつ 1 位との差が `MARGIN` 未満」。しきい値は `RECOG`。 2026-09 に画数無視の全体照合を試したが甘くなりすぎたので戻し、`MARGIN` を 8 → 10 にだけ緩めた。
- `profiles.svelte.ts`: 使う人（最大 10 人）。`kk:profiles` に `{ list: Profile[], cur }` を保存し、`Profile` は `id`（`p1`, `p2`…）・`name`・`avatar`（`avatar.ts` の候補 id か写真の data URL）・`lang`。初回起動時に旧キー（`kk:progress` → `kk:<lang>:*`）を `p1` の記録へ移行する。人の切り替えと削除は `progress.svelte.ts` の `switchProfile` / `deleteProfile`（記録の読み直しと言語の復元を伴うため）。写真は `AvatarCrop` で範囲（移動・ピンチ拡大）を選び、座標計算は `crop.ts`（純粋関数、`crop.test.ts`）、`cropAvatar` で 160px の JPEG にしてから保存し、保存失敗（容量超過）は呼び出し側に返す。切り抜いた写真は `photos.svelte.ts`（`kk:photos`、最大 20 枚、使う人をまたいで共有）にも残り、候補一覧で選び直せる・長押しで消せる。プロフィール側は data URL のコピーを持つので、一覧から消しても使っている人には影響しない。
- `progress.svelte.ts`: `localStorage` 直結の `$state`。キーは人と言語ごとに `kk:<pid>:<lang>:progress`（文字ごとの回数）、`kk:<pid>:<lang>:earned`（メダル id → 獲得日）、`kk:<pid>:<lang>:days`（練習した日付）、`kk:<pid>:<lang>:quiz`、`kk:<pid>:<lang>:last`（最後に練習に入った単語 id。ホームの「つづきから」`ContinueCard` は、その単語がまだクリアされていないときだけ 1 枚出し、やりかけが無ければ何も出さない。1 文字練習は覚えない）。関数は現在の言語の記録を対象にし、`wordStar` / `wordCrown` は `Word` を受け取る。文字クリア = trace 2 + free 1、金星 = test 1、単語の星/王冠は全文字の集計。`checkBadges()` が新規獲得メダルを確定して返し、練習画面がトーストを出す。
- `badges.ts`: `badgesOf(lang)` と `computeStats(lang, …)`。連続日数（`streak.ts`。3 言語の `days` を union して数え、今日まだ練習していなくても前日まで続いていれば切れない）は `progress.svelte.ts` の `streakNow` が `Stats.streak` に渡す。行グループは ja/kana が五十音の行、en は 13 文字の行を 7+6 に割った 8 グループ。ストアに依存せず集計値 `Stats` だけを受け取る純粋関数で、`need(s)` は `[達成数, 必要数]` を返す（未獲得時の進み具合バーと「あと n」に使う）。かくし要素のメダル（段「かくし」、`secret: true`。ふうせん ぽん を遊んだ・100 てん・300 てん、絵を跳び出させた、ピンボール 100 かい・200 かい）は `secret.ts` の `kk:secret`（pid → { balloons, eggs, pinball }、ことばをまたいで共有）と風船の自己ベストから `Stats` に入り、取るまで実績画面では「？？？」、`nextBadge` の対象外。風船ページの終了時と跳び出しの終了時（`PracticeSession.celebrate`）に `checkBadges()` を呼んでトーストを出す。`groupOf(id)` が id の接頭辞から実績画面の段（`BADGE_GROUPS`）を決め、`nextBadge` が達成率最大の未獲得メダルを返す（Hero の「つぎの めだる」）。実績画面は開いたときに `checkBadges()` を呼び、条件を満たしているのに未確定のメダルがあれば確定して紙吹雪、当日獲得分には NEW! を付ける。
- `tracer.svelte.ts` / `Canvas.svelte` / `Board.svelte`: `Tracer` が 3 モード（`trace` / `free` / `test`）のポインタ入力を判定して状態（現在の画・cursor・軌跡）を持ち、`Canvas` がタイマー・効果音・演出と `onDone` の `Result` を担当、`Board` が SVG 描画と座標変換だけを行う。文字やモードの切替は親が `{#key}` で再マウントする前提で、内部で props 変化を監視していない。
- `practice.svelte.ts`: 練習画面の状態機械 `PracticeSession`（文字の解放・モード遷移・記録・メダルのトースト）。自動で進むのは文字ごとに なぞる 2 回 → じぶんでかく → 次の文字 まで。最後の文字を終えると `CompleteModal` が出て（新しく星か王冠を取ったときだけ。クリア済みの単語をやり直したときは出ない）、王冠がなければ「おてほんなしに ちょうせん」から `challenge()` で金星でない最初の文字の おてほんなし に入り、通ると次の金星でない文字の おてほんなし へ進む（ModeBar から手動で選んでも同じ）。ページは `$derived.by` + `untrack` で単語ごとに 1 つ作る（コンストラクタが進捗ストアを読むため、`$derived` に直接書くと記録のたびに作り直されて壊れる）。UI は `components/` の WordWithHear（単語カード + 単語全体を読むスピーカー）/ ModeBar / CharTabs / ActionButton（右の きく は 1 文字だけ読む。ひとつ もどる は `Tracer.undo()` で最後の線を消し、じぶんでかく で線が無ければ直前の画を取り消す。なぞる では出さない）/ Hint / CompleteModal / BadgeToast / DriveBy。
- `quiz-session.svelte.ts`: `ReadQuiz` / `WriteQuiz`（出題は `quiz.ts`、終了時の記録と演出は共通）。クイズ画面はこれを `$derived.by` + `untrack` で級ごとに作り、QuizHeader / ReadQuestion / LetterSlots で描画する。
- 新しいバージョンの検知は SvelteKit 標準の `updated`（`$app/state`、`kit.version.pollInterval` で 5 分ごとに `_app/version.json` を照合）。`+layout.svelte` が前面に戻ったときにも `updated.check()` を呼ぶ。`updated.current` をホームの ? ボタンの赤丸と「アプリについて」の更新ボタン（新版があるときだけ有効）に使う。Service Worker は version.json をキャッシュしない（cache-first にすると永遠に古い版を見る）。
- `gate.svelte.ts` / `pwa.ts`: 保護者ゲート（掛け算、1 日 3 回でロック、`kk:gate`）と PWA の状態取得・更新。`backup.ts` は `kk:*` を 1 つの JSON に書き出し、読み込みは掛け算ゲート → 件数確認 → 全部置き換え（途中で容量超過しても控えを書き戻して元の記録を残し、失敗は画面に出す）。`sw-rules.ts` は Service Worker の判断を純粋関数にして vitest で検証する（`service-worker.ts` は `$service-worker` に依存するので直接読めない）。`/about` はこれらを `components/about/*`（Guide / AppStatus / Backup）で表示するだけ。同じ画面の「みんなの進み具合」（`Progress`）は人ごとに 1 行の一覧で、押すと `ProgressDetail` のモーダル（`LangDetail` × 3 ことば: 文字・単語のバー、メダル、練習日、行ごとのクリア数、クイズの正解数、苦手な文字）を開く。集計は `progress.svelte.ts` の `detailOf(pid, lang)` / `streakOf(pid)` が保存値から直接読む。記録のリセット（ことばを選ぶ、`resetRecords`）と人の削除（`deleteProfile`）は `/profiles` の編集シートの `DangerZone` にまとめてあり、どちらも `DangerModal`（ことばの選択 `LangPicker` と掛け算ゲート）→ `DeleteConfirm`（誰の・どの記録が何件消えるかを `summaryOf` で表示、チェック必須）→ `Shredder` 演出 の順。ブラウザ標準の confirm は使わない。トロフィー画面は `components/trophies/*`、ホームの言語切替は `LangToggle`、使う人の切替は `ProfileButton` → `/profiles`（`components/profiles/*` の編集シートとアバター選択）。
- `quiz.ts`: クイズの出題（純粋関数）。`levelOf` が文字数で かんたん/ふつう/むずかしい（Level 1〜3）を決め（ja: 〜2 / 3 / 4〜、en: 〜4 / 5〜6 / 7〜）、`makeReadQuiz` は 5 形式（word: 文字→イラスト、picture: イラスト→文字、listen: 聞いて→イラスト、initial: 「り」で はじまる→イラスト、blank: 穴埋めの文字を選ぶ）を 10 問に 2 回ずつ混ぜ、順番は毎回シャッフル。イラストの選択肢は同カテゴリ（Level 3 は同文字数）優先で 3 つ、initial は頭文字が違う語だけ、blank は同じ文字セット（英語は同じ大文字小文字）から 2 つ。答え合わせは `ReadQ.key`（単語 id か文字）で行う。正解数は `progress.svelte.ts` の `recordQuiz` で `kk:<pid>:<lang>:quiz` の `read1` などに積む（初回正答のみ、かきクイズはお手本を使わなかった単語のみ）。`WriteQuiz` は `Canvas` を test モードで使い、2 回不正解で trace モードに切り替える。出題は `makeWriteQuiz` が絵（picture）と聞き取り（listen）を交互に出す `WriteQ[]` で、見せ方の違いはページ側だけ。
- `viewport.svelte.ts`: 画面サイズと向き。`bind:innerWidth` ではなく、resize / orientationchange / pageshow / focus / visibilitychange と `matchMedia('(orientation: portrait)')` の change で測り直し、さらに 100/400/1200ms 後にも再測定する。iPad のホーム画面アプリは起動・回転直後に古い値のままで resize が来ず、横向きなのに回転案内が出ることがあったため。向きの判定は寸法比ではなく matchMedia を使う。大きさは `documentElement.clientWidth/Height`（レイアウトビューポート）で測る。`visualViewport` はソフトキーボードで縮み、名前入力中に画面サイズの案内が出て入力を塞いだため。
- `Splash.svelte`: 起動画面（ロゴと「かきかき ひらがな」）。`+layout.svelte` で常に出し、画面サイズが 200ms 変わらず・フォントが読めるまで（最短 1.3 秒・最長約 2.5 秒）覆ってから消す。ロゴが跳ねて揺れ、文字が 1 つずつ飛び出し、星が瞬き、下線が引かれる CSS アニメーション（prefers-reduced-motion では止める）。`SplashRunner` が 5 回に 1 回くらい どうぶつ（虫は除く）のイラストを画面下で右から左へ走らせる。横向きの絵の向きは `facing.ts` にあり、進む向きと合わないときは `scale: -1 1` で左右反転する（ピンボールも同じ）。iPad のホーム画面アプリは起動直後に縦向きの座標系で一度描かれるため覆い自体もずれることがあり、一度は撤去したが見栄えのために 2026-09 に戻した。背景は `inset: -50vmax` で画面より大きく取り、ずれても縁が見えないようにしている。
- `balloon.svelte.ts` / `routes/balloon`: かくしゲーム「ふうせん ぽん」。`/profiles` 右下の風船（`components/balloon/Egg`）を 10 回タップすると割れて `/balloon` へ。`BalloonGame` が純粋な状態機械（`tick(dt)` で風船が上がり、だんだん速く多く。`pop(id)` でコンボ得点 10, 15, … 60、コンボ 5 ごとに `level` が上がって風船が速く・小さく・多くなり、見逃してコンボが切れるとレベルも戻る。上端を越えると見逃しで 3 回で終了）、ページは rAF で回して `Field` に描く。自己ベストは `kk:balloon`（pid → { score, date }）に使う人をまたいで保存し、`Ranking` で全員の順位を出す。どこからもリンクされないので `vite.config.ts` の `prerender.entries` に `/balloon` を明示している。
- `bouncer.svelte.ts` / `components/Bouncer.svelte`: かくし演出「ピンボール」。練習画面の単語カード（`WordWithHear`）を 10 回続けてタップ（2 秒あくと数え直し）すると、そのイラストがカードから跳び出し（カードには灰色のシルエット `ghost` が残る）、放物線で着地して右へ走り抜ける。走っている間にタップすると弾かれて画面の端で跳ね返りながら飛び回り、タップするたびに速く・回転が増し、最後のタップから 6 秒で消える。壁に当たった回数を画面上部に出し、`GOAL`（100 回）に届くと紙吹雪とファンファーレ。`Bouncer` は px 座標の純粋な状態機械（`tick(dt)` / `kick()`）で vitest で検証し、描画は rAF。出ている間は透明な覆い（z-index 59）で他の操作を止め、`BackButton` だけ z-index 61 で覆いの上にあるので戻れる。記録・メダルには関係しない。
- z-index の層（新しい覆い・モーダルはこの表に入れる）: 5 `Egg`（風船ページ内は別途 1〜3 の局所スタック）、50 `+layout` の fx canvas、59 `Bouncer` の覆い、60 `Bouncer` の絵と回数・`DriveBy`・よみクイズの ○、61 `BackButton`、70 `.dim`（`app.css`）・`BadgeToast`、71 `ProfileEditor` / `DangerModal` / `DeleteConfirm` / `ProgressDetail` / `QuizHeader` の確認、80 `CompleteModal` / `QuizResult` / `Shredder`、100 `+layout` の画面サイズ案内、110 `Splash`。
- `fx.ts` / `audio.ts`: 全画面 canvas のパーティクル、WebAudio の効果音、Web Speech の読み上げ。iOS の制約で `unlock()` はユーザー操作のハンドラ内で呼ぶ。

## 単語を増やす

`src/lib/words.ts` のカテゴリ配列に `['id', 'ひらがな', '絵文字', 'english']` を追加し（カードの補助行のカタカナはひらがなから自動変換。英語名は小文字で書き、表示で先頭だけ大文字になる）、`node scripts/fetch-images.ts` で Twemoji の SVG を `static/img/<id>.svg` に取得する。自前のイラストを使うときは同じパスに置く（画像が無い単語は頭文字のカードで表示される）。ひらがな・カタカナ・英語名の全文字が `strokes.ts` / `strokes-kana.ts` / `strokes-en.ts` に存在する必要があり、`words.test.ts` がそれを検証する。

## 実機で調整する前提の値

判定の手触りは iPad 実機で決めるものとして、`JUDGE`（特に先読み `K`）、`RECOG`、`Canvas.svelte` の おてほんなし自動判定（4 秒）となぞる／じぶんでかく の無操作でのお手本自動再生（6 秒）を定数にまとめてある。なぞる は子どもが「厳しい」と感じたので 2026-09 に緩めた（線から 12、先読み 8 点、終点の手前 4 点で可）。おてほんなし では盤面に字も画数も出さず、右の「みる」も出さない（以前あった左上の画数表示と 2 秒だけ字を見せる「みる」は不要として 2026-09 に削除）。

## UI 確認

ブラウザペインは幅が狭く横画面レイアウトを確認できないため、1180×820 のスクリーンショットや Pointer 操作のテストは Playwright を一時ディレクトリに入れて行う（dev サーバーは初回コンパイルが遅いので、練習画面は `style[data-vite-dev-id*="practice"]` の出現を待ってから撮る）。
