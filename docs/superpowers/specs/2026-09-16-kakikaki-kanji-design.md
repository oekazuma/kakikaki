# かきかき かんじ 設計

> 2026-09-16 の設計。小学 1〜3 年で習う漢字 440 字を、ひらがな・かたかな・えいご と並ぶ 4 つ目の「ことば」として足す。現行仕様の説明は `CLAUDE.md` が正で、この文書は追加分の設計だけを書く。

## ねらい

- 小学 1〜3 年の漢字を学年順に書き練習できるようにする。
- 漢字には「単語」の概念を持ち込まない。ホームには単語カードではなく字のマスが学年ごとに並ぶ。
- なぞる・じぶんでかく・おてほんなし・クイズ・実績・保護者向け画面は、既存の仕組みに分岐を足して使う。

## 方針

`lang.svelte.ts` の `Lang` に `kanji` を加える。文字セット・書き順・読み上げ・表示名は `info()` / `strokesOf` / `charsOf` 経由で引き、記録の保存キー（`kk:<pid>:kanji:*`）、使う人ごとの ことば、リセット、バックアップ、保護者向けの一覧は `LANGS` を回しているので自動で広がる。練習は既存の 1 文字練習（`char-一` のような 1 文字の単語）を使う。

`Record<Lang, …>` のオブジェクトリテラルは型エラーになるので、`LANGS` から `Object.fromEntries` で作る形に直す。対象は `progress.svelte.ts` の `data`、`badges.ts` の `ROWS` / `ALL_CHARS`。

漢字だけ違うのは次の 4 点で、それぞれ小さな分岐か専用ファイルで済ませる。

1. ホームの並び（単語カードではなく学年ごとの字のマス）。
2. クイズの中身（イラストではなく読みを使う）。
3. 単語まわりの表示と単語系メダルを出さない。
4. 1 文字練習の完了モーダルを、単語の星ではなく字の星・金星で判断する。

別ルートとして複製する案と、ひらがなの中に段を足す案は採らない。前者は練習画面とクイズの複製が大きく、後者は記録と実績が ひらがな と混ざる。

## データ

### 漢字の一覧と読み `src/lib/kanji.ts`

```ts
export type Grade = 1 | 2 | 3;
export const KANJI: { grade: Grade; name: string; chars: string[] }[]; // 1ねんせい 80 / 2ねんせい 160 / 3ねんせい 200
export const READINGS: Record<string, string[]>; // 字 → 読み（ひらがな）。先頭が代表の読み
export const KANJI_ALL: string[]; // 学年順に平らにした 440 字
export const kanjiReading = (c: string) => READINGS[c][0];
```

- 字の並びは学年別漢字配当表の順（学年ごとに五十音順）。
- 読みは字ごとに 1〜3 個。先頭を代表の読みとし、「きく」の読み上げとクイズの出題に使う。代表の読みは子どもが最初に覚える読み（木→き、花→はな、一→いち）を選ぶ。日→ひ、火→か のように、同じ学年で代表の読みがなるべくかぶらないように選び分けるが、一意性は仕様上の前提にしない。かぶり（こう＝工・公 など）は、よみクイズの外れの選び方と、かきクイズの `accept` で吸収する。
- 読みの初版は Claude が作り、レビューを受ける。`kanji.test.ts` で「学年の字数が 80/160/200」「全字に読みがある」「読みはひらがなだけ」「`KANJI_ALL` に重複なし」を検証する。
- `audio.ts` に小書き文字用の `readingOf` があるので、漢字の読みは `kanjiReading` と名付けて衝突を避ける。
- `words.ts` / `chars.ts` と同じく `$app/*` を import しない。書き順の生成スクリプトが Node から直接読むため。

### 書き順 `src/lib/strokes-kanji.ts`

