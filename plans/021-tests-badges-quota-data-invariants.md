# Plan 021: メダル確定・容量超過の巻き戻し・他人の集計・データ不変条件（向き・クイズ・同名語）をテストで固定する

> **Executor instructions**: 上から順に。各ステップの検証を確認してから次へ。STOP 条件に当たったら報告。
> 終わったら `plans/README.md` の行を更新。
>
> **Drift check（最初に実行）**:
> `git diff --stat dbe4daa..HEAD -- src/lib/progress.test.ts src/lib/profiles.test.ts src/lib/photos.test.ts src/lib/quiz.test.ts src/lib/facing.ts src/lib/facing.test.ts src/lib/vite-config.test.ts`
> `src/lib/progress.svelte.ts` / `profiles.svelte.ts` / `photos.svelte.ts` / `quiz.ts` / `badges.ts` の抜粋も「Current state」と見比べ、食い違えば STOP。
> 計画 020 が先に入っていれば `progress.test.ts` / `profiles.test.ts` に差分があるのは想定内（020 の追加テストがあるだけ）。

## Status

- Priority = P1 · Effort = S · Risk = LOW · Depends on = 020（同じテストファイルを触るので後に。020 未実施でも書けるが衝突する） · Category = tests
- Planned at = commit `dbe4daa`, 2026-09-15

## Why this matters

ベースラインは緑（100 件）だが、子どもや保護者が最初に気づく壊れ方のいくつかがテストの外にある。

- **`checkBadges()`**（メダルの確定と `earned` への書き込み、獲得日）を assert するテストが 0 件。二重獲得・別のことばへの誤記録・獲得日のずれは素通りする。
- **容量超過の巻き戻し**（`addProfile` の `pop`、`updateProfile` の復元、`addPhoto` の据え置き）は実際に起きた事象のために書かれたコードなのに、`setItem` が投げる経路を一度も通していない。壊れると「追加できたように見えて再読み込みで消える」。
- **`summaryOf` / 他人の `detailOf`** は削除の最終確認に出す数字なのに、使用中でない人の経路が未検証。
- **`facing.ts`** は id の羅列で、実在確認が無い。出荷後に 2 回直したデータ。
- **よみクイズ**の全形式検証は ja の ふつう 1 本だけ。`kana` は一度も通っていない。
- 前回の索引が「単語を増やしたら足すこと」と書き残した**同名語の不変条件**は、その後 `words.ts` が 5 回変わったのに未消化。
- `/balloon` はリンクされないので `vite.config.ts` の `prerender.entries` の 1 行だけが命綱。

## Current state

`src/lib/progress.svelte.ts:187-191`:

```ts
export function checkBadges(): Badge[] {
  const fresh = earnedBadges(lang.v, stats()).filter((b) => !earned()[b.id]);
  for (const b of fresh) earn(b.id);
  return fresh;
}
```

`:101-104` `earn(id)` は `data[lang.v].earned[id] = today()`。`:59` `earned()` は現在の言語の `earned`。
`:128-130` `stats()` は `secretStats(profiles.cur)`（`secret.ts` の `secretOf` + `balloon.svelte.ts` の `loadBests`）も混ぜる。
`src/lib/badges.ts:114` `first-char`（もじを 1 つクリア）、`:195` `balloon-found`（`s.balloons >= 1`、`secret: true`）。

`src/lib/progress.test.ts`（130 行）: `beforeEach` で 3 ことば を `reset()`（`:25-33`）。`detailOf` のテスト（`:83-106`）が `vi.useFakeTimers()` + `vi.setSystemTime(new Date(2026, 8, 14, 10))` の形。`checkBadges` / `stats` / `summaryOf` の呼び出しは 0 件。

`src/lib/profiles.svelte.ts:59-80`:

```ts
export function addProfile(name: string, avatar = DEFAULT_AVATAR, lang: Lang = 'ja'): Profile | null {
  if (profiles.list.length >= MAX_PROFILES) return null;
  ...
  profiles.list.push(p);
  if (!save()) {
    profiles.list.pop();
    return null;
  }
  return p;
}
export function updateProfile(id: string, patch: Partial<Omit<Profile, 'id'>>): boolean {
  ...
  if (save()) return true;
  Object.assign(p, before);
  return false;
}
```

