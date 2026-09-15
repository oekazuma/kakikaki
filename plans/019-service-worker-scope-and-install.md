# Plan 019: Service Worker は自分のキャッシュだけを消し、1 ファイル失敗で install 全体を落とさない。教科書体は preload する

> **Executor instructions**: 上から順に。各ステップの検証を確認してから次へ。STOP 条件に当たったら報告。
> 終わったら `plans/README.md` の行を更新。
>
> **Drift check（最初に実行）**:
> `git diff --stat dbe4daa..HEAD -- src/service-worker.ts src/lib/sw-rules.ts src/lib/sw-rules.test.ts src/lib/pwa.ts src/app.html`
> 差分があれば「Current state」と見比べ、食い違えば STOP。

## Status

- Priority = P1 · Effort = S · Risk = LOW · Depends on = none · Category = bug / perf
- Planned at = commit `dbe4daa`, 2026-09-15

## Why this matters

1. **同一オリジンの姉妹アプリのオフラインを壊している。** `oekazuma.github.io` は 1 つのオリジンで、同じアカウントの
   `hitoiki`（呼吸ガイド。Pages 公開済みで `src/service-worker.ts` を持つ）と `Cache Storage` を共有する。
   このアプリの activate は `caches.keys()` の全部から自分の現行キャッシュ以外を消すので、かきかき を開くたびに
   hitoiki のオフライン用キャッシュが消える（逆も同様。hitoiki 側は本計画の範囲外だが、同じ修正が要る）。
2. **install が原子的で、1 ファイルでも落ちるとオフラインが一切効かない。** `cache.addAll` は 313 ファイル（`build/` 実測
   2.1MB: SVG 230 個 956KB、フォント 2 本 568KB）のうち 1 件が失敗すると全体が reject され、キャッシュが 1 つも作られない。
   弱い回線での初回起動がいちばん壊れやすく、失敗しても画面には何も出ない。
3. **毎デプロイ 2.1MB を丸ごと取り直す。** `version.name` はビルドごとに変わるので毎回 install が走り、
   `cache: 'reload'` が HTTP キャッシュを迂回する。ハッシュ付きの `build` 資産にまで `reload` を付ける必要は無い。
4. 教科書体の SemiBold（287KB）はホームの 230 枚のカード名に必要だが、`app.css` → `@font-face` → woff2 の直列で
   読まれ、preload が無い。

**やらないこと（重要）**: `files`（`static/img/*.svg` など）を precache から外して遅延取得にはしない。README と
`Guide.svelte` は「文字・イラスト・効果音はすべて端末の中に保存される」と約束しており、機内モードの子どもに
「絵が無い単語」を見せることになる。全件 precache は維持し、**非原子化**だけを行う。

## Current state

`src/service-worker.ts`（全 50 行）。

```ts
const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `kk-${version}`;
const ASSETS = [...build, ...files, ...prerendered];

// 画像などは URL にハッシュが無いので、新しい版を入れるときは HTTP キャッシュを無視して取り直す
sw.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => sw.skipWaiting())
  );
});

sw.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => sw.clients.claim())
  );
});
```

`:32-49` の fetch ハンドラは cache-first で、取りに行った応答が `cacheable(res, url, origin)` なら `c.put` する（precache に無いものは使われた時点で入る）。

`src/lib/sw-rules.ts`（全 9 行）: `bypass(url)` と `cacheable(res, url, origin)` の 2 つの純粋関数。
`src/lib/sw-rules.test.ts`（16 行）がそれぞれ 1 ケースずつ検証している。`service-worker.ts` 自体は `$service-worker` に依存するので vitest から読めない。この分離が慣習。

`src/lib/pwa.ts:16-35` `updateApp()`: SW 未登録のとき `await Promise.all((await caches.keys()).map((k) => caches.delete(k)))` でオリジン全体を消す。

`src/app.html:13`: `<link rel="stylesheet" href="%sveltekit.assets%/app.css" />`。`preload` は無い。
`static/app.css:45-56`: `@font-face` が `fonts/KleeOne-Regular.woff2`（400）と `fonts/KleeOne-SemiBold.woff2`（700）。
`.kyokasho` を使う箇所はほぼ `font-weight: bold`（`WordCard` の `.name`、`CharTabs`、`LetterSlots`、`ReadQuestion`）で、
通常ウェイトは `about/LangDetail.svelte` の行一覧だけ。**Regular は消さない**（`video/src/theme.ts:5` が
`fonts/KleeOne-Regular.woff2` を `loadFont` で直接読んでいる）。
`vite.config.ts:49` の CSP は `font-src 'self'` なので preload に許可の追加は要らない。