`scripts/fetch-strokes.ts` の対象に `[KANJI_ALL, 'src/lib/strokes-kanji.ts', 'STROKES_KANJI']` を足して KanjiVG から生成する。正規表現は漢字ファイル（`kvg:09854-s1`）にもそのまま一致する。座標系は既存と同じ 109×109 なので、判定・採点・認識はそのまま動く。ファイルの大きさは生成後に測って `CLAUDE.md` に書く。Service Worker が成果物をまとめて先読みする作りなので分割せず静的に import する（`strokesOf()` は同期のまま）。起動が目に見えて遅くなったときに初めて分割を検討する。

### フォント

Klee One は漢字を含むが、同梱の woff2 はかな・英数だけを切り出したもの。440 字だけの woff2 を Regular と SemiBold の 2 本追加し（`KleeOne-Regular-kanji.woff2` / `KleeOne-SemiBold-kanji.woff2`）、`app.css` の `@font-face` に `unicode-range` でその 440 字を指定する。既存の 2 つの `@font-face` には `unicode-range` が無く漢字にも一致してしまう（一致した face にグリフが無いと同じ family の別 face には落ちない）ので、既存の face にも切り出し時と同じ `unicode-range` を明示する。切り出しは既存と同じ `pyftsubset` で、`--unicodes` に `kanji.ts` の 440 字のコードポイントを渡す。Klee One の元の TTF に 440 字が全部入っていることは切り出し時に確かめる。`CLAUDE.md` のフォント再生成の手順にこの 2 本を足す。

`.kyokasho` は要素ごとに付ける作りなので、新しく字を出す要素（`KanjiGrid` のマス、`LangToggle` の「漢」、クイズの読み・漢字の選択肢、かきクイズの読みの提示）にも付ける。

### 保存キー

`Lang` に `kanji` が入ることで `kk:<pid>:kanji:progress` / `days` / `quiz` / `earned` / `words` が自動で分かれる。漢字は 1 文字練習だけなので `words` は常に空。`DATA_NAMES` や移行の変更は不要。

## ことばの定義 `lang.svelte.ts`

```ts
export type Lang = 'ja' | 'kana' | 'kanji' | 'en';
export const LANGS: Lang[] = ['ja', 'kana', 'kanji', 'en'];
// LANG_INFO.kanji
{ title: 'かきかき かんじ', short: 'かんじ', glyph: '漢', speech: 'ja-JP', strokes: STROKES_KANJI, chars: KANJI_ALL }
```

- `nameOf` / `subOf` / `lettersOf` は 1 文字単語に対して今までどおり字そのものを返す。`nameOf` の分岐は `l === 'en'` を末尾に置き、かんじ は ひらがな と同じく `w.name` を返す。
- `speechOf(c, l)` を足す（文字を受ける）。`kanji` なら `kanjiReading(c)`、それ以外は `audio.ts` の `readingOf(c)`。練習画面の右「きく」（いまは `readingOf(s.c)`）はこれに置き換える。単語全体を読むスピーカーは 1 文字単語なら同じ 1 字なので、`WordWithHear` も `speechOf` を通す。
- `kk:lang` の読み込みで `kanji` を受け付ける。

## ホーム

`lang.v === 'kanji'` のとき、ホームは次のように変わる。

- ことばの切替 `LangToggle` は 4 つ（あ ひらがな／ア かたかな／漢 かんじ／A えいご）。ボタン幅 `--step` を詰め、1024×768 と 1180×820 で 1 行に収まることを Playwright で確認する。
- 進み具合カードは「もじ n/440」だけを出し、「たんご」の棒は出さない（`TOTAL(l).words === 0` で判定）。
- 「もじから えらぶ」ボタンと `ContinueCard` は出さない（`ContinueCard` は 1 文字練習を記録しないので元から空）。
- 本文は `KanjiGrid.svelte`（新規）。「1ねんせい n/80」「2ねんせい n/160」「3ねんせい n/200」の 3 段に字のマスを並べる。マスは `/chars` の cell と同じ見た目（教科書体の字、クリアで星、金の星で王冠）に代表の読みを小さく添え、タップで `practiceUrl(charWordId(c))` へ。
- `+page.svelte` は 200 行未満を保つ。