`src/lib/photos.svelte.ts:10-14` `save(next)` は `saveJSON` が false なら `photos.list` を変えない。
`src/lib/storage.ts:18-25` `saveJSON` は `store()?.setItem` を try/catch。
`src/lib/profiles.test.ts` は `fresh()`（`vi.resetModules()` + 動的 import、`:3-12`）で毎回モジュールを読み直す。`photos.test.ts` も同じ `fresh()`。

`src/lib/progress.svelte.ts:147-184`: `detailOf(pid, l)` は `loadOf(pid, l)`（保存値を直接読む）から集計、`summaryOf(pid, l)` は `detailOf` の 7 項目。`weakOf` のテストは `:80`（`p1` のみ）。

`src/lib/facing.ts:2-28`: `const LEFT = new Set([...22 id...])`、`const RIGHT = new Set(['kangaroo'])`（どちらも export されていない）、`export const flipFor`。
`src/lib/words.ts` の `WORDS`（id・name・en・category）、`src/lib/lang.svelte.ts:44` `nameOf(w, l)`。

`src/lib/quiz.test.ts:23-48`: `makeReadQuiz('ja', 2, 10, seeded())` で 5 形式の性質を全部検証。`:7-10` の `seeded` は決定的乱数。`LANGS` は `lang.svelte.ts:9`。

`vite.config.ts:34`: `prerender: { entries: ['*', '/balloon'] },`。

## Commands you will need

| Purpose | Command                                                                                                                                                                 | Expected |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 単体    | `pnpm exec vitest run src/lib/progress.test.ts src/lib/profiles.test.ts src/lib/photos.test.ts src/lib/quiz.test.ts src/lib/facing.test.ts src/lib/vite-config.test.ts` | all pass |
| 一括    | `pnpm verify`                                                                                                                                                           | exit 0   |

## Scope

**In scope**:

- `src/lib/progress.test.ts`、`src/lib/profiles.test.ts`、`src/lib/photos.test.ts`、`src/lib/quiz.test.ts`
- `src/lib/facing.ts`（`LEFT` / `RIGHT` に `export` を足すだけ）、`src/lib/facing.test.ts`（新規）
- `src/lib/vite-config.test.ts`（新規。`vite.config.ts` をテキストとして読む）

**Out of scope**:

- 実装の変更（テストが実装の不具合を見つけたら STOP して報告。ただし Step 6 の同名語チェックが失敗した場合は「現データで衝突あり」として報告し、`words.ts` は触らない）。
- `.svelte` に残る状態機械の抽出（TEST-08。`Canvas` の 4 秒・`Splash` の 1.3 秒は実機調整値なので別計画）。
- `vite.config.ts` を import するテスト（SvelteKit プラグインを読み込むので重い。テキスト検査で足りる）。

## Git workflow

- コミット例: `test: メダルの確定・容量超過の巻き戻し・他人の集計・向きとクイズのデータ不変条件を固定`。push / PR は指示が無い限りしない。

## Steps

### Step 1: `checkBadges` のテスト（`progress.test.ts`）

`describe('progress')` 内に追加。日付は `vi.useFakeTimers()` + `vi.setSystemTime(new Date(2026, 8, 15, 10))` を `try/finally` で（`:83-106` の形）。

1. `あ` を `record` × 3（trace 2 + free 1）→ `checkBadges()` の戻りに `id === 'first-char'` があり、`earned()['first-char'] === '2026-09-15'`。
2. 続けて `checkBadges()` → `[]`（二重獲得しない）。
3. `setLang('en')` → `checkBadges()` の戻りに `first-char` が無く、`earned()` に `first-char` が無い（ja の記録が en に漏れない）。`setLang('ja')` で戻す。
4. `recordBalloon('p1')`（`./secret` から import）→ `checkBadges()` に `balloon-found` が含まれ、`secret === true`。

