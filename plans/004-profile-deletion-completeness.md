# Plan 004: 人を消すと ふうせん ぽん の自己ベストも消え、記録キーの名前は 1 か所で定義される

> **Executor instructions**: この計画を上から順に実行する。各ステップの検証コマンドを走らせ、
> 期待結果を確認してから次へ進む。「STOP conditions」に当たったら作業を止めて報告する。
> 終わったら `plans/README.md` の自分の行のステータスを更新する。
>
> **Drift check（最初に実行）**:
> `git diff --stat b611db7..HEAD -- src/lib/profiles.svelte.ts src/lib/progress.svelte.ts src/lib/balloon.svelte.ts src/lib/profiles.test.ts src/lib/balloon.test.ts`
> Plan 003 が先に入っている前提なので、`profiles.svelte.ts` / `progress.svelte.ts` / `balloon.svelte.ts` の差分は
> あるはず。その場合は「Current state」の抜粋を Plan 003 適用後の形（`storage.ts` の `loadJSON` / `saveJSON` /
> `removeKey` を使う）に読み替える。それ以外の食い違いは STOP。

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/003-storage-load-save-hardening.md
- **Category**: bug + tech-debt
- **Planned at**: commit `b611db7`, 2026-09-14

## Why this matters

`addProfile` は空いている最小の id（`p1`, `p2`, …）を再利用する。`removeProfile` は
`kk:<pid>:<lang>:{progress,earned,days,quiz}` は消すが、`kk:balloon`（pid → 自己ベスト）には触らない。
そのため、きょうだいを 1 人消して新しい人を追加すると、新しい人の名前で前の人のハイスコアがランキングに出る。
「この人を けす」は保護者に「すべての記録が消えます」と説明しているので、これは約束違反である。

あわせて、記録キーの構成要素（4 つの記録名、`kk:<pid>:<lang>:<name>` の組み立て）が `profiles.svelte.ts` と
`progress.svelte.ts` の 2 か所に別々に書かれている。5 つ目の記録を足すときに片方を忘れると、削除やリセットが
その記録を取り残す。定義を `profiles.svelte.ts`（下位レイヤー。`progress` はすでに `profiles` を import
している）に 1 つにまとめる。

## Current state

`src/lib/profiles.svelte.ts:9,84-91`（Plan 003 適用後は `store()?.removeItem` が `removeKey` になっている）:

```ts
const DATA_NAMES = ['progress', 'earned', 'days', 'quiz'];
...
export function removeProfile(id: string): boolean {
  if (profiles.list.length <= 1 || !byId(id)) return false;
  profiles.list = profiles.list.filter((p) => p.id !== id);
  if (profiles.cur === id) profiles.cur = profiles.list[0].id;
  save();
  for (const l of LANGS) for (const n of DATA_NAMES) store()?.removeItem(`kk:${id}:${l}:${n}`);
  return true;
}
```

`src/lib/profiles.svelte.ts:54-58`（id の再利用）:

```ts
export function addProfile(name: string, avatar = DEFAULT_AVATAR, lang: Lang = 'ja'): Profile | null {
  if (profiles.list.length >= MAX_PROFILES) return null;
  let n = 1;
  while (byId(`p${n}`)) n++;
```

`src/lib/progress.svelte.ts:18-19,47-50,101-107`:

```ts
const keyOf = (pid: string, l: Lang, name: string) => `kk:${pid}:${l}:${name}`;
const key = (l: Lang, name: string) => keyOf(profiles.cur, l, name);
...
export function deleteProfile(id: string) {
  const wasCur = profiles.cur === id;
  if (removeProfile(id) && wasCur) switchProfile(profiles.cur);
}
...
export function resetRecords(pid: string, langs: Lang[]) {
  for (const l of langs) {
    for (const name of ['progress', 'earned', 'days', 'quiz'] as const) store()?.removeItem(keyOf(pid, l, name));
    if (pid === profiles.cur) data[l] = { progress: {}, earned: {}, days: [], quiz: {} };
  }
}
```

`src/lib/balloon.svelte.ts:1,83-101`（`profiles` からは型だけを import している。Plan 003 適用後は
`loadJSON` / `saveJSON` を使う）:

```ts
import type { Profile } from './profiles.svelte';
...
// ランキングは使う人をまたいで 1 つ（kk:balloon = { pid: { score, date } }）
export type Best = { score: number; date: string };
const KEY = 'kk:balloon';
...
export function saveScore(pid: string, score: number, date: string): boolean {
  const all = loadBests();
  if ((all[pid]?.score ?? 0) >= score) return false;
  all[pid] = { score, date };
  store()?.setItem(KEY, JSON.stringify(all));
  return true;
}
```

import の向き（現状、循環なし）: `progress → profiles → lang`、`balloon →(type) profiles`。
`kk:balloon` の削除は **`progress.deleteProfile`** から `balloon.removeBest(pid)` を呼ぶ形にする
（`profiles` から `balloon` を import しない。`progress → balloon` は新しい辺だが循環しない）。

既存テスト: `src/lib/profiles.test.ts:51-75`（削除で記録が消えること）、`src/lib/balloon.test.ts:65-79`
（`saveScore` / `ranking`）。

## Commands you will need

| Purpose       | Command                                                                                          | Expected on success        |
| ------------- | ------------------------------------------------------------------------------------------------ | -------------------------- |
| Typecheck     | `pnpm check`                                                                                     | `0 ERRORS 0 WARNINGS`      |
| 単体          | `pnpm exec vitest run src/lib/profiles.test.ts src/lib/balloon.test.ts src/lib/progress.test.ts` | all pass                   |
| 全体          | `pnpm test:run`                                                                                  | all pass                   |
| Lint / Vitals | `pnpm lint && pnpm vitals`                                                                       | exit 0 / `Health: 100/100` |

## Scope

**In scope**:

- `src/lib/profiles.svelte.ts`、`src/lib/progress.svelte.ts`、`src/lib/balloon.svelte.ts`
- `src/lib/profiles.test.ts`（追加のみ）

**Out of scope**:

- id を再利用しない設計への変更（`p11` 以降を振る等）— 取り残しを消せば十分で、既存の保存データとの互換も保てる。
- `kk:photos`（使う人をまたいで共有するのが仕様）。
- `resetRecords`（ことばの記録リセット）で `kk:balloon` を消すこと — 風船の記録はことばに属さないので消さない。

## Git workflow

- Branch: `advisor/004-profile-deletion-completeness`
- コミット 1 つ。例: `fix: 人を消すと ふうせん ぽん の自己ベストも消え、記録キー名の定義を profiles に一本化`。末尾に `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`。

## Steps

### Step 1: `profiles.svelte.ts` からキー定義を export する

```ts
// 人と言語ごとの記録。名前を足すときはここだけ増やす（削除・リセット・移行がすべてこの一覧を回る）
export const DATA_NAMES = ['progress', 'earned', 'days', 'quiz'] as const;
export type DataName = (typeof DATA_NAMES)[number];
export const keyOf = (pid: string, l: Lang, name: DataName) => `kk:${pid}:${l}:${name}`;
```

`removeProfile` の `` `kk:${id}:${l}:${n}` `` を `keyOf(id, l, n)` に。`migrate()` の `` `kk:${l}:${n}` → `kk:p1:${l}:${n}` `` の移動先も `keyOf('p1', l, n)` に（移動元の旧キーは旧形式なのでそのまま）。

**Verify**: `pnpm exec vitest run src/lib/profiles.test.ts` → pass。

### Step 2: `progress.svelte.ts` を import に切り替える

- ローカルの `keyOf` を消し、`import { profiles, byId, setCurrent, removeProfile, updateProfile, keyOf, DATA_NAMES } from './profiles.svelte';`。
- `resetRecords` の `['progress', 'earned', 'days', 'quiz'] as const` を `DATA_NAMES` に。
- `load` / `save` / `summaryOf` の `key(l, 'progress')` 等はそのまま（`name` の型が `DataName` に絞られるので `keyof Data` との整合を確認。`Data` のキーと `DATA_NAMES` は同じ 4 つ）。

