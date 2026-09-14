# Plan 003: localStorage の読み書きを 1 か所にまとめ、壊れた保存値でも起動でき、保存失敗で練習画面が固まらない

> **Executor instructions**: この計画を上から順に実行する。各ステップの検証コマンドを走らせ、
> 期待結果を確認してから次へ進む。「STOP conditions」に当たったら作業を止めて報告する。
> 終わったら `plans/README.md` の自分の行のステータスを更新する。
>
> **Drift check（最初に実行）**:
> `git diff --stat b611db7..HEAD -- src/lib/progress.svelte.ts src/lib/profiles.svelte.ts src/lib/photos.svelte.ts src/lib/gate.svelte.ts src/lib/balloon.svelte.ts src/lib/lang.svelte.ts src/lib/progress.test.ts src/lib/profiles.test.ts src/lib/gate.test.ts src/lib/balloon.test.ts`
> 変わっていたら「Current state」の抜粋と実物を見比べ、食い違えば STOP。

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW-MED
- **Depends on**: none
- **Category**: bug（security の可用性面を含む）
- **Planned at**: commit `b611db7`, 2026-09-14

## Why this matters

「localStorage から JSON を読んで fallback する」処理が 5 モジュールに手書きで 5 回ある。`photos` は
`Array.isArray` で形を確認するが、`progress` / `balloon` / `gate` は確認せず、`profiles` は
`list.length` しか見ない。壊れた・古い形の保存値があると、モジュール初期化中（UI が出る前）に例外が
飛んで白い画面になり、リセット UI もアプリの中にあるので保護者は復旧できない。`gate` は `fails` が
数値でないと `locked` が永遠に false になる。`profiles` は `cur` が `list` に無いままでも読み込み、
表示は先頭の人、記録の保存キーは存在しない人、という分裂が起きる。

書き込み側も `profiles` / `photos` は quota 超過を `try/catch` で返すが、`progress.save` は無防備で、
`PracticeSession.done()` は `busy = true` の直後に `record()` を呼ぶため、そこで例外が出ると `busy` を
戻すタイマーが予約されず、練習画面は二度と進まない（発生確率は低いが、起きたら致命的）。

この計画は読み書きを `src/lib/storage.ts` に集約し、各ストアに形の検証（guard）を渡し、`profiles` の
`cur` を修復し、`gate.fails` を数値に限定し、`progress` の保存を `try/catch` で包む。

**方針の決定（実行者は迷わないこと）**: 壊れた `kk:profiles` は従来どおり `migrate()` で `p1` だけの
一覧を作り直す。このとき他の人（`kk:p2:*` など）の記録キーは**削除も復元もしない**（残しておけば手作業で
戻せる）。プロフィール一覧をキーの走査から再構築する機能は作らない。

## Current state

`src/lib/progress.svelte.ts:17-34`:

```ts
const store = () => (typeof localStorage === 'undefined' ? null : localStorage);
const keyOf = (pid: string, l: Lang, name: string) => `kk:${pid}:${l}:${name}`;
const key = (l: Lang, name: string) => keyOf(profiles.cur, l, name);

function loadJSON<T>(k: string, fallback: T): T {
  try {
    return JSON.parse(store()?.getItem(k) ?? 'null') ?? fallback;
  } catch {
    return fallback;
  }
}
const load = (l: Lang): Data => ({
  progress: loadJSON(key(l, 'progress'), {}),
  earned: loadJSON(key(l, 'earned'), {}),
  days: loadJSON(key(l, 'days'), []),
  quiz: loadJSON(key(l, 'quiz'), {})
});
const save = (l: Lang, name: keyof Data) => store()?.setItem(key(l, name), JSON.stringify(data[l][name]));
```

`src/lib/progress.svelte.ts:123-131`（`summaryOf` も `loadJSON` を使う）。

`src/lib/profiles.svelte.ts:10,30-40`:

```ts
const store = () => (typeof localStorage === 'undefined' ? null : localStorage);
...
function load(): Saved {
  try {
    const s = JSON.parse(store()?.getItem(KEY) ?? 'null');
    if (s?.list?.length) return s;
  } catch {
    /* 壊れた保存値は作り直す */
  }
  return migrate();
}

export const profiles = $state<Saved>(load());
```

`src/lib/profiles.svelte.ts:44-52`（書き込みは成功可否を返す）:

```ts
// アバター画像（data URL）が大きいと Safari の 5MB 上限に当たるので、保存失敗は呼び出し側に知らせる
function save(): boolean {
  try {
    store()?.setItem(KEY, JSON.stringify({ list: profiles.list, cur: profiles.cur }));
    return true;
  } catch {
    return false;
  }
}
```