4 の後に `localStorage.removeItem('kk:secret'); localStorage.removeItem('kk:balloon');` を `finally` に入れる（`beforeEach` の `reset()` は 1 ことば ずつ呼ぶので、計画 020 の後は かくし要素の記録を消さない。順序に依存させない）。

**Verify**: `pnpm exec vitest run src/lib/progress.test.ts` → pass。

### Step 2: 容量超過の巻き戻し（`profiles.test.ts` / `photos.test.ts`）

`profiles.test.ts` に 1 ケース。`fresh()` の後で次を書く。

```ts
const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
  throw new DOMException('quota', 'QuotaExceededError');
});
try {
  expect(m.addProfile('はな')).toBeNull();
  expect(m.profiles.list.length).toBe(1);
  expect(m.updateProfile('p1', { name: 'たろう' })).toBe(false);
  expect(m.current().name).toBe('わたし');
} finally {
  spy.mockRestore();
}
```

`photos.test.ts` に 1 ケース: 同じモックの下で `addPhoto('data:x')` が `false` を返し `photos.list` が `[]` のまま、`removePhoto` も `false`。

**Verify**: `pnpm exec vitest run src/lib/profiles.test.ts src/lib/photos.test.ts` → pass。モックが効かず `addProfile` が非 null を返す場合は STOP（happy-dom の `Storage` 実装が `prototype` 経由でない可能性。その場合は報告）。

### Step 3: 他人の集計（`progress.test.ts`）

`switchProfile` せずに `localStorage.setItem('kk:p2:ja:progress', JSON.stringify({ あ: { trace: 2, free: 1, test: 1 }, い: { trace: 2, free: 1, test: 0 } }))` と `kk:p2:ja:quiz` `{ read1: 3 }` を直接書き、`summaryOf('p2', 'ja')` が `{ chars: 2, gold: 1, quiz: 3 }` を含み（`toMatchObject`）、`summaryOf('p1', 'ja').chars === 0`（混ざらない）。`detailOf('p2', 'ja').rows['あいうえお'] === 2`。

**Verify**: pass。

### Step 4: `facing.ts` の id 実在（新規 `facing.test.ts`）

`facing.ts` の `const LEFT` / `const RIGHT` を `export const` にする（他は変えない）。新規テスト。

```ts
import { describe, it, expect } from 'vitest';
import { LEFT, RIGHT, flipFor } from './facing';
import { WORDS } from './words';

describe('facing', () => {
  it('向きの id は全部 words.ts に実在し、左右に重複が無い', () => {
    const ids = new Set(WORDS.map((w) => w.id));
    for (const id of [...LEFT, ...RIGHT]) expect(ids.has(id), id).toBe(true);
    for (const id of LEFT) expect(RIGHT.has(id), id).toBe(false);
  });
  it('右へ進むとき左向きの絵だけ反転し、正面向きはどちらでもそのまま', () => {
    expect(flipFor('giraffe', 'right')).toBe(true);
    expect(flipFor('giraffe', 'left')).toBe(false);
    expect(flipFor('kangaroo', 'left')).toBe(true);
    expect(flipFor('dog', 'right')).toBe(false);
  });
});
```

**Verify**: pass。

### Step 5: よみクイズを 3 ことば × 3 級で回す（`quiz.test.ts`）

既存の `:23-48` の本体（`for (const q of qs)` のループと `count` の検証）を関数 `checkRead(l, level, qs)` に括り出し（level のチェックは `levelOf(c, l) === level` に一般化）、既存テストはそれを ja/2 で呼ぶ形に。新しいテスト。

```ts
it('3 ことば × 3 級 とも 10 問・3 択・重複なし・正解を含む', () => {
  for (const l of LANGS)
    for (const level of [1, 2, 3] as const)
      for (const seed of [1, 2, 3]) checkRead(l, level, makeReadQuiz(l, level, 10, seeded(seed)));
});
```