`/chars` は かんじ では使わない（ホームが一覧を兼ねる）。いまの `/chars` は `lang.v !== 'en'` で ひらがな の表を出すので、かんじ で開くとひらがなのマスが出て、押すと練習画面が落ちる。かんじ のときはホームへ `goto` で戻す（必須）。

## 練習画面

既存の 1 文字練習を使う。CharTabs は 1 つ、なぞる 2 回 → じぶんでかく → 完了モーダル → 「つぎの もじ」で学年順の次の字（`nextWordId` が `charsOf()` の並びで探す）、おてほんなし の挑戦、ひとつ もどる、みる、やりなおす は現状のまま。

変えるのは次の 4 点。

- 既定の単語。`resolveWord` は書き順の無い字を含む単語を無条件に `patocar` へ落とすが、かんじ では `patocar` 自体が書けないので練習ページが落ちる。既定を ことば ごとにし、かんじ は `charWord(charsOf(l)[0])`（一）にする。`practice.test.ts` の既定の検証も更新する。
- 単語カード。`WordCard` は絵の 404 後に頭文字を出す作りなので、`isCharWord` かつ かんじ のときは絵を要求せず、字を大きく、その下に読み（いち・ひと）を小さく出す。角の星・王冠は `wordStar` / `wordCrown` で 1 文字単語では付かないので、`isCharWord` なら `charCleared` / `charGold` で出す（CharTabs と一致させる）。跳び出し（ピンボール）は `WordWithHear` が `img` を探して止まるので起きない。
- 読み上げ。スピーカーと右の「きく」は `speechOf` を読む。
- 完了モーダル。`CompleteModal` の星・王冠と `PracticeSession.done` の「新しく取ったときだけ出す」判定は `wordStar` / `wordCrown` に依っていて、1 文字単語では常に false（`recordWordDone` が弾く）になる。そのため金星を取ってもモーダルは「ほし」を出し、「おてほんなしに ちょうせん」を押しても何も起きず、クリア済みの字をやり直すたびにモーダルが出る。1 文字単語では `charCleared` / `charGold` で星・王冠を決め、金星なら ちょうせん を隠し、モーダルは新しくクリアか金星を取ったときだけ出す。ひらがな・かたかな・えいご の 1 文字練習も同じ動きになる（改善）。

おてほんなし の認識は 440 字のお手本の中から一番近い字を選ぶ。画数の違いに罰点を付ける今の方式は漢字で効くはずだが、似た字（土・士、日・目）の手触りは実機で見て `RECOG` を調整する前提。テンプレートは今までどおり文字セットごとに一度だけ作る。

## クイズ

### 級 → 学年

`LEVEL_NAME` の定数を `levelName(lv, l)` に置き換え、かんじ では `1ねんせい / 2ねんせい / 3ねんせい`、それ以外は今の かんたん / ふつう / むずかしい。利用箇所は `badges.ts`、`quiz.ts`、`QuizResult`、`QuizHeader`、`QuizBars`（`l` を受け取るように変える）、`StatTiles`、`quiz/+page`、`quiz/read`、`quiz/write` の 9 ファイル。`quiz/+page` の級の補足（みじかい ことば など）と形式の説明（えを えらぼう など）はハードコードなので、かんじ 用の文言（80 じ / 160 じ / 200 じ、よみを えらぼう、よみを みて かこう）に分岐する。内部の `Level` はそのまま学年に読み替えるので、正答数の記録 `read1`〜`write3` とクイズ系メダルの仕組みは変えない。出題範囲はその学年の字だけ。

### 出題の入口

`makeReadQuiz(l, …)` / `makeWriteQuiz(l, …)` が `l === 'kanji'` のとき `quiz-kanji.ts` の `makeKanjiReadQuiz` / `makeKanjiWriteQuiz` に委譲する。`quiz-session.svelte.ts` はそのままで通る。`wordsOf('kanji', …)` は使わない。循環 import を避けるため、`shuffle` は `src/lib/shuffle.ts` に移し、`quiz-kanji.ts` は `quiz.ts` から型だけを `import type` で取る。

