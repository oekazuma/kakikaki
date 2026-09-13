# かきかき ひらがな 設計

iPad 横画面で使う、子ども向けひらがな書き練習 PWA。配布はせず自宅の iPad にホーム画面追加して使う。

## 技術

- SvelteKit (Svelte 5, runes) + `@sveltejs/adapter-static`、TypeScript、vitest。
- `kit.paths.base` は GitHub Pages のリポジトリ名 `/kakikaki-hiragana`。`BASE_PATH` 環境変数で上書き可（Cloudflare Pages 等に移すとき用）。
- PWA: `static/manifest.webmanifest`（`display: standalone`、`orientation: landscape` は iPadOS では無視される前提）、`src/service-worker.ts`（SvelteKit 組み込み。`build` + `files` を cache-first、バージョンごとに古いキャッシュ削除）。`app.html` に `apple-mobile-web-app-capable`、`apple-touch-icon`、`viewport-fit=cover, user-scalable=no`。
- 追加ライブラリなし。パーティクル・紙吹雪・認識器は自前。
- デプロイ: GitHub Actions で `pnpm build` → `actions/deploy-pages`。

## 画面

すべて `/` 配下、横画面レイアウト。縦向き（`orientation: portrait` メディアクエリ）では全画面オーバーレイ「iPad を よこに してね」を出す。

1. `/` ホーム: カテゴリ（のりもの / ちいかわ / あんぱんまん / ぷりきゅあ）ごとに単語カードを横並び。カードはイラスト・名前・星（クリア済み）・王冠（全文字金星）。右上に「もじから えらぶ」「？」。
2. `/practice/[word]?i=0` 練習: 元アプリのレイアウト。左に単語カード（タップで名前読み上げ）と文字タブ（各文字の星）、中央にモード切替 3 択 + 書き取り面、右に「きく」「みる」「やりなおす」。
3. `/chars` 文字一覧: 81 文字を五十音表で並べ、各文字の星を表示。タップで `/practice/char-〇`（単語扱いの 1 文字）。
4. `/about` アプリについて: 使い方、KanjiVG の帰属表示、保護者ゲート（1 桁 + 1 桁の足し算 3 問のうち 1 問をランダム）。正解で「練習記録をリセット」ボタンが出る。押すと確認ダイアログ → `localStorage` 全消去。

## データ

### 単語 `src/lib/words.ts`

```ts
type Word = { id: string; name: string; category: string; image?: string; desc?: string }
```

- のりもの: patocar ぱとかー / fire-truck しょうぼうしゃ / ambulance きゅうきゅうしゃ / garbage-truck ごみしゅうしゅうしゃ / bus ばす / train でんしゃ / shinkansen しんかんせん / airplane ひこうき
- ちいかわ: chiikawa ちいかわ / hachiware はちわれ / usagi うさぎ
- あんぱんまん: anpanman あんぱんまん / baikinman ばいきんまん / dokinchan どきんちゃん
- ぷりきゅあ: precure ぷりきゅあ
- 画像は `static/img/<id>.svg|png`。乗り物 8 種はフラット SVG を自作して同梱。キャラクターは画像未同梱で、ファイルがなければ頭文字の大きなカードで代用（`<img>` の `onerror` でフォールバック）。

### 書き順 `src/lib/strokes.ts`

`scripts/fetch-strokes.ts` が KanjiVG（`kanji/<codepoint 5 桁>.svg`）から 81 文字分の `<path d>` を抽出して生成。形式は `Record<string, string[]>`、座標系は KanjiVG の 109×109。ファイル先頭に CC BY-SA 3.0 の帰属コメント。実行時にネットワークへは出ない。

収録: 清音 46、濁音 20、半濁音 5、小書き 9（ぁぃぅぇぉゃゅょっ）、長音 ー。

### 進捗 `src/lib/progress.svelte.ts`

`localStorage` キー `kk:progress`。

```ts
type CharProgress = { trace: number; free: number; test: number } // trace 0-2, free 0-1, test 0-1
type Progress = Record<string, CharProgress>
```

- 文字クリア: `trace >= 2 && free >= 1`。
- 金星: `test >= 1`。
- 単語の星: 全文字クリア。王冠: 全文字金星。
- `$state` で保持し、変更のたびに書き戻す。

## 書き取り面 `Canvas.svelte`

- `<svg viewBox="0 0 109 109">` に十字の補助線、お手本（薄いグレー太線）、完了済み画（青太線）、進行中の画、開始位置マーカー、番号。線幅 14、`stroke-linecap/linejoin: round`。
- 上に `<canvas>` を重ねてパーティクルと紙吹雪を描く。
- Pointer Events のみ。`touch-action: none; -webkit-user-select: none; -webkit-touch-callout: none`。`setPointerCapture` で外に出ても追従。
- 座標変換: `getScreenCTM().inverse()` で viewBox 単位へ。判定はすべて viewBox 単位。
- 各画は `getTotalLength / getPointAtLength` で 1.5 単位間隔にサンプリング（`src/lib/geometry.ts`、純関数はサンプル配列を受け取る）。

### モードごとの判定 `src/lib/judge.ts`（純関数、vitest 対象）