`src/lib/photos.svelte.ts:4-24`（唯一、形を検証している読み手）:

```ts
const store = () => (typeof localStorage === 'undefined' ? null : localStorage);

const load = (): string[] => {
  try {
    const v = JSON.parse(store()?.getItem(KEY) ?? 'null');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
export const photos = $state<{ list: string[] }>({ list: load() });

function save(next: string[]): boolean {
  try {
    store()?.setItem(KEY, JSON.stringify(next));
    photos.list = next;
    return true;
  } catch {
    return false; // 容量超過。一覧は変えない
  }
}
```

`src/lib/gate.svelte.ts:14-26`:

```ts
  constructor(
    rnd = Math.random,
    private store: Pick<Storage, 'getItem' | 'setItem'> = localStorage
  ) {
    this.a = Math.floor(rnd() * 7) + 3;
    this.b = Math.floor(rnd() * 7) + 3;
    try {
      const g = JSON.parse(store.getItem(KEY) ?? 'null');
      if (g?.date === today()) this.fails = g.fails;
    } catch {
      /* 壊れた保存値は 0 回扱い */
    }
  }
```

`src/lib/balloon.svelte.ts:86-93`:

```ts
const store = () => (typeof localStorage === 'undefined' ? null : localStorage);
export function loadBests(): Record<string, Best> {
  try {
    return JSON.parse(store()?.getItem(KEY) ?? 'null') ?? {};
  } catch {
    return {};
  }
}
```

`src/lib/lang.svelte.ts:10-19`（`store()` の 5 つ目のコピー。値は JSON でなく生文字列）。

`src/lib/practice.svelte.ts:150-154`:

```ts
this.busy = true;
const c = this.c;
const wasC = charCleared(c),
  wasW = wordStar(this.word);
record(c, r.mode);
```

テストの型: `src/lib/profiles.test.ts:3-12` は `vi.resetModules()` + 動的 import で「モジュール初期化時に
移行が走る」ストアを毎回読み直す（`photos.test.ts:3-6` も同じ）。`gate.test.ts:24-29` は壊れた保存値の
テストがすでにある。`balloon.test.ts:6` は `beforeEach(() => localStorage.clear())`。

規約: `words.ts` / `chars.ts` は `$app/*` を import しない（新モジュール `storage.ts` も `$app/*` に依存させない）。
コメントは WHY のみ。`typeof localStorage === 'undefined'` のガードはそのまま残す（外すのは別判断）。

## Commands you will need

| Purpose   | Command                                                                                                                                      | Expected on success   |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Typecheck | `pnpm check`                                                                                                                                 | `0 ERRORS 0 WARNINGS` |
| 単体      | `pnpm exec vitest run src/lib/progress.test.ts src/lib/profiles.test.ts src/lib/gate.test.ts src/lib/balloon.test.ts src/lib/photos.test.ts` | all pass              |
| 全体      | `pnpm test:run`                                                                                                                              | all pass              |
| Lint      | `pnpm lint`                                                                                                                                  | exit 0                |
| Vitals    | `pnpm vitals`                                                                                                                                | `Health: 100/100`     |

## Scope

**In scope**:

- `src/lib/storage.ts`（新規）
- `src/lib/progress.svelte.ts`、`profiles.svelte.ts`、`photos.svelte.ts`、`gate.svelte.ts`、`balloon.svelte.ts`、`lang.svelte.ts`
- `src/lib/progress.test.ts`、`profiles.test.ts`、`gate.test.ts`、`balloon.test.ts`（追加のみ）

**Out of scope**:

- `keyOf` / `DATA_NAMES` の重複解消と `kk:balloon` の取り残し — Plan 004。
- `migrate()` の移行ロジック自体（`kk:progress` → `kk:p1:*`）。動いており、テストもある。
- `practice.svelte.ts` — `record()` が例外を投げなくなるので変更不要。
- `$app/*` に依存する箇所、Service Worker。

## Git workflow

- Branch: `advisor/003-storage-hardening`
- コミット 1〜2 つ。例: `fix: localStorage の読み書きを storage.ts に集約し、壊れた保存値でも起動し、保存失敗でも練習が止まらないように`。末尾に `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`。

## Steps

### Step 1: `src/lib/storage.ts` を作る

