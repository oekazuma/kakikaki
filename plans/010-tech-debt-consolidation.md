# Plan 010: 重複した判定式・`char-` 接頭辞・メダルの段・`today()` の置き場・意味色・切り抜き座標計算を整理する

> **Executor instructions**: 上から順に。各ステップは独立。STOP 条件に当たったら報告。
>
> **Drift check**: `git diff --stat 948551a..HEAD -- src/lib/progress.svelte.ts src/lib/words.ts src/lib/practice.svelte.ts src/lib/components/CompleteModal.svelte src/routes/chars/+page.svelte src/lib/badges.ts src/lib/components/trophies/BadgeGrid.svelte src/lib/gate.svelte.ts src/routes/practice/+page.svelte static/app.css src/lib/components/balloon/Egg.svelte src/lib/components/profiles/AvatarCrop.svelte`

## Status

- **Priority**: P3 · **Effort**: M（合計） · **Risk**: LOW（AvatarCrop だけ MED） · **Depends on**: 008（trophies の props 化の後に BadgeGrid を触る） · **Category**: tech-debt
- **Planned at**: commit `948551a`, 2026-09-14

## Steps

1. **progress の内部重複**: `clearedIn(p: CharProgress)` = `p.trace >= CAP.trace && p.free >= CAP.free`、`goldIn(p)` = `p.test >= CAP.test` を作り、`charCleared` / `charGold` / `summaryOf` の 2 か所のラムダから呼ぶ。「今日を days に足して保存」を `markToday(l)` にして `record` / `recordQuiz` から呼ぶ。`progress.test.ts` pass。
2. **char- 接頭辞**: `words.ts` に `export const CHAR_PREFIX = 'char-'`、`export const charWordId = (c: string) => CHAR_PREFIX + c`、`export const isCharWord = (w: Word) => w.id.startsWith(CHAR_PREFIX)` を置き、`wordById` の `id.slice(5)` を `id.slice(CHAR_PREFIX.length)` に。`practice.svelte.ts:51,56`、`CompleteModal.svelte:27`、`chars/+page.svelte:18` を置き換える。`words.ts` は `$app/*` を import しない。
3. **メダルの段**: `Badge` に `group: BadgeGroup` を足し、`count()` の第 1 引数の直後に段を渡す。`groupOf()` を消し、`BadgeGrid` は `b.group` で分ける。`badges.test.ts` の `groupOf` 参照を `b.group` に。
4. **today()**: `src/lib/today.ts`（新規、`$app/*` 不要）に移し、`progress.svelte.ts` は re-export（`export { today } from './today'`）して呼び出し元を壊さない。`gate.svelte.ts` は `./today` から import（`progress` への依存を切る）。
5. **無意味な分岐**: `practice/+page.svelte:48` の `lang.v === 'en' ? s.c : readingOf(s.c)` を `readingOf(s.c)` に。
6. **意味色**: `app.css` の `:root` に `--warn: #e08a00; --danger: #e53935; --danger-ink: #c62828; --pill: #eef1f4;` を足し、`src/lib/components` と `src/routes` の同じリテラルを `var(--…)` に置換（`sed` 可。`static/app.css` の `[data-lang]` ブロックには足さない: 赤や橙はテーマで変えない）。`balloon/+page.svelte:91` の `#f4f5f0` は `var(--bg)`。`Egg.svelte:17` の 4 色は `COLORS` から `import { COLORS } from '$lib/balloon.svelte'` して `COLORS.slice(0, 4)` 等にする。
7. **AvatarCrop の座標計算**: `src/lib/crop.ts`（新規）に `clampOffset(v, size, V)`、`zoomAt(state, z, cx, cy, zoomMax)`、`cropRect(state, base, V)` を純粋関数で置き、`AvatarCrop.svelte` の `clamp` / `setZoom` / ピンチ / `pick` から同じ算術で呼ぶ。`src/lib/crop.test.ts` に「(cx, cy) の下の画像点が拡大前後で動かない」「ox/oy が `[V - size, 0]` を出ない」「cropRect が画像座標に戻る」の 3 件。
8. **全体**: lint / check / test:run / vitals 100 / build。preview ビルドで実績画面・文字一覧・プロフィール編集（写真切り抜き）を目で確認。

## Done criteria

- [ ] `grep -n "trace >= 2" src/lib/progress.svelte.ts` 0 件、`grep -rn "startsWith('char-')" src` 0 件、`grep -rn "groupOf" src` 0 件
- [ ] `grep -n "from './progress.svelte'" src/lib/gate.svelte.ts` 0 件
- [ ] `grep -rn "#e08a00\|#e53935\|#c62828\|#eef1f4" src/lib/components src/routes | wc -l` が 0
- [ ] `src/lib/crop.ts` と `crop.test.ts` があり、`AvatarCrop.svelte` が 200 行未満
- [ ] すべての検証が通る

## STOP conditions

- Step 7 の算術を書き換えたら preview で切り抜き位置がずれる → 元の式に戻して、抽出だけ（同じ式）にする。
