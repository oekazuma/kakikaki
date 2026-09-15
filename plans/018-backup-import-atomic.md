# Plan 018: バックアップの読み込みは途中で失敗しても元の記録を残し、常識外のファイルは弾く

> **Executor instructions**: 上から順に。各ステップの検証を確認してから次へ。STOP 条件に当たったら報告。
> 終わったら `plans/README.md` の行を更新。
>
> **Drift check（最初に実行）**:
> `git diff --stat dbe4daa..HEAD -- src/lib/backup.ts src/lib/backup.test.ts src/lib/components/about/Backup.svelte`
> 差分があれば「Current state」と見比べ、食い違えば STOP。

## Status

- Priority = P1 · Effort = S · Risk = LOW · Depends on = none · Category = bug / security
- Planned at = commit `dbe4daa`, 2026-09-15

## Why this matters

バックアップの読み込みはアプリで唯一の不可逆操作で、保護者が「端末を替えるとき・初期化の前に」使う。
いまの `importAll` は **先に `kk:*` の全キーを消してから** `localStorage.setItem` を裸で回すので、
途中で容量超過（Safari は約 5MB。写真アバターの data URL 入りのバックアップは数 MB になる）が起きると、
端末の記録は消え、バックアップは一部しか入らない状態で止まる。例外は `Backup.svelte` で捕まえていないので
画面は無反応のまま、`location.reload()` にも到達しない。次回起動で `profiles.load()` が壊れた一覧を作り直し、
保護者から見ると「全員の記録と写真が消えた」に見え、戻す手段が無い。

あわせて、ファイルの形の検証がキー接頭辞と値の型だけなので、キー数・総バイト数の上限が無い。
悪意が無くても壊れたファイルで端末の保存領域を埋め尽くせる。

## Current state

`src/lib/backup.ts:18-31`（全文 43 行）。

```ts
// 形が違えば throw（呼び出し側が「読み込めません」と出す）
export function parseBackup(text: string): Backup {
  const v: unknown = JSON.parse(text);
  if (!isObject(v) || v.app !== 'kakikaki' || !isObject(v.data)) throw new Error('backup');
  for (const [k, val] of Object.entries(v.data)) {
    if (!k.startsWith(PREFIX) || typeof val !== 'string') throw new Error('backup');
  }
  return v as Backup;
}

export function importAll(b: Backup) {
  for (const k of keys()) localStorage.removeItem(k);
  for (const [k, v] of Object.entries(b.data)) localStorage.setItem(k, v);
}
```

`src/lib/backup.ts:6` の型: `export type Backup = { app: 'kakikaki'; version: string; at: string; data: Record<string, string> };`
（`version` と `at` は検証していないので、無いファイルでは `summarize(b).at` が `undefined` になり画面に「undefined に書き出し」と出る）。

`src/lib/components/about/Backup.svelte:38-44`:

```ts
function submit(e: SubmitEvent) {
  e.preventDefault();
  if (!pending || !gate) return;
  if (!gate.submit(ans)) return void (ans = '');
  importAll(pending);
  location.reload();
}
```

同 `:12` に `let error = $state('')`、`:35` に読み込み失敗時の文言 `'読み込めませんでした。「記録を書き出す」で保存したファイルを選んでください。'`、`:60` に `{#if error}<p class="err">{error}</p>{/if}` がある。

`src/lib/backup.test.ts`（30 行）は往復の正常系（`:7-22`）と `parseBackup` の形式拒否（`:24-30`）のみ。
`:29` は `{ app: 'kakikaki', version: 'v', at: 'd', data: {} }` を受け付けることを確認している（`version` / `at` を必須にしても通る）。

上限の参考値: `src/lib/profiles.svelte.ts:6` `MAX_PROFILES = 10`、`src/lib/photos.svelte.ts:2` `PHOTOS_MAX = 20`、
記録キーは人 × 3 ことば × 4 種（`profiles.svelte.ts:11` `DATA_NAMES`）= 最大 120 + `kk:profiles` / `kk:photos` / `kk:lang` / `kk:gate` / `kk:secret` / `kk:balloon`。

リポジトリの慣習: `localStorage` へのアクセスは `src/lib/storage.ts` 経由（`loadJSON` / `saveJSON` は try/catch で失敗を `false` に落とす）。
`backup.ts` は `kk:` 接頭辞の全キー列挙が仕事なので直接アクセスが認められている唯一の例外。コメントは非自明な WHY だけ（`CLAUDE.md` 上位の方針）。