```ts
// localStorage 直結ストアの共通部分。壊れた・古い形の保存値で起動が止まらないよう、読むときは形を確かめる
const store = () => (typeof localStorage === 'undefined' ? null : localStorage);

export const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

// ok は形の確認だけ（型述語にすると isObject のような粗い guard で T が狭く推論されて型エラーになる）
export function loadJSON<T>(key: string, fallback: T, ok: (v: unknown) => boolean): T {
  try {
    const v: unknown = JSON.parse(store()?.getItem(key) ?? 'null');
    return ok(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

// Safari の約 5MB 上限などで失敗したら false（呼び出し側が知らせるか、黙って続ける）
export function saveJSON(key: string, value: unknown): boolean {
  try {
    store()?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const getRaw = (key: string) => store()?.getItem(key) ?? null;
export const setRaw = (key: string, value: string) => {
  try {
    store()?.setItem(key, value);
  } catch {
    /* 容量超過は無視（言語などの小さな値なので次回の保存で追いつく） */
  }
};
export const removeKey = (key: string) => store()?.removeItem(key);
```

**Verify**: `pnpm check` → `0 ERRORS`。

### Step 2: `progress.svelte.ts` を移す

- `store` / `loadJSON` の定義を消し、`import { isObject, loadJSON, saveJSON, removeKey } from './storage';` にする。
- `load` の guard: `progress` と `earned` と `quiz` は `isObject`、`days` は
  `(v) => Array.isArray(v) && v.every((d) => typeof d === 'string')`。型引数は明示する
  （`loadJSON<Record<string, CharProgress>>(key(l, 'progress'), {}, isObject)` のように。`ok` は boolean を返すだけなので推論されない）。
- `save` は `saveJSON(key(l, name), data[l][name])`（戻り値は捨てる。記録の保存失敗は子どもに見せない）。
- `resetRecords` の `store()?.removeItem(...)` は `removeKey(...)`。
- `summaryOf` の `loadJSON<...>(k, {})` 呼び出しにも第 3 引数の guard を渡す（既存の明示的な型引数はそのまま）。

**Verify**: `pnpm exec vitest run src/lib/progress.test.ts` → pass。

### Step 3: `profiles.svelte.ts` を移し、`cur` を修復する

- `store` を消し、`getRaw` / `setRaw` / `saveJSON` / `removeKey` / `loadJSON` / `isObject` を import。`move()` と `migrate()` の `store()?.getItem/setItem/removeItem` はそれぞれ `getRaw` / `setRaw` / `removeKey` に。
- `Profile` の guard を書く:

```ts
const isProfile = (v: unknown): v is Profile =>
  isObject(v) &&
  typeof v.id === 'string' &&
  typeof v.name === 'string' &&
  typeof v.avatar === 'string' &&
  LANGS.includes(v.lang as Lang);
```

- `load()` を置き換える。壊れていれば `migrate()`（方針どおり他の人の記録キーには触れない）。`cur` が一覧に無ければ先頭の人にする:

```ts
function load(): Saved {
  const s = loadJSON<{ list: unknown[]; cur: unknown }>(
    KEY,
    { list: [], cur: '' },
    (v) => isObject(v) && Array.isArray(v.list)
  );
  const list = s.list.filter(isProfile);
  if (list.length === 0) return migrate();
  const cur = list.some((p) => p.id === s.cur) ? (s.cur as string) : list[0].id;
  return { list, cur };
}
```

- `save()` は `return saveJSON(KEY, { list: profiles.list, cur: profiles.cur });`。

**Verify**: `pnpm exec vitest run src/lib/profiles.test.ts` → 既存 3 件 pass。

### Step 4: `photos` / `balloon` / `gate` / `lang` を移す

- `photos.svelte.ts`: `load` を `loadJSON<string[]>(KEY, [], (v) => Array.isArray(v) && v.every((p) => typeof p === 'string'))`、`save` の `setItem` を `saveJSON` に（失敗時に `photos.list` を変えない現在の順序を保つ: `if (!saveJSON(KEY, next)) return false; photos.list = next; return true;`）。
- `balloon.svelte.ts`: `loadBests` を `loadJSON<Record<string, Best>>(KEY, {}, isObject)`、`saveScore` の `setItem` を `saveJSON`。`store` を消す。
- `gate.svelte.ts`: `this.fails = g.fails` を `if (g?.date === today() && Number.isInteger(g.fails) && g.fails >= 0) this.fails = g.fails;` に。`Gate` はテストのために `store` を注入できる作りなので、`storage.ts` には移さず、この 1 行の検証だけ足す。
- `lang.svelte.ts`: `store` を消し、`getRaw(KEY)` / `setRaw(KEY, v)` に。

**Verify**: `pnpm exec vitest run src/lib/photos.test.ts src/lib/balloon.test.ts src/lib/gate.test.ts` → pass。`grep -rn "typeof localStorage" src/lib` → `src/lib/storage.ts` の 1 件だけ。

### Step 5: 壊れた保存値のテストを足す

