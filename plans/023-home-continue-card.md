# Plan 023: ホームに「つづきから」の 1 枚を置き、次の未クリア単語へ 1 タップで入れるようにする

> **Executor instructions**: 上から順に。各ステップの検証を確認してから次へ。STOP 条件に当たったら報告。
> 終わったら `plans/README.md` の行を更新。
>
> **Drift check（最初に実行）**:
> `git diff --stat dbe4daa..HEAD -- src/lib/practice.svelte.ts src/lib/practice.test.ts src/routes/+page.svelte src/lib/components/ContinueCard.svelte`
> 差分があれば「Current state」と見比べ、食い違えば STOP（計画 020 が先に入っていれば `practice.svelte.ts` の `nextMode` が `CAP` を使う形になっているのは想定内）。

## Status

- Priority = P2 · Effort = S · Risk = LOW · Depends on = none · Category = direction
- Planned at = commit `dbe4daa`, 2026-09-15

## Why this matters

ホームはカテゴリ 11 × 単語 216 枚の一覧で、前回の続きを示す要素が無い。起動のたびに子どもは（または横につく親は）
どれをやるかを一覧から探す。「次にやる単語」を決める関数 `nextWordId` / `wordDone` は `practice.svelte.ts` に既にあり、
完了モーダルの「つぎの たんご」だけがそれを使っている。同じ判断をホームの 1 枚に出せば、新しい状態は 1 つも増えない。
README は「好きな単語を選んで」を掲げているので一覧は残し、追加の 1 枚に留める（外すのも同じだけ安い）。

## Current state

`src/lib/practice.svelte.ts:64-83`:

```ts
const wordDone = (w: Word) => lettersOf(w).every((ch) => nextMode(ch) === null);

// まだ終わっていない次の単語（同じ並び順で後ろから探し、末尾なら先頭へ）。全部終わっていれば null
export function nextWordId(word: Word): string | null {
  ...
  const k = WORDS.findIndex((w) => w.id === word.id);
  for (let n = 1; n < WORDS.length; n++) {
    const w = WORDS[(k + n) % WORDS.length];
    if (!wordDone(w)) return w.id;
  }
  return null;
}
```

`nextMode`（`:59-62`）は `get(ch)`（`progress.svelte.ts` の `$state`）を読むので、`$derived` から呼べば記録の変化に追従する。

`src/routes/+page.svelte`（194 行。`architecture/component-size` の上限 200 に対し残り 6 行）。

- `:17-19` `const s = $derived(stats()); const total = …; const badgeCount = …;`
- `:66-85`:

```svelte
{#key lang.v}
  <div class="words" in:fly={{ x: 80, duration: 350 }}>
    {#each CATEGORIES as cat (cat)}
      <h2>{cat}</h2>
      <div class="row">
        {#each WORDS.filter((w) => w.category === cat) as w, n (w.id)}
          <WordCard
            word={w}
            size={150}
            lazy={cat !== CATEGORIES[0] || n >= 7}
            onclick={() => {
              unlock();
              goto(practiceUrl(w.id));
            }}
          />
        {/each}
      </div>
    {/each}
  </div>
{/key}
```

- `:118-122` `h2 { font-size: 18px; color: var(--sub); margin: 22px 0 8px; }`、`:182-187` `.row { display: flex; flex-wrap: wrap; gap: 10px; padding: 6px 0 10px; }`。
- `WordCard`（`src/lib/components/WordCard.svelte`）は `word` / `size` / `lazy` / `onclick` を受け、星・王冠も自分で描く。`practiceUrl` は `src/lib/nav.ts:5`、`unlock` は `$lib/audio`。

`src/lib/practice.test.ts:92-106` に `nextMode と nextWordId` のテスト（`clear(c)` ヘルパで文字をクリアする）。

慣習: 子ども向け文言はひらがな。内部リンクは `resolve()` / `practiceUrl`。コンポーネントは 200 行未満。

## Commands you will need

| Purpose | Command                                         | Expected  |
| ------- | ----------------------------------------------- | --------- |
| 単体    | `pnpm exec vitest run src/lib/practice.test.ts` | all pass  |
| vitals  | `pnpm vitals --diff`                            | warning 0 |
| 一括    | `pnpm verify`                                   | exit 0    |

## Scope

**In scope**:

- `src/lib/practice.svelte.ts`（`wordDone` を export し、`nextOpenWord()` を足す）
- `src/lib/practice.test.ts`
- `src/lib/components/ContinueCard.svelte`（新規）
- `src/routes/+page.svelte`（1 行の挿入と import）

**Out of scope**:

- 「最後に練習した単語」の記録（新しい保存値は持たない）。
- 1 文字練習（`char-` 単語）を候補にすること。
- ヘッダー（`nav`）への配置（iPad Pro 12.9 で 1 行に収める調整があり、崩れる）。

