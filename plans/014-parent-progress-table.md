# Plan 014: 「アプリについて」に全員 × 3 ことば の進み具合の表を置く

> **Executor instructions**: 上から順に。STOP 条件に当たったら報告。終わったら索引を更新。
>
> **Drift check**: `git diff --stat d0dc711..HEAD -- src/routes/about/+page.svelte src/lib/components/about src/lib/progress.svelte.ts`

## Status

- **Priority**: P1 · **Effort**: S · **Risk**: LOW · **Depends on**: none · **Category**: direction
- **Planned at**: commit `d0dc711`, 2026-09-14

## Why this matters

保護者が子どもの進み具合を見るには、その子に切り替えて（アプリの言語も切り替わる）実績画面を開くしかない。
`summaryOf(pid, l)`（`progress.svelte.ts`）は任意の人 × ことば の件数を保存値から直接読み、削除確認で使われている。
人数 × 3 ことば をこの関数で回す表は 1 コンポーネントで作れ、保護者向けページ（漢字可）が置き場所。

## Current state

`summaryOf` は `{ chars, gold, words, crowns, medals, days, quiz }` を返す。`TOTAL(l)` は `{ chars, words }`（`badges.ts`）。
`/about` は左に `Guide`、右（340px）に `AppStatus` と `Backup`（`src/routes/about/+page.svelte:28-33`）。
`Avatar`、`Bar` コンポーネントは既存。`profiles.list` と `LANGS` / `info(l).short` を使う。

## Steps

1. `src/lib/components/about/Progress.svelte`（新規、200 行未満）: `profiles.list` を行、`LANGS` を列にした表。各セルは `summaryOf(p.id, l)` と `TOTAL(l)` から「もじ a/b」「たんご c/d」の `Bar` 2 本と「めだる n・n 日・クイズ n 問」の 1 行。記録が全部 0 のセルは「まだ」と薄く出す。表の上に「ことばを切り替えずに全員分を見られます」の一文。
2. `about/+page.svelte` の左カラム `Guide` の上に `<Progress />`。
3. `pnpm verify`、preview で 2 人以上・複数ことばの記録を入れて表示を確認。

## Done criteria

- [ ] `src/lib/components/about/Progress.svelte` があり 200 行未満
- [ ] すべての検証が通る

## STOP conditions

- `summaryOf` を 10 人 × 3 で呼ぶと目に見えて遅い（1 回は 216 語 × `lettersOf`。30 回で数十 ms のはず。100ms を超えるなら `$derived` で 1 回だけ計算しているか確認）。