## Commands you will need

| Purpose       | Command                                         | Expected on success                                      |
| ------------- | ----------------------------------------------- | -------------------------------------------------------- |
| 単体          | `pnpm exec vitest run src/lib/sw-rules.test.ts` | all pass                                                 |
| 型検査        | `pnpm check`                                    | 0 errors（`service-worker.ts` は svelte-check の対象）   |
| ビルド + 確認 | `pnpm build && pnpm preview --port 4173`        | `build/service-worker.js` が生成され、preview が起動する |
| 一括          | `pnpm verify`                                   | exit 0                                                   |

## Scope

**In scope**:

- `src/service-worker.ts`
- `src/lib/sw-rules.ts`、`src/lib/sw-rules.test.ts`
- `src/lib/pwa.ts`
- `src/app.html`

**Out of scope**:

- `static/app.css` の `@font-face`、`static/fonts/*`（Regular の削除は video が使うので不可）。
- `vite.config.ts`（`version.name` の仕組みや CSP は変えない）。
- `files` の絞り込み・遅延取得（上の「やらないこと」）。
- `oekazuma/hitoiki` リポジトリ側の同じ修正（別リポジトリ。Maintenance notes に記載）。

## Git workflow

- コミットは `fix: Service Worker が同一オリジンの他アプリのキャッシュまで消していた。install は 1 件の失敗で全体を落とさない` のように種別接頭辞 + 日本語 1 行。push / PR は指示が無い限りしない。

## Steps

### Step 1: `sw-rules.ts` に「自分のキャッシュか」「古いか」の判断を足す

```ts
// このアプリのキャッシュ名（kk-<version>）。同じオリジンには姉妹アプリのキャッシュもあるので、他所のものは触らない
export const ours = (key: string) => key.startsWith('kk-');
export const stale = (key: string, current: string) => ours(key) && key !== current;
```

`src/lib/sw-rules.test.ts` に 1 ケース追加。

```ts
it('自分の古いキャッシュだけを消す対象にし、他アプリのキャッシュは触らない', () => {
  expect(stale('kk-1-abc', 'kk-2-def')).toBe(true);
  expect(stale('kk-2-def', 'kk-2-def')).toBe(false);
  expect(stale('hitoiki-1', 'kk-2-def')).toBe(false);
  expect(ours('kk-x')).toBe(true);
  expect(ours('workbox-precache')).toBe(false);
});
```

**Verify**: `pnpm exec vitest run src/lib/sw-rules.test.ts` → 3 件 pass。

### Step 2: activate と `updateApp` を接頭辞で絞る

`src/service-worker.ts` の import を `import { bypass, cacheable, stale } from './lib/sw-rules';` にし、activate を次のようにする。

```ts
      .then((ks) => Promise.all(ks.filter((k) => stale(k, CACHE)).map((k) => caches.delete(k))))
```

`src/lib/pwa.ts` は `import { ours } from './sw-rules';` を足し、`:33` を次のようにする。

```ts
await Promise.all((await caches.keys()).filter(ours).map((k) => caches.delete(k)));
```

**Verify**: `pnpm check` → 0 errors。`grep -n "caches.keys" src/service-worker.ts src/lib/pwa.ts` の両方の直後に `stale` / `ours` の filter がある。

### Step 3: install を非原子化し、`reload` はハッシュの無い URL だけに付ける

```ts
// ハッシュ付きの build は HTTP キャッシュのままでよい。files / prerendered は URL が変わらないので取り直す。
// 1 件の失敗で全体を捨てない（残りは使われたときに fetch ハンドラが入れる）
sw.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) =>
        Promise.allSettled([
          ...build.map((u) => c.add(u)),
          ...[...files, ...prerendered].map((u) => c.add(new Request(u, { cache: 'reload' })))
        ])
      )
      .then(() => sw.skipWaiting())
  );
});
```

`ASSETS` 定数は不要になるので消す。先頭の既存コメント（`:12`）はこの新しいコメントに置き換える。