## Git workflow

- コミット例: `feat: ホームに「つづきから」の 1 枚。次の未クリア単語へ 1 タップで入れる`。push / PR は指示が無い限りしない。

## Steps

### Step 1: `nextOpenWord()` を足す

`practice.svelte.ts` の `wordDone` を `export const wordDone` にし、その下に次を足す。

```ts
// ホームの「つづきから」: 並び順で最初の未クリア単語。全部終わっていれば null
export const nextOpenWord = (): Word | null => WORDS.find((w) => !wordDone(w)) ?? null;
```

`practice.test.ts` の `nextMode と nextWordId` テストに: 最初は `nextOpenWord()?.id === 'dog'`（`WORDS` の先頭）、`いぬ` の 2 文字を `clear` すると `'cat'`（次の未クリア。`ねこ` が先頭から 2 番目であることは `words.ts` で確認）。

**Verify**: `pnpm exec vitest run src/lib/practice.test.ts` → pass。

### Step 2: `ContinueCard.svelte` を作る

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import WordCard from './WordCard.svelte';
  import { practiceUrl } from '$lib/nav';
  import { nextOpenWord } from '$lib/practice.svelte';
  import { unlock } from '$lib/audio';
  // ホームの先頭: 次の未クリア単語を 1 枚。全部終わっていれば何も出さない
  const next = $derived(nextOpenWord());
</script>

{#if next}
  <h2>つづきから</h2>
  <div class="row">
    <WordCard
      word={next}
      size={150}
      onclick={() => {
        unlock();
        goto(practiceUrl(next.id));
      }}
    />
  </div>
{/if}

<style>
  h2 {
    font-size: 18px;
    color: var(--teal);
    margin: 22px 0 8px;
  }
  .row {
    display: flex;
    padding: 6px 0 10px;
  }
</style>
```

（見出し色を `--teal` にして通常のカテゴリ見出し（`--sub`）と区別する。prettier が `<style>` を整形するので `pnpm format` を掛けてよい。）

**Verify**: `pnpm check` → 0 errors。`pnpm vitals --diff` → warning 0（`<main>` はページ側にある）。

### Step 3: ホームに差し込む

`+page.svelte` の `{#key lang.v}` の直後、`<div class="words" …>` の中の `{#each CATEGORIES …}` の **前** に `<ContinueCard />` を 1 行。`import ContinueCard from '$lib/components/ContinueCard.svelte';` を足す。ページの行数が 200 を超えないことを確認（+2 行で 196）。

**Verify**: `pnpm vitals --diff` → warning 0。`pnpm build && pnpm preview --port 4173` でホームを開き、先頭に「つづきから」といぬ のカードが出て、押すと `/kakikaki/practice?w=dog` に入る。ことばを えいご に切り替えても同じ位置に出る（`{#key lang.v}` の内側なので作り直される）。

### Step 4: 一括検証

**Verify**: `pnpm verify` → exit 0。

## Test plan

- 新規: `practice.test.ts` に `nextOpenWord` の 2 assertion（Step 1）。
- `ContinueCard.svelte` は描画のみ（方針どおり単体テスト無し）。Step 3 の preview 確認が検証。

## Done criteria

- [ ] `pnpm verify` が exit 0
- [ ] `src/lib/components/ContinueCard.svelte` が存在し、`grep -c "ContinueCard" src/routes/+page.svelte` が 2（import と使用）
- [ ] `grep -c "nextOpenWord" src/lib/practice.test.ts` が 1 以上
- [ ] `wc -l src/routes/+page.svelte` が 200 未満
- [ ] `git status` で in scope 以外の変更が無い
- [ ] `plans/README.md` の 023 の行を更新

## STOP conditions

- `+page.svelte` が 200 行を超える（`pnpm vitals` が落ちる）。カードの差し込みを 1 行にしても超えるなら、`h1` 周りのマークアップを別コンポーネントに出す案を報告して止まる。
- `wordDone` / `nextWordId` が「Current state」と一致しない。
- `pnpm build` が worktree で `Tsconfig not found` で落ちる: `/Users/oekazuma/.claude/projects/-Users-oekazuma-localRepo-kakikaki/memory/kakikaki-worktree-build.md` の回避策を試し、駄目なら報告。

## Maintenance notes

- 「並び順で最初の未クリア」は README の「カテゴリは易しい順」に乗った判断。順序を変える（例: 最近やった単語の続き）なら新しい保存値が要るので別計画。
- レビューで見る点: 全単語クリア時に何も出ないこと、`{#key lang.v}` の内側にあること。
- 先送り: 保護者の「苦手な文字」から練習へ飛ぶ導線（DIR-02。人の切り替えを伴うので確認モーダルが要る）。