`quiz.test.ts` の `LANGS` を回す 2 つのループ（よみ 10 問の形式ごとの検証、かき の形式の順番）は単語の形式を前提にしているので、`TOTAL(l).words > 0` の ことば に絞る。かんじ の性質は `quiz-kanji.test.ts` だけで検証する。

### よみクイズ（10 問）`quiz-kanji.ts`

2 形式を 5 問ずつ混ぜてシャッフルし、既存の `ReadQ` と同じ形で返す。答え合わせ・記録・結果画面は共通。

- 字を見て読みを選ぶ（`kanji-read`）。大きな漢字を見せ、読みの選択肢 3 つから選ぶ。外れは同じ学年の別の字の代表の読みで、出題した字のどの読みとも一致しないもの。
- 読みを聞いて字を選ぶ（`kanji-listen`）。スピーカーで読みを流し（画面にも読みを出す）、漢字 3 つから選ぶ。外れは、流した読みをどの読みにも持たない字だけから選ぶ。

`ReadKind` 型に `kanji-read` / `kanji-listen` を足すが、`READ_KINDS` 配列（ひらがな 等の各形式 2 回ずつの割り当て）には足さない。`ReadQ` は `answer` に `charWord(c)`、`key` に字か読みを持つ。画面は `ReadPrompt` に 2 形式の分岐（漢字を大きく出す／読みを出してスピーカーで流す）を足し、`ReadQuestion` は文字列の選択肢を出す既存の `blank` の分岐にこの 2 形式を加えて教科書体で出す。

### かきクイズ

読みを見せ（スピーカーでも聞ける）、その字をお手本なしで書く。問題数と「2 回外すと なぞる に切り替え」は既存と同じ。`WriteKind` に `kanji` を足し（`WRITE_KINDS` 配列には足さない）、`quiz/write/+page` に「読みを出してスピーカーで流す」分岐と、案内文（いまは「n もじめを かいてみよう」）を「よみを みて かこう」にする分岐を足す。`WriteQ` に `accept?: string[]`（正解にする字の集合）を足し、同じ読みを持つ字が学年内にあるときはどれを書いても正解にする。なぞる に切り替わったときのお手本は出題した字。`recordQuiz` の「お手本を使わなかった単語のみ」の条件は 1 文字単語でもそのまま効く。

`recognize.ts` の `passes(target, results)` は `passes(targets: string[], results)` にし、1 位が候補のどれかで距離が `D_MAX × 2` 未満、または 2 位以内に候補があり 1 位との差が `MARGIN` 未満、とする。呼び出しは `Tracer.judge()` の中なので、`accept` は `Canvas` の prop → `Tracer` のコンストラクタ引数 → `judge()` で `passes(accept ?? [char], r)` と渡す。採点（`mine`）は出題字のまま。`recognize.test.ts` の既存の呼び出しは `[c]` に置き換える。

## 実績と進み具合

### 単語の無い ことば

`TOTAL(l)` を ことば ごとに持ち、かんじ は `words: 0`。`badgesOf` は `T.words === 0` のとき、単語に関わるメダル（はじめての たんご・はじめての おうかん・たんご n こ・はかせ（`cat-*`）・おうかん n こ）を一覧に入れない。これで `words-all` / `crowns-all` が `[0, 0]` で自動獲得される事故と、`StatTiles` の `pct(0, 0)` を避ける。

### メダル `badgesOf('kanji')`

- はじめて。はじめの いっぽ、はじめての きんのほし。
- もじの かず。しきい値は ことば ごとの表にし、かんじ は 10・50・100・200・300・440。金の星も同じ刻み。既存の 3 ことば は今の刻み（10・30・50・全部）のまま。
- がくねん（`BADGE_GROUPS` に段「がくねん」を足す。`ROWS.kanji` は学年を行にする）。1ねんせい マスター／2ねんせい マスター／3ねんせい マスター。「全部マスター」の表示名は 4 分岐にする（あるふぁべっと の else 分岐に落ちないように）。
- クイズ。よみクイズ 1ねんせい 〜 かきクイズ 3ねんせい とマスター。名前は `levelName` から。
- つづけた ひ・かくし。共通のまま。連続日数は 4 ことばの練習日を合わせて数える。