**Verify**: `pnpm check` → `0 ERRORS`。`pnpm exec vitest run src/lib/progress.test.ts` → pass。

### Step 3: `kk:balloon` の取り残しを消す

`src/lib/balloon.svelte.ts` に追加:

```ts
// 人を消したとき、その人の自己ベストも消す（id は再利用されるので、残すと次の人が引き継いでしまう）
export function removeBest(pid: string) {
  const all = loadBests();
  if (!(pid in all)) return;
  delete all[pid];
  saveJSON(KEY, all);
}
```

（Plan 003 適用前なら `store()?.setItem(KEY, JSON.stringify(all))`。）

`src/lib/progress.svelte.ts` の `deleteProfile`:

```ts
import { removeBest } from './balloon.svelte';
...
export function deleteProfile(id: string) {
  const wasCur = profiles.cur === id;
  if (!removeProfile(id)) return;
  removeBest(id);
  if (wasCur) switchProfile(profiles.cur);
}
```

**Verify**: `pnpm check` → `0 ERRORS`。

### Step 4: テストを足す

`src/lib/profiles.test.ts` に追加（`fresh()` を使う。`balloon.svelte` も動的 import する）:

```ts
it('人を消すと ふうせん ぽん の自己ベストも消え、同じ id の新しい人に引き継がれない', async () => {
  const m = await fresh();
  const b = await import('./balloon.svelte');
  const p2 = m.addProfile('はな')!;
  b.saveScore(p2.id, 120, '2026-09-14');
  b.saveScore('p1', 50, '2026-09-14');
  m.deleteProfile(p2.id);
  expect(b.loadBests()[p2.id]).toBeUndefined();
  expect(b.loadBests().p1.score).toBe(50);
  const p2b = m.addProfile('たろう')!;
  expect(p2b.id).toBe(p2.id); // id は再利用される
  expect(b.ranking(m.profiles.list).map((r) => r.id)).toEqual(['p1']);
});
```

**Verify**: `pnpm exec vitest run src/lib/profiles.test.ts` → 既存 + 1 pass。

### Step 5: 全体確認

**Verify**: `pnpm test:run` all pass、`pnpm lint` exit 0、`pnpm vitals` 100、`pnpm build` exit 0。

## Test plan

- 新規 1 件（Step 4）: 削除で `kk:balloon` から消える／他の人は残る／再利用 id に引き継がれない。
- 既存 `profiles.test.ts:51-75` がそのまま通る = `removeProfile` の記録削除が変わっていない。
- `grep -rn "kk:\${" src/lib` で `` `kk:${...}:${...}:${...}` `` 形の組み立てが `profiles.svelte.ts` の `keyOf` 1 か所だけになる（`migrate` の旧キー `` `kk:${n}` `` / `` `kk:${l}:${n}` `` は旧形式なので残ってよい）。

## Done criteria

- [ ] `grep -rn "'progress', 'earned', 'days', 'quiz'" src/lib` が `profiles.svelte.ts` の 1 件のみ
- [ ] `grep -n "removeBest" src/lib/progress.svelte.ts` が 2 件（import と呼び出し）
- [ ] `pnpm test:run` 全件 pass（新規 1 件を含む）
- [ ] `pnpm check` `0 ERRORS`、`pnpm lint` exit 0、`pnpm vitals` 100
- [ ] In scope 以外に変更なし
- [ ] `plans/README.md` 更新

## STOP conditions

- Plan 003 が未適用（`src/lib/storage.ts` が無い）。その場合は先に 003 を実行する。
- `progress → balloon` の import で循環が検出される（`balloon.svelte.ts` が `progress` を import するようになっていたら設計を報告）。
- `DataName` に絞ると `Data` 型との整合で型エラーが 2 回直しても消えない。

## Maintenance notes

- 人ごとの新しい保存キーを足すときは `DATA_NAMES` に名前を足す。それだけで削除・リセット・移行が対象にする。
- 人をまたぐ保存（`kk:balloon`、`kk:photos`）は `DATA_NAMES` の対象外なので、人を消すときの後始末は `deleteProfile` に個別に書く。次に同種のキーを足すときは `removeBest` と同じ場所に並べる。
