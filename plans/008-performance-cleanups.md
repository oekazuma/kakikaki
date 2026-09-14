# Plan 008: テンプレートの二重生成・実績画面の再計算・全要素 transition・風船の毎フレーム再配列・pointermove の CTM を減らす

> **Executor instructions**: 上から順に。各ステップの検証を確認してから次へ。STOP 条件に当たったら報告。
>
> **Drift check**: `git diff --stat 948551a..HEAD -- src/lib/recognize.ts src/lib/recognize.test.ts src/routes/trophies/+page.svelte src/lib/components/trophies static/app.css src/lib/balloon.svelte.ts src/lib/components/Board.svelte src/lib/tracer.svelte.ts`

## Status

- **Priority**: P2 · **Effort**: S · **Risk**: LOW（Board の CTM キャッシュだけ MED） · **Depends on**: none · **Category**: perf
- **Planned at**: commit `948551a`, 2026-09-14

## Why this matters

`recognize.ts:20` の `TEMPLATES` は import 時に 81 文字を平坦化・再標本化し、`templatesFor(STROKES)` はそれを
知らずにもう一度作る（練習・かきクイズの起動経路で 2 回）。実績画面は `stats()`（210 語 × `lettersOf`）を
Hero・StatTiles・BadgeGrid・ページの `checkBadges` で 4〜5 回、`badgesOf()` を 9 回呼ぶ。`app.css` の
`main, main *` transition はホームの 1,200 要素すべてに 3 プロパティの遷移を張る。風船は毎フレーム配列を 2 回
作り直す。`Board` は pointermove ごとに `getScreenCTM().inverse()` を呼ぶ（直前に `points` を書いているので
レイアウト強制）。なぞる モードでは描かれない `trail` にも push している。

## Steps

1. **TEMPLATES**: `recognize.ts` の `export const TEMPLATES = makeTemplates(STROKES)` を削除し、`recognize(strokes, templates = templatesFor(STROKES))` にする。`recognize.test.ts:42` の `TEMPLATES` テストは `templatesFor(STROKES).length` に書き換え、`templatesFor(STROKES) === templatesFor(STROKES)`（同一参照）も assert。CLAUDE.md:45 の「`TEMPLATES` は ひらがな用の既定値」を「既定は `templatesFor(STROKES)`」に。
   **Verify**: `pnpm exec vitest run src/lib/recognize.test.ts` pass。`grep -rn "TEMPLATES" src` が 0 件。
2. **実績画面**: `trophies/+page.svelte` で `const s = $derived(stats())`、`const badges = $derived(badgesOf(lang.v))`、`const got = $derived(earned())` を 1 回だけ作り、`Hero` / `StatTiles` / `BadgeGrid` に props で渡す（各コンポーネントの `stats()` / `badgesOf()` / `earned()` 呼び出しを props に置き換え、import を消す）。`$effect` の `checkBadges()` は `untrack` で包む。`BadgeGrid` の `BADGE_GROUPS.map(... badgesOf(lang.v) ...)` は props の `badges` を使う。
   **Verify**: `pnpm check` 0 errors。`grep -c "stats()" src/lib/components/trophies/*.svelte` が 0。
3. **transition**: `app.css` の `main, main *` を、色が変わる要素だけに: `main, .card, h1, h2, .kyokasho, button, a` 程度。ホームで ことば を切り替えて色がにじむことを目で確認（preview ビルド）。
   **Verify**: `pnpm lint` exit 0。
4. **風船**: `tick()` の `gone` を先に数え、`if (gone.length) this.balloons = this.balloons.filter(...)` にする。`balloon.test.ts` pass。
5. **Board**: `pointerdown` で `svg.getScreenCTM()` と `inverse()` を取って保持し、`pointermove` はそれを使う。`toScreen` も保持した行列を使い、無ければその場で取る。`{#key}` 再マウントで初期化されるので無効化は不要。
6. **trace の trail**: `tracer.svelte.ts` の `move()` で `if (this.mode !== 'trace') this.trail.push(p)`。`down()` の `this.trail = [p]` は残す（`free`/`test` の始点）。`tracer.test.ts` pass。
7. **全体**: lint / check / test:run / vitals 100 / build。

## Done criteria

- [ ] `grep -rn "TEMPLATES" src` 0 件
- [ ] `grep -n "untrack" src/routes/trophies/+page.svelte` 1 件以上
- [ ] `grep -n "main \*" static/app.css` 0 件
- [ ] `grep -n "getScreenCTM" src/lib/components/Board.svelte` が pointerdown 経路の 1〜2 か所だけ
- [ ] すべての検証コマンドが通る

## STOP conditions

- Step 5 で `toScreen` が `Canvas.completed` から呼ばれる時点（画の完了時）に行列が無い → その場で `getScreenCTM()` を取るフォールバックを残す。
- Step 3 で ことば切替の色遷移が消える要素が見つかったらそのセレクタを足す。