`badges.test.ts` の id の一意性・行の網羅は `LANGS` を回すように変え、全部クリアで全メダルの枚数の期待値に かんじ を足す。

### 表示

- ホームの進み具合カードと実績の `StatTiles` は、`TOTAL(l).words === 0` のとき たんご・おうかん のタイルとカテゴリの棒を出さない。
- `/about/progress` の `LangOverview` は 4 枚。かんじ のカードは `Ring` を文字だけの 1 本にし、「単語 n/m」を出さない。`RowHeat` は行ごとの棒 1 本の作りなので、学年を行にしてそのまま使う（1ねんせい 12/80 のように 3 本）。苦手な字と `QuizBars` はそのまま。
- `DangerModal` の `LangPicker` は `LANGS` を回すので 4 つになる。`DeleteConfirm` と `/about` の「ひらがな・かたかな・えいご」の文言に かんじ を足す。`ProfileEditor` に ことば の選択は無い（現在の ことば を渡すだけ）ので変更なし。

## テーマ色とロゴ

`app.css` に `<html data-lang="kanji">` 用の色を 1 組足す（紫以外で、他の 3 つと見分けが付く色。候補を見せて決めてもらう）。`video/src/theme.ts` は別コピーなので触らない。

ロゴは `scripts/make-icon.ts` が `STROKES` / `STROKES_KANA` / 英字の DSL からしか字を引けず、出力先も `static/icon.svg`（PWA アイコン）と `static/logo-mark.svg` 固定なので、`STROKES_KANJI` を引けるようにし、ロゴの出力名を引数で受け、`icon.svg` は ひらがな（既定の字）のときだけ書くようにしてから「漢」と新しい色で `static/logo-mark-kanji.svg` を作る（`logoUrl` は `logo-mark-<lang>.svg` を返す）。README 用の `logo-kanji.svg` は作らない。起動画面の文言は「かきかき かんじ」。

## 説明文

`/about/guide`（ことばの切替の説明と ことば の一覧）と README に かんじ の項を足す。`CLAUDE.md` は ことば が 4 つになること、`kanji.ts` / `strokes-kanji.ts` / `quiz-kanji.ts` / `KanjiGrid.svelte`、フォント再生成の手順、かきクイズの `accept`、1 文字練習の完了モーダルの判定、`resolveWord` の既定、`levelName` を追記する。紹介動画は触らない。

## テスト

- `kanji.test.ts`。学年の字数、全字に読み、読みはひらがなだけ、`KANJI_ALL` に重複なし、`STROKES_KANJI` が 440 字を全部持つ。
- `lang.test.ts`。`speechOf` が かんじ で読みを、それ以外で `readingOf` を返す。
- `quiz-kanji.test.ts`。よみクイズが 5+5 問、外れの読みが出題字の読みと一致しない、聞き取りの外れが読みを共有しない、かきクイズの `accept` が同じ読みの字を含む。`makeReadQuiz('kanji')` が委譲する。
- `recognize.test.ts`。`passes` が候補の集合で判定する（1 字のときは従来と同じ）。
- `practice.test.ts`。`resolveWord` の かんじ の既定、1 文字単語の完了モーダルが金星で ちょうせん を出さない、クリア済みの字のやり直しでモーダルが出ない。
- `badges.test.ts`。`badgesOf` の id が一意（4 ことば）、`ROWS` が全字を過不足なく分ける（4 ことば）、全部クリアで全メダル、かんじ に単語系メダルが無い。
- UI は Playwright（scratchpad）で 1024×768 と 1180×820 のホーム・練習・クイズ・実績を撮って確認する。

## やらないこと

- 例語（一ねんせい のような語）や意味の表示。読みだけで始め、必要なら後から `kanji.ts` に列を足す。
- 学年をまたぐ解放や順番の強制。並び順だけで「順番」を表す。
- 書き順データの遅延読み込み。
- 紹介動画と `video/` の更新。