- **なぞる**: 開始点から半径 R_START（12）以内で押し始めないと無視。指の位置がサンプル列の `cursor` から前方 K（6）点以内にある最遠の点まで `cursor` を進める。逸脱が R_TRACE（10）を超えたら、その画を最初からやり直し（軽く振動する演出）。指を離した時 `cursor` が末尾 2 点以内なら画完了、そうでなければやり直し。表示は `stroke-dasharray` で `cursor` までを青く塗る。
- **じぶんでかく**: 指の軌跡をそのまま青い太線で描く。軌跡の各点から R_FREE（9）以内のサンプル点を「塗れた」扱い。指を離すたびに塗れた割合を見て 90% 以上で画完了、軌跡はきれいなお手本線に差し替わる。何回離してもよい。画完了時に採点（後述）。
- **おてほんなし**: 十字線のみ。指の軌跡を画として蓄積。「できた」ボタンで認識器にかけて判定。ボタンの代わりに 1.5 秒無操作でも自動判定。

### 採点 `src/lib/score.ts`

じぶんでかくの 1 画ごとの得点（0〜1）を文字全体で平均し、星に変換（>= 0.85: 3, >= 0.65: 2, それ以外: 1）。

- 逸脱: 軌跡点からお手本サンプル列への平均最短距離 d。`1 - clamp(d / 12, 0, 1)`。
- 向き: 軌跡の始点・終点とお手本の始点・終点が近い方が高得点（逆向きなら 0.5 減点）。

おてほんなしの得点は認識器の距離をそのまま 0〜1 に正規化（`1 - clamp(dist / D_MAX, 0, 1)`）し、同じ星境界を使う。

### 認識器 `src/lib/recognize.ts`

- 入力: 書いた画の配列（各画は viewBox 座標の点列）。
- 各画を 32 点に等弧長で再サンプリング。お手本 81 文字も同様に事前計算（モジュール読み込み時に 1 回）。
- 文字ごとの距離 = 画数差 × PENALTY_STROKE（40）+ 画ごとの対応点平均距離の合計 / 画数。画の対応は書いた順に 1 対 1。書いた画数がお手本より多ければ余りは無視、少なければ欠けた画ごとに PENALTY_STROKE。
- 位置ズレに強くするため、入力全体を重心で 109 マスの中央に平行移動してから比較（拡大縮小はしない。同じマスに書くので）。
- 結果: `{ char, dist }` を距離昇順で返す。判定は「1 位が目標」または「目標が 2 位以内かつ 1 位との差が MARGIN（8）未満」で合格。
- 定数は `RECOG` オブジェクトにまとめて調整できるようにする。

## 進行

- 1 文字 = 画数分のループ。全画完了で「できた！」演出（下記）と進捗更新、0.8 秒後に次の文字タブへ自動移動。最後の文字なら単語クリア演出。
- 単語の星: 全文字クリア時点で 1 回だけ大演出。以後は再生しない。
- おてほんなしで不合格: 「おしい！『〇』に みえるよ」（1 位の文字）とやり直しボタン。合格で金星。

## 演出

- 開始位置: 半径 6 の円が拍動（CSS `@keyframes`）。番号付き。
- デモ: `stroke-dashoffset` を CSS transition で 0 にして線が伸びるアニメ。放置 6 秒で自動再生、「みる」ボタンでも再生。
- 画完了: 線が `transform: scale(1.06)` → 1 に戻るバウンス。線に沿って 20 個の粒（黄・水色）が飛び散る（canvas、寿命 0.6 秒）。効果音「ぽん」。
- 文字クリア: 紙吹雪 120 片（3 色、重力あり、1.5 秒）。星が中央から文字タブへ飛んで収まる（`transition` で座標補間）。読み上げで文字の音。
- 単語クリア: 画面下部を単語のイラストが左から右へ走り抜ける（CSS `translateX`、1.6 秒）+ 紙吹雪 300 片 + 「やったー！」読み上げ + ファンファーレ音。ホームに戻るとカードの星が `scale` でポップ。
- 画面遷移: `fly` トランジション。
- やり直し（逸脱）: 書き取り面を `translateX` で小さく揺らす。

## 音 `src/lib/audio.ts`

- 読み上げ: `speechSynthesis`、`lang: 'ja-JP'`、`rate: 0.9`。ボタンのタップハンドラ内で `cancel()` → `speak()`。ja-JP の音声が無ければ何もしない。
- 効果音: WebAudio。初回タップで `AudioContext.resume()`。`pon`（矩形波 短音）、`kira`（上昇 3 音）、`fanfare`（4 音）、`buu`（低音 1 つ、不合格）。音声ファイルなし。

## テスト

- `judge.test.ts`: なぞるの `advance`（前進・逸脱・完了）、じぶんでかくの `coverage`。
- `recognize.test.ts`: お手本の画列そのものを入力したとき 81 文字全て 1 位が自分になる。少しずらした入力でも合格する。
- `score.test.ts`: お手本どおりで 3 つ星、大きくずれると 1 つ星。

## やらないこと

- 縦画面レイアウト（案内のみ）。
- 多言語。
- サーバー・アカウント・同期。
- キャラクターイラストの同梱。
