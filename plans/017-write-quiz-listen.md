# Plan 017: かきクイズに「きいて かく」形式を足し、絵と音を交互に出す

> **Executor instructions**: 上から順に。STOP 条件に当たったら報告。終わったら索引を更新。
>
> **Drift check**: `git diff --stat d0dc711..HEAD -- src/lib/quiz.ts src/lib/quiz.test.ts src/lib/quiz-session.svelte.ts src/lib/quiz-session.test.ts src/routes/quiz/write/+page.svelte`

## Status

- **Priority**: P3 · **Effort**: S-M · **Risk**: LOW · **Depends on**: none · **Category**: direction
- **Planned at**: commit `d0dc711`, 2026-09-14

## Why this matters

よみクイズは 5 形式、かきクイズは「絵を見て書く」の 1 形式だけ。絵の無い「聞いて書く」は本物の書き取りに近く、
むずかしい を終えた子の次の段になる。`WriteQuiz` は出題の見せ方を知らないので、`kind` を通すだけで状態機械は変わらない。
音声は「きく」ボタンを押したときだけ流す方針なので、自動再生はしない。

## Steps

1. `quiz.ts`: `export type WriteKind = 'picture' | 'listen'`、`export type WriteQ = { word: Word; kind: WriteKind }`。`makeWriteQuiz` は `WriteQ[]` を返し、奇数番目を `listen`（5 問なら 絵・音・絵・音・絵）。
2. `quiz-session.svelte.ts`: `WriteQuiz.words` を `qs: WriteQ[]` に、`get word()` は `this.qs[this.i]?.word`、`get kind()` を追加。`finish` の `this.words.length` を `this.qs.length`。
3. `routes/quiz/write/+page.svelte`: `w.kind === 'listen'` のときは絵を出さず、`.pic` の中に大きな「きく」ボタン（`ReadPrompt` の `.hear.big` と同じ見え方）と「きこえた ことばを かこう」。`QuizHeader` の `total` を `w.qs.length`。
4. テスト: `quiz.test.ts` の「かきクイズは 5 問」に `kind` の並びを、`quiz-session.test.ts` の `WriteQuiz` に `w.kind` を assert。
5. README のかきクイズの説明に「イラストを見て、または聞いて」を足す。`pnpm verify`、`pnpm build`、preview で かきクイズ を 1 回通す。

## Done criteria

- [ ] `grep -n "listen" src/routes/quiz/write/+page.svelte` 1 件以上
- [ ] すべての検証が通る