## Commands you will need

| Purpose  | Command                                       | Expected on success |
| -------- | --------------------------------------------- | ------------------- |
| 単体     | `pnpm exec vitest run src/lib/backup.test.ts` | all pass            |
| 型検査   | `pnpm check`                                  | 0 errors            |
| 一括検証 | `pnpm verify`                                 | exit 0              |

## Scope

**In scope**:

- `src/lib/backup.ts`
- `src/lib/backup.test.ts`
- `src/lib/components/about/Backup.svelte`

**Out of scope**:

- `src/lib/profiles.svelte.ts` / `photos.svelte.ts` の `load()` 側に上限を足すこと（読み込み時の切り詰めは別の挙動変更。今回はファイルの受け入れ判定だけ）。
- 共有シート（`navigator.share`）での書き出し（`plans/README.md` の方向性 DIR-03。この計画の後に別途）。
- `Backup.svelte` の見た目・文言の全面変更。

## Git workflow

- ブランチは任意（オーナーは `main` へ直接 push する運用）。コミットは `fix: バックアップの読み込みが途中で失敗しても元の記録を残す（全キー退避 → 失敗時に書き戻し）` のように、種別接頭辞 + 日本語の要約 1 行。
- push や PR は指示が無い限りしない。

## Steps

### Step 1: `parseBackup` に `version` / `at` の型と、件数・総バイト数の上限を足す

`src/lib/backup.ts` に定数を置く（値は現実の最大値の数倍。写真 20 枚 × 数十 KB + 記録で 1MB 前後なので、総量 8MB・キー 400 で十分余裕がある）。

```ts
// 常識外のファイルを弾く上限（正規の書き出しは写真込みでも 1〜2MB、キーは 130 個程度）
const MAX_KEYS = 400;
const MAX_BYTES = 8 * 1024 * 1024; // text.length（UTF-16 単位）で比べる。厳密なバイト数ではなく目安の上限
```

`parseBackup` を次の形にする（`throw new Error('backup')` は既存どおり。メッセージで区別する必要は無い）。

```ts
export function parseBackup(text: string): Backup {
  if (text.length > MAX_BYTES) throw new Error('backup');
  const v: unknown = JSON.parse(text);
  if (!isObject(v) || v.app !== 'kakikaki' || !isObject(v.data)) throw new Error('backup');
  if (typeof v.version !== 'string' || typeof v.at !== 'string') throw new Error('backup');
  const entries = Object.entries(v.data);
  if (entries.length > MAX_KEYS) throw new Error('backup');
  for (const [k, val] of entries) {
    if (!k.startsWith(PREFIX) || typeof val !== 'string') throw new Error('backup');
  }
  return v as Backup;
}
```

**Verify**: `pnpm exec vitest run src/lib/backup.test.ts` → 既存 2 件が pass（`:29` は `version` / `at` を持つので通る）。

### Step 2: `importAll` を「退避 → 書き込み → 失敗なら書き戻し」にして成否を返す

```ts
// 途中で容量超過しても記録を失わないよう、いまの kk:* を控えてから置き換え、失敗したら控えを戻す
export function importAll(b: Backup): boolean {
  const before = Object.fromEntries(keys().map((k) => [k, localStorage.getItem(k) ?? '']));
  const replace = (data: Record<string, string>) => {
    for (const k of keys()) localStorage.removeItem(k);
    for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
  };
  try {
    replace(b.data);
    return true;
  } catch {
    try {
      replace(before);
    } catch {
      /* 控えも戻せない = もともと容量が尽きている。これ以上は何もできない */
    }
    return false;
  }
}
```

`before` は直前まで保存できていた量なので、書きかけを消してから戻せば通常は収まる。

**Verify**: `pnpm check` → 0 errors（戻り値の型が変わるので `Backup.svelte` 側の警告は出ない。Step 3 で使う）。

### Step 3: `Backup.svelte` が失敗を表示し、成功時だけ再読み込みする

`submit` を次にする。

```ts
function submit(e: SubmitEvent) {
  e.preventDefault();
  if (!pending || !gate) return;
  if (!gate.submit(ans)) return void (ans = '');
  if (importAll(pending)) return location.reload();
  pending = null;
  error = '読み込めませんでした（保存できる容量を超えています）。いまの記録は元のままです。';
}
```

