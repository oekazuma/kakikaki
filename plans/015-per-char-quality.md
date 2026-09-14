# Plan 015: 文字ごとの星の数と おてほんなし の不合格回数を残し、「にがてな もじ」を保護者の表に出す

> **Executor instructions**: 上から順に。STOP 条件に当たったら報告。終わったら索引を更新。
>
> **Drift check**: `git diff --stat d0dc711..HEAD -- src/lib/progress.svelte.ts src/lib/practice.svelte.ts src/lib/quiz-session.svelte.ts src/lib/progress.test.ts src/lib/practice.test.ts src/lib/components/about/Progress.svelte`

## Status

- **Priority**: P2 · **Effort**: M · **Risk**: LOW-MED（保存形の拡張。任意項目なので既存データはそのまま読める） · **Depends on**: 014 · **Category**: direction
- **Planned at**: commit `d0dc711`, 2026-09-14

## Why this matters

じぶんでかく の星（1〜3）は表示した直後に捨てられ、おてほんなし の不合格は数えていない。
いまの `CharProgress` は `{ trace, free, test }` の回数だけで、上限に達した後は何度書いても同じ値になる。
「どの字が苦手か」はこのアプリが最も知っている情報なのに残っていない。

**決定**: `star` は最大値（お祝い向き。子どもの画面で使えるように）、`miss` は累計（診断向き。保護者の表だけに出す）。
子ども向けの画面には「にがて」という言葉を出さない。

## Steps

1. `progress.svelte.ts`: `CharProgress` に `star?: number`（じぶんでかく の最高の星 1〜3）と `miss?: number`（おてほんなし の不合格回数）。`recordStar(c, n)`（`Math.max`）、`recordMiss(c)`（+1）を追加。`get()` の既定値はそのまま（任意項目）。`isObject` の guard はそのまま。
2. `practice.svelte.ts`: `done()` で `r.mode === 'test' && !r.ok` のとき `recordMiss(c)`、`r.mode === 'free'` で成功したとき `recordStar(c, st)`。`quiz-session.svelte.ts` の `WriteQuiz.onDone` の不合格でも `recordMiss(this.c)`。
3. `weakChars(l)`（`progress.svelte.ts`）: その人・ことばの保存値から「`miss >= 2` か `star === 1`」の文字を `miss` 降順で返す純粋な読み出し（`summaryOf` と同じく `loadJSON` で任意の pid を読めるよう `weakOf(pid, l)` にする）。
4. `Progress.svelte`（014）の各セルに「にがて: あ・き・さ」を最大 5 文字まで（無ければ出さない）。
5. テスト: `progress.test.ts` に「`recordStar` は最大値、`recordMiss` は累計、`weakOf` の並び」。`practice.test.ts` の既存フローで `get('ば').miss` が 1、`star` が 3 になることを assert に足す。
6. `pnpm verify`、`pnpm build`。

## Done criteria

- [ ] `grep -n "recordMiss\|recordStar" src/lib/practice.svelte.ts src/lib/quiz-session.svelte.ts` 3 件
- [ ] 新テストを含め全 pass
- [ ] すべての検証が通る

## STOP conditions

- `CharProgress` の型変更で `summaryOf` / `computeStats` の呼び出しが型エラーになる（任意項目なら起きないはず）。
