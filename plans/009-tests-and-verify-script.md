# Plan 009: days・むずかしい の選択肢・Service Worker の判断・読みの変換にテストを足し、`pnpm verify` を作る

> **Executor instructions**: 上から順に。STOP 条件に当たったら報告。
>
> **Drift check**: `git diff --stat 948551a..HEAD -- src/lib/progress.test.ts src/lib/quiz.test.ts src/service-worker.ts src/lib/audio.ts src/lib/balloon.test.ts package.json CLAUDE.md`

## Status

- **Priority**: P2 · **Effort**: S · **Risk**: LOW · **Depends on**: none · **Category**: tests
- **Planned at**: commit `948551a`, 2026-09-14

## Why this matters

`days`（練習した日付）は日数メダルと削除確認の件数に使われるのに assertion が無い。`quiz.test.ts:55-60` は
「同じ文字数が優先」を名乗りながらカテゴリしか見ない。`service-worker.ts` は 2 度の本番不具合を直した 2 行
（`version.json` 素通し・同一オリジンの `ok` だけキャッシュ）を持つのに、`pnpm dev` では動かずテストも無い。
`readingOf` は純粋関数で未テスト。`balloon.test.ts:22-24` は期待値をテスト対象の `points()` から計算している。
「動くか」を一発で見るコマンドが無い。

## Steps

1. **days**: `progress.test.ts` に `vi.useFakeTimers()` + `vi.setSystemTime` で「同じ日に 2 回 record しても 1 日、翌日に recordQuiz で 2 日、保存値も一致」のテスト。
2. **quiz L3**: `quiz.test.ts` の該当テストを、たべもの の 6 文字語（`hamburger` = はんばーがー。他に同カテゴリ 6 文字が 2 つ以上あることを `wordsOf('ja', 3)` で確認）に差し替え、`category` と `lettersOf(...).length === 6` を両方 assert。
3. **Service Worker**: `src/lib/sw-rules.ts` を新規作成し、`export const bypass = (url: string) => new URL(url).pathname.endsWith('/_app/version.json')` と `export const cacheable = (res: { ok: boolean }, url: string, origin: string) => res.ok && new URL(url).origin === origin` を置く。`service-worker.ts` はこれを import して使う（`$service-worker` を import しないので `src/lib` のテストから読める）。`src/lib/sw-rules.test.ts` に 4 assertion。
4. **readingOf**: `src/lib/audio.test.ts`（新規）に `readingOf('ー')`、`readingOf('ァ') === readingOf('ぁ')`、`readingOf('あ') === 'あ'`、`readingOf('A') === 'A'`。`audio.ts` はモジュール読み込み時に `AudioContext` を作らない（`unlock()` まで遅延）ので happy-dom で import できる。
5. **balloon**: `balloon.test.ts:19-24` を、`tick` で出た風船を全部割った後の `combo` と `score` を整数リテラルで assert する形にする（`rnd = () => 0.5` なので決定的。実際の値はテストを一度走らせて確定させ、`points()` 由来の式は消す）。
6. **verify**: `package.json` に `"verify": "pnpm lint && pnpm check && pnpm test:run && pnpm vitals"` を足し、CLAUDE.md のコマンド一覧に 1 行加える。
7. **全体**: `pnpm verify` が通る。`pnpm build`。

## Done criteria

- [ ] 新規テスト: days 1 件、sw-rules 1 ファイル、audio 1 ファイル。既存テスト全部 pass
- [ ] `grep -n "points(4 + i)" src/lib/balloon.test.ts` 0 件
- [ ] `pnpm verify` exit 0

## STOP conditions

- `audio.ts` の import が happy-dom で失敗する（`window` 参照がトップレベルにある）→ `readingOf` を触らず報告。
- Service Worker のビルド（`pnpm build`）で `src/lib/sw-rules.ts` の import が解決しない。