`error` の表示は既存の `:60` がそのまま使える。

**Verify**: `pnpm check` → 0 errors。`pnpm vitals --diff` → warning 0。

### Step 4: テストを足す

`src/lib/backup.test.ts` に以下を追加（既存の `beforeEach(() => localStorage.clear())` の下、同じ `describe` 内）。

1. 途中失敗で元に戻る。`kk:profiles` と `kk:p1:ja:progress` を保存してから、`vi.spyOn(Storage.prototype, 'setItem')` で 2 回目の呼び出しだけ `throw new DOMException('quota', 'QuotaExceededError')` させる（`mockImplementationOnce` を 2 回使い、1 回目は元実装 `Storage.prototype.setItem` を `call` で通す形、または呼び出し回数で分岐する `mockImplementation`）。`importAll(b)` が `false` を返し、`localStorage.getItem('kk:profiles')` と `kk:p1:ja:progress` が元の値のまま、バックアップ側のキー（例: `kk:p9:ja:progress`）は存在しないことを assert。テスト末尾で `vi.restoreAllMocks()`。
2. 成功時は true。既存の往復テストの `importAll(b)` を `expect(importAll(b)).toBe(true)` に変える。
3. 上限。`data` に `kk:x0` … `kk:x400` の 401 キーを入れた JSON → `parseBackup` が throw。`'a'.repeat(8 * 1024 * 1024 + 1)` を含む文字列 → throw（`JSON.parse` の前に長さで弾かれる）。
4. `version` / `at` 必須。`{ app: 'kakikaki', data: {} }` → throw。

`Storage.prototype.setItem` のモックはこのリポジトリで初めてなので、`afterEach(() => vi.restoreAllMocks())` を `describe` に足す。

**Verify**: `pnpm exec vitest run src/lib/backup.test.ts` → 全件 pass（新規 3〜4 件を含む）。

### Step 5: 一括検証

**Verify**: `pnpm verify` → exit 0（lint / check / test:run / vitals）。

## Test plan

- 新規: 上の Step 4 の 4 ケース（`backup.test.ts`）。
- 手本: 同ファイルの往復テスト（`:7-22`）。`Storage.prototype.setItem` のモックは `vi.spyOn` + `mockImplementation`。
- 検証: `pnpm test:run` → 全 pass、`backup.test.ts` は 5〜6 件。

## Done criteria

- [ ] `pnpm verify` が exit 0
- [ ] `grep -n "importAll(pending);" src/lib/components/about/Backup.svelte` が 0 件（戻り値を使う形になっている）
- [ ] `grep -n "MAX_KEYS\|MAX_BYTES" src/lib/backup.ts` が定義と使用の両方でヒット
- [ ] `backup.test.ts` に `QuotaExceededError` を含むテストがあり pass
- [ ] `git status` で in scope 以外の変更が無い
- [ ] `plans/README.md` の 018 の行を更新

## STOP conditions

- `src/lib/backup.ts` の `importAll` / `parseBackup` が「Current state」の抜粋と一致しない。
- `Backup.svelte` に既に `importAll` の戻り値を見る分岐がある（誰かが先に直した）。
- `Storage.prototype.setItem` のモックが happy-dom で効かず、失敗経路のテストが書けない（その場合は `storage.ts` と同様に `localStorage` を薄い関数で包む案を報告して止まる。勝手に構造を変えない）。
- `pnpm verify` の `check` が worktree で `Tsconfig not found` で落ちる: 本体側の `.svelte-kit/tsconfig.json` をコピーする回避策（`/Users/oekazuma/.claude/projects/-Users-oekazuma-localRepo-kakikaki/memory/kakikaki-worktree-build.md`）を試し、それでも駄目なら報告。

## Maintenance notes

- 新しい `kk:*` キーを足しても `backup.ts` の変更は不要（接頭辞で全部拾う）。`MAX_KEYS` は人 10 × ことば 3 × 種類 4 を数倍にした値なので、`DATA_NAMES` が大きく増えたら見直す。
- レビューで見る点: 失敗時に `before` を書き戻す順序（書きかけを消してから戻す）と、`Backup.svelte` が失敗時に `pending` を閉じて `error` を出すこと。
- 先送り: 共有シートでの書き出し（DIR-03）、`summarize` に写真枚数を出すこと。