`LANGS` は `./lang.svelte` から import。`initial` の頭文字チェックも `lettersOf(…, l)` で行う。
`count` の検証は level 1 だけ緩める。ja / kana の級 1 には 1 文字の語（め・て・は など）があり、`quiz.ts:78` が その `blank` を `word` に変えるため、`{ word: 2, …, blank: 2 }` の等価比較は級 1 で必ず落ちる（既存の `:49-51` がその挙動を検証している）。級 1 では `count.blank <= 2`・`count.word >= 2`・合計 10 を確認し、級 2/3 は既存の等価比較のまま。

**Verify**: pass（27 回のクイズ生成。1 秒以内）。失敗した組み合わせがあれば STOP して報告（出題ロジックの不具合の可能性）。

### Step 6: 同名語の不変条件（`quiz.test.ts`）

```ts
it('表示名が同じ 2 語は同じカテゴリに置かない（よみクイズの選択肢に並ぶと区別できない）', () => {
  for (const l of LANGS) {
    const seen = new Map<string, string>(); // name → category
    for (const w of WORDS) {
      const n = nameOf(w, l);
      const c = seen.get(n);
      if (c !== undefined) expect(c, `${n} (${l})`).not.toBe(w.category);
      seen.set(n, w.category);
    }
  }
});
```

（現データでは `あめ` / `はな` が別カテゴリなので通る。同名語を同カテゴリに足すと落ち、そのとき `pickChoices` 側の対応を考える合図になる。）

**Verify**: pass。

### Step 7: `/balloon` のプリレンダー（新規 `vite-config.test.ts`）

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// かくしゲームはどこからもリンクされないので、この 1 行が消えると GitHub Pages で 404 になる
describe('vite.config.ts', () => {
  it('/balloon をプリレンダー対象に明示している', () => {
    const src = readFileSync(new URL('../../vite.config.ts', import.meta.url), 'utf8');
    expect(src).toMatch(/entries:\s*\[[^\]]*'\/balloon'/);
  });
});
```

**Verify**: pass。

### Step 8: 一括検証

**Verify**: `pnpm verify` → exit 0。テスト件数が 100 + 新規（9〜10 件）になっている。

## Test plan

上の Step 1〜7 がテスト計画そのもの。手本: `progress.test.ts:83-106`（フェイクタイマー）、`profiles.test.ts:3-12`（`fresh()`）、`quiz.test.ts:23-48`（形式検証）、`words.test.ts:17-24`（データ不変条件）。

## Done criteria

- [ ] `pnpm verify` が exit 0
- [ ] `grep -c "checkBadges" src/lib/progress.test.ts` が 1 以上
- [ ] `grep -c "QuotaExceededError" src/lib/profiles.test.ts src/lib/photos.test.ts` が各 1 以上
- [ ] `src/lib/facing.test.ts` と `src/lib/vite-config.test.ts` が存在し pass
- [ ] `grep -n "for (const l of LANGS)" src/lib/quiz.test.ts` が 2 件以上
- [ ] `git status` で in scope 以外の変更が無い
- [ ] `plans/README.md` の 021 の行を更新

## STOP conditions

- どれかのテストが実装の不具合で落ちる（テストを緩めて通さない。落ちたテストと観察を報告）。
- `Storage.prototype.setItem` のモックが効かない（Step 2）。
- `facing.ts` の `LEFT` / `RIGHT` が Set でない・名前が違う。
- `pnpm verify` が worktree で `Tsconfig not found` で落ちる: `/Users/oekazuma/.claude/projects/-Users-oekazuma-localRepo-kakikaki/memory/kakikaki-worktree-build.md` の回避策を試し、駄目なら報告。

## Maintenance notes

- 単語を足すときは Step 5 / 6 が自動で守る。落ちたら `pickChoices` に「表示名が同じ語を選択肢に入れない」フィルタを足す（`quiz.ts:42` の `ok` 引数で表現できる）。
- 新しい `kk:*` の書き込み経路を足したら、Step 2 の形で失敗経路を 1 ケース書く。
- 先送り: `.svelte` に残る状態機械（`Canvas` のタイマー、`WordWithHear` の 10 タップ、`AvatarCrop` の指の追跡、`Splash` の settled）の抽出とテスト。定数は実機調整値なので据え置きが条件。
