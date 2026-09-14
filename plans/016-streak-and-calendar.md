# Plan 016: 連続で練習した日数（ことばをまたぐ）とカレンダーを実績画面に出し、連続日数のメダルを足す

> **Executor instructions**: 上から順に。STOP 条件に当たったら報告。終わったら索引を更新。
>
> **Drift check**: `git diff --stat d0dc711..HEAD -- src/lib/progress.svelte.ts src/lib/badges.ts src/lib/badges.test.ts src/lib/components/trophies src/routes/trophies/+page.svelte`

## Status

- **Priority**: P2 · **Effort**: S-M · **Risk**: LOW · **Depends on**: none · **Category**: direction
- **Planned at**: commit `d0dc711`, 2026-09-14

## Why this matters

練習した日付は `kk:<pid>:<lang>:days` に溜まっているのに、使っているのは `length` だけ。連続日数もカレンダーも無く、日数メダルは累計のみ。
**決定**: 連続日数は 3 ことば の日付を union して数える（子どもの感覚に合う）。今日まだ練習していなくても、昨日まで続いていれば切れていない扱い。
連続が切れると幼児は落ち込みうるので、子どもの画面では「つづけて n にち」を出すだけで「切れた」とは言わない。

## Steps

1. `src/lib/streak.ts`（新規、純粋関数）: `streak(days: string[], today: string): number` — 重複を除いて降順に並べ、today か前日から 1 日ずつさかのぼって連続する日数。`src/lib/streak.test.ts` に 4 件（空、今日だけ、昨日まで 3 日、途切れ）。日付の前後は `Date.UTC` で日数差を取る（ローカル時刻の夏時間の影響を避ける）。
2. `progress.svelte.ts`: `allDays()` = 3 ことば の `days` の union。`streakNow()` = `streak(allDays(), today())`。`stats()` に `streak` を渡す。
3. `badges.ts`: `Stats` に `streak: number`、`computeStats` に第 6 引数 `streak = 0`。「つづけた ひ」の段に `streak-3`（🔥 '3にち つづけた'）と `streak-7`（🏅 '7にち つづけた'）。README の 51/46 個 → 53/48 個、CLAUDE.md の関連文（`badges.ts`）に 1 文。
4. `components/trophies/Calendar.svelte`（新規）: 今月の日付をマス目にし、`allDays()` に含まれる日に印。上に「つづけて n にち」。`trophies/+page.svelte` の `StatTiles` の下に置く。
5. `badges.test.ts` の「全部クリアで全メダル」に `streak` を足して通す。`pnpm verify`、`pnpm build`、preview で実績画面。

## Done criteria

- [ ] `src/lib/streak.ts` / `streak.test.ts` / `components/trophies/Calendar.svelte` がある
- [ ] `badgesOf('ja').length` 53、`badgesOf('en').length` 48
- [ ] すべての検証が通る