`src/lib/profiles.test.ts` に追加（`fresh()` を使う）:

```ts
it('壊れた kk:profiles は作り直し、cur が一覧に無ければ先頭の人にする', async () => {
  localStorage.setItem('kk:profiles', JSON.stringify({ list: 'nope', cur: 'p1' }));
  expect((await fresh()).profiles.list.map((p) => p.id)).toEqual(['p1']);
  localStorage.setItem(
    'kk:profiles',
    JSON.stringify({ list: [{ id: 'p3', name: 'A', avatar: 'cat', lang: 'ja' }, { id: 'x' }], cur: 'p9' })
  );
  const m = await fresh();
  expect([m.profiles.cur, m.profiles.list.length]).toEqual(['p3', 1]);
  m.record('あ', 'trace');
  expect(localStorage.getItem('kk:p3:ja:progress')).toContain('"trace":1');
});
```

`src/lib/progress.test.ts` に追加（`vi.resetModules()` は不要。`switchProfile` で読み直せる）:

```ts
it('壊れた記録の保存値は空として読む', async () => {
  localStorage.setItem('kk:p1:ja:days', '"x"');
  localStorage.setItem('kk:p1:ja:progress', '[1,2]');
  const { switchProfile, days } = await import('./progress.svelte');
  switchProfile('p1');
  expect([days(), get('あ')]).toEqual([[], { trace: 0, free: 0, test: 0 }]);
  record('あ', 'trace');
  expect(days().length).toBe(1);
});
```

`src/lib/gate.test.ts` の「日付が違う保存値は無視する」に追記（`today` は `./progress.svelte` から import する。
`toISOString` は UTC なので使わない）:

```ts
localStorage.setItem('kk:gate', JSON.stringify({ date: today(), fails: 'abc' }));
expect(new Gate().fails).toBe(0);
```

`src/lib/balloon.test.ts` に追加:

```ts
it('壊れた kk:balloon は空として読む', () => {
  localStorage.setItem('kk:balloon', '[]');
  expect(loadBests()).toEqual({});
  localStorage.setItem('kk:balloon', '{');
  expect(loadBests()).toEqual({});
});
```

**Verify**: `pnpm test:run` → all pass（73 件前後）。

### Step 6: 全体確認

**Verify**: `pnpm check` `0 ERRORS`、`pnpm lint` exit 0、`pnpm vitals` 100、`pnpm build` exit 0。

## Test plan

- 新規 4 件（Step 5）: 壊れた `kk:profiles`（型違い・要素不正・`cur` 不整合）、壊れた記録キー、数値でない `gate.fails`、配列の `kk:balloon`。
- 既存: `profiles.test.ts`（移行・切替・削除）、`progress.test.ts`、`photos.test.ts`、`gate.test.ts`、`balloon.test.ts` がそのまま通ること = 振る舞いが変わっていない証拠。
- 型パターンは `profiles.test.ts:3-12` の `fresh()` に倣う。

## Done criteria

- [ ] `src/lib/storage.ts` が存在し、`grep -rn "typeof localStorage" src/lib` が `storage.ts` の 1 件のみ
- [ ] `grep -n "JSON.parse" src/lib/*.svelte.ts` が `gate.svelte.ts` の 1 件のみ
- [ ] `pnpm test:run` 全件 pass、新規テスト 4 件を含む
- [ ] `pnpm check` `0 ERRORS`、`pnpm lint` exit 0、`pnpm vitals` 100
- [ ] In scope 以外に変更なし
- [ ] `plans/README.md` 更新

## STOP conditions

- 「Current state」の抜粋と実物が食い違う。
- 既存の `profiles.test.ts` の移行テストが Step 3 で落ちる（`migrate()` の呼び出し条件を変えてしまっている）。
- `storage.ts` を import すると `scripts/*.ts`（`words.ts` / `chars.ts` 経由）が `$app/*` を引き込む — `storage.ts` は `$app/*` を import しないはずなので、起きたら設計が違う。
- `Gate` の `store` 注入と `storage.ts` の両立で迷う → `Gate` は現状の注入方式を維持する（この計画の指示どおり）。

## Maintenance notes

- 新しい保存キーを足すときは `storage.ts` の `loadJSON` に guard を渡す。guard なしの `JSON.parse` をレビューで弾く。
- `saveJSON` の戻り値を無視してよいのは「子どもに見せる価値のない失敗」だけ（記録・言語）。アバター写真のように保存できないことを伝えるべき場所では戻り値を使う（`profiles.save` の既存挙動）。
- Plan 004 は `keyOf` / `DATA_NAMES` をこの計画の後に整理する。
