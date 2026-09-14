# Plan 007: 風船の終了処理・更新ボタン・読み上げ・ビューポート・写真 URL の小さな不具合を直す

> **Executor instructions**: 上から順に。各ステップの検証を確認してから次へ。STOP 条件に当たったら報告。
> 終わったら `plans/README.md` の行を更新。
>
> **Drift check（最初に実行）**:
> `git diff --stat 948551a..HEAD -- src/routes/balloon/+page.svelte src/lib/components/about/AppStatus.svelte src/lib/pwa.ts src/lib/audio.ts src/lib/viewport.svelte.ts src/lib/avatar.ts src/lib/components/profiles/AvatarPicker.svelte src/routes/about/+page.svelte`
> 差分があれば「Current state」と見比べ、食い違えば STOP。

## Status

- **Priority**: P2 · **Effort**: S · **Risk**: LOW · **Depends on**: none · **Category**: bug
- **Planned at**: commit `948551a`, 2026-09-14

## Why this matters

どれも実害は小さいが、放置すると目に見える: 風船ゲームの結果画面で 60Hz の localStorage 読み込みが回り続ける。
更新の確認・実行が失敗するとボタンが「更新中…」のまま死ぬ。「きく」を二度押すと音声より先に点灯が消える。
`watchViewport` の cleanup が 1 つのリスナーと 3 つのタイマーを外さない。写真を選ぶたびに元画像の object URL が
文書の寿命まで残る（iPad で 12MP 写真 × 数枚は数十 MB）。

## Current state

`src/routes/balloon/+page.svelte:31,37-44`:

```ts
      if (g.over && !isBest && floater === null) finish();
  ...
  function finish() {
    isBest = saveScore(profiles.cur, g.score, today());
    if (isBest) {
```

`saveScore` が false を返すと `isBest` が false のままなので毎フレーム `finish()` が走る。

`src/lib/components/about/AppStatus.svelte:14-24`: `check()` は `await updated.check()` を try/finally で包まず、
`update()` は `updateApp()` を await も catch もしない。`src/lib/pwa.ts:16-35`: `updateApp` は `reg.update()` の
失敗を処理しない。`src/routes/about/+page.svelte:9-11`: `pwaStatus().then(...)` に catch が無い。

`src/lib/audio.ts:47-67`: `say()` は先頭で `speechSynthesis.cancel()`、全 utterance に `u.onerror = finish`。
前の呼び出しの utterance が cancel で onerror → 前の Promise が解決 → 呼び出し側の `speaking = false`。

`src/lib/viewport.svelte.ts:14-34`: `settle` の `setTimeout` 3 つと `matchMedia(...).addEventListener('change', settle)`
が cleanup で外れない。

`src/lib/avatar.ts:32-43`: `loadImage` は成功時に `URL.revokeObjectURL` を呼ばない。`AvatarPicker.svelte:26-30`
の `picked()` と `oncancel` で `cropping = null` にする瞬間が revoke の適所（`AvatarCrop` が `img.src` を表示中は revoke できない）。

## Steps

1. **風船**: `finish()` を「一度だけ」にする。`let settled = $state(false)` を足し、ループの条件を `if (g.over && !settled) finish()`、`finish()` の先頭で `settled = true`、`start()` で `settled = false`。`floater === null` の条件は外す（点数の演出と無関係）。
   **Verify**: `pnpm check` 0 errors。
2. **更新 UI**: `AppStatus.check()` を `try { await updated.check(); } finally { checking = false; checked = true; }`。`update()` は `updateApp().catch(() => { updating = false; failed = true; })` とし、`failed` のとき `<small class="err">更新できませんでした。しばらくしてからもう一度</small>` を出す（`.err` は `color: #c62828`）。`about/+page.svelte` の `pwaStatus().then(...)` に `.catch(() => {})` を付ける（状態は既定の false のまま）。
   **Verify**: `pnpm check` 0 errors。
3. **読み上げ**: `audio.ts` にモジュール変数 `let gen = 0` を置き、`say()` で `const me = ++gen` を取り、`finish` は `if (me === gen) done()` を通す（古い呼び出しは解決しない。cancel された古い呼び出しは 15 秒の保険タイマーもクリアし、解決は新しい方に任せる）。
   `onerror` は最後の utterance にだけ付けるのではなく、全 utterance に付けたまま `me === gen` で弾く。
   **Verify**: `pnpm check` 0 errors。
4. **viewport**: `settle` のタイマーを配列に持ち、cleanup で `clearTimeout`。`matchMedia` の結果を `const mq` に取り、cleanup で `mq.removeEventListener('change', settle)`。
   **Verify**: `pnpm check` 0 errors。
5. **object URL**: `loadImage` は成功時もそのまま（表示に使う）。`AvatarPicker` の `picked()` と `oncancel` で `URL.revokeObjectURL(cropping.src)` を `cropping = null` の前に呼ぶ。
   **Verify**: `pnpm lint` exit 0。
6. **全体**: `pnpm test:run` all pass、`pnpm vitals` 100、`pnpm build` exit 0。

## Done criteria

- [ ] `grep -n "settled" src/routes/balloon/+page.svelte` が 3 件以上
- [ ] `grep -n "finally" src/lib/components/about/AppStatus.svelte` が 1 件、`grep -n "catch" src/lib/components/about/AppStatus.svelte src/routes/about/+page.svelte` が 2 件
- [ ] `grep -n "removeEventListener('change'" src/lib/viewport.svelte.ts` が 1 件
- [ ] `grep -n "revokeObjectURL" src/lib/components/profiles/AvatarPicker.svelte` が 2 件
- [ ] lint / check / test:run / vitals 100 / build が全部通る

## STOP conditions

- Current state の抜粋と実物が食い違う。
- `say()` の変更で `practice/+page.svelte` の `speaking` が戻らなくなる（古い Promise を解決しない設計なので、呼び出し側が `await say()` の後に `speaking = false` している箇所は新しい方の完了で戻る。二重タップで最初の `hear()` の `speaking = false` は永遠に来ないが、2 回目が戻す。3 か所の呼び出し元がこの形であることを確認）。