**Verify**: `pnpm check` → 0 errors。`grep -n "addAll\|ASSETS" src/service-worker.ts` → 0 件。

### Step 4: SemiBold を preload する

`src/app.html` の `app.css` の `<link rel="stylesheet">`（`:13`）の **前** に 1 行。

```html
<link rel="preload" href="%sveltekit.assets%/fonts/KleeOne-SemiBold.woff2" as="font" type="font/woff2" crossorigin />
```

（`crossorigin` はフォントの preload に必須。同一オリジンでも省くと二重取得になる。）

**Verify**: `pnpm build` → `build/index.html` に `rel="preload"` の行が 1 つあり、`href` が `/kakikaki/fonts/KleeOne-SemiBold.woff2`。`pnpm lint` → prettier が通る。

### Step 5: ビルドして SW を目視確認

`pnpm build && pnpm preview --port 4173` を起動し、ブラウザ（Playwright を一時ディレクトリに入れるか、ブラウザペイン）で
`http://localhost:4173/kakikaki/` を開いて確認する。

- DevTools の Application → Cache Storage に `kk-<version>` が 1 つでき、`img/dog.svg` と `fonts/KleeOne-SemiBold.woff2` が入っている。
- コンソールに CSP 違反が無い（preload の `font-src`）。
- 別名のキャッシュを `caches.open('hitoiki-test')` で手で作り、Application → Service Workers で Unregister してから再読み込みしても（`activate` は新しい SW が入るときだけ走る。ただの再読み込みでは走らない）、そのキャッシュが残る。

`grep -c "stale\|allSettled" build/service-worker.js` が 1 以上であることも確認する。

**Verify**: 上の 3 点が確認できる。確認できない項目があれば STOP。

### Step 6: 一括検証

**Verify**: `pnpm verify` → exit 0。

## Test plan

- 新規: `sw-rules.test.ts` の `stale` / `ours` 1 ケース（Step 1）。
- 手本: 同ファイルの `bypass` / `cacheable` のテスト。
- install の非原子化と preload は単体テストにできないので、Step 5 のビルド確認が検証。

## Done criteria

- [ ] `pnpm verify` が exit 0
- [ ] `grep -n "addAll" src/service-worker.ts` が 0 件、`grep -n "allSettled" src/service-worker.ts` が 1 件
- [ ] `grep -n "stale(" src/service-worker.ts` と `grep -n "filter(ours)" src/lib/pwa.ts` がそれぞれ 1 件
- [ ] `grep -c 'rel="preload"' src/app.html` が 1
- [ ] `pnpm build` が成功し、`build/service-worker.js` が存在する
- [ ] `git status` で in scope 以外の変更が無い（`build/` は gitignore 済み）
- [ ] `plans/README.md` の 019 の行を更新

## STOP conditions

- `service-worker.ts` の install / activate が「Current state」の抜粋と一致しない。
- `pnpm build` が worktree で `Tsconfig not found` で落ちる: 本体側の `.svelte-kit/tsconfig.json` をコピーする回避策（`/Users/oekazuma/.claude/projects/-Users-oekazuma-localRepo-kakikaki/memory/kakikaki-worktree-build.md`）を試し、それでも駄目なら報告。
- preload を足すと preview のコンソールに CSP 違反が出る（`font-src` の設定が想定と違う）。
- `c.add` の型が `Request` を受け付けない等で svelte-check が落ちる（`lib="webworker"` の型は `:4` で読んでいるはず。落ちたら報告）。

## Maintenance notes

- 姉妹アプリ側。`oekazuma/hitoiki` の Service Worker にも同じ接頭辞フィルタ（そのアプリのキャッシュ名の接頭辞）が必要。片側だけ直しても、かきかき のキャッシュは hitoiki の activate で消され続ける。この計画の完了報告にその旨を書くこと。
- 新しい `static/` ファイルは自動で precache に入る（`files`）。`reload` 付きなので毎デプロイ取り直される。大きなファイルを足すときはここを思い出す。
- レビューで見る点: `Promise.allSettled` の中で `build` に `reload` が付いていないこと、`stale` が `CACHE` を除外していること。
- 先送り: 認識テンプレートの事前生成（PERF-03）、風船の `left/top` → `transform`（PERF-05、実機計測待ち）、Splash の `inset: -50vmax` 縮小（PERF-06、実機で縁の確認が要る）。
