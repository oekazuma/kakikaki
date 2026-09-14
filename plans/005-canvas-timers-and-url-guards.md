# Plan 005: 書き取り面のタイマーは再マウントで必ず止まり、URL の `w=` / `level=` が不正でも白い画面にならない

> **Executor instructions**: この計画を上から順に実行する。各ステップの検証コマンドを走らせ、
> 期待結果を確認してから次へ進む。「STOP conditions」に当たったら作業を止めて報告する。
> 終わったら `plans/README.md` の自分の行のステータスを更新する。
>
> **Drift check（最初に実行）**:
> `git diff --stat b611db7..HEAD -- src/lib/components/Canvas.svelte src/routes/practice/+page.svelte src/lib/practice.svelte.ts src/lib/practice.test.ts src/lib/quiz-session.svelte.ts src/lib/quiz-session.test.ts`
> Plan 002 が先に入っていれば `Canvas.svelte` の `down/move/up` に `id` 引数が増えている。それは想定内。
> それ以外に「Current state」と食い違えば STOP。

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none（Plan 002 と同じファイルを触るので、順番に実行する）
- **Category**: bug
- **Planned at**: commit `b611db7`, 2026-09-14

## Why this matters

1. `Canvas.svelte` は最後の画が終わると `setTimeout(() => onDone(t.result()), 400)` を予約するが、
   ハンドルを持たず、`$effect` の cleanup は `idle` タイマーしか止めない。親は `{#key}` で `Canvas` を
   作り直すので、子どもが 400ms 以内に別の文字タブや「やりなおす」を押すと、古い `Canvas` のタイマーが
   新しい状態の `PracticeSession.done()` を呼び、`this.c`（= 新しく選んだ文字）に古いモードの記録が
   `localStorage` へ書かれる。`WriteQuiz.onDone` も同じ形。`shake` / `bounce` のタイマーも同様に生き残る。
2. 練習画面の `?w=char-あ` は `charWord` が無条件に擬似単語を作るため、言語が `en` のときに開くと
   `strokes['あ']` が `undefined` になり `strokes[s.c].length` と `Tracer` のコンストラクタで例外 → `ssr = false`
   でエラー境界も無いので白い画面。ホームで言語を切り替えてからブラウザの「戻る」で到達できる。
3. `levelFromParam('2.5')` は丸めないので `2.5` が `Level` として通り、`wordsOf` が空 → かきクイズが
   問題も終了もない空画面のまま止まる。

## Current state

`src/lib/components/Canvas.svelte:27-32,44-48,74-94`:

```ts
  const t = untrack(() => new Tracer(char, strokes, mode));
  let board = $state<Board>();
  let shake = $state(false);
  let bounce = $state(-1);
  let demo = $state(false);
  let idle: ReturnType<typeof setTimeout> | undefined;
  ...
  $effect(() => {
    if (mode === 'trace') playDemo();
    armIdle();
    return () => clearTimeout(idle);
  });
  ...
  function failed() {
    shake = true;
    setTimeout(() => (shake = false), 300);
    sfx.buu();
    armIdle();
  }
  function completed(i: number, all: boolean) {
    bounce = i;
    setTimeout(() => (bounce = -1), 400);
    sfx.pon();
    for (const p of t.samples[i].filter((_, k) => k % 5 === 0)) {
      const q = board!.toScreen(p);
      fx.burst(q.x, q.y, 3);
    }
    onStroke?.(i);
    if (all) setTimeout(() => onDone(t.result()), 400);
    else {
      if (mode === 'trace') playDemo();
      armIdle();
    }
  }
```

`src/routes/practice/+page.svelte:26-27,43`:

```ts
  const word = $derived(wordById(page.url.searchParams.get('w') ?? '') ?? wordById('patocar')!);
  const strokes = $derived(strokesOf());
  ...
  const total = $derived(strokes[s.c].length);
```

`src/lib/words.ts:243-246`:

```ts
export const charWord = (c: string): Word => ({ id: `char-${c}`, name: c, en: c, category: 'もじ' });

export const wordById = (id: string): Word | undefined =>
  id.startsWith('char-') ? charWord(id.slice(5)) : WORDS.find((w) => w.id === id);
```

`src/lib/quiz-session.svelte.ts:8`:

```ts
export const levelFromParam = (v: string | null): Level => Math.min(3, Math.max(1, Number(v) || 1)) as Level;
```

`src/lib/quiz-session.test.ts:20-22` に `levelFromParam` のテストがある（`'0'` `'9'` `null` などを丸める確認）。
`src/lib/practice.test.ts:1-22` の型（`vi.useFakeTimers()`、`setLang('ja')`、`reset()`）に倣う。

`words.ts` は `$app/*` を import できない（scripts が Node で読む）。単語の妥当性判定は `strokes` を引数で
受ける純粋関数にして `practice.svelte.ts` に置く。

## Commands you will need

| Purpose       | Command                                                                      | Expected on success        |
| ------------- | ---------------------------------------------------------------------------- | -------------------------- |
| Typecheck     | `pnpm check`                                                                 | `0 ERRORS 0 WARNINGS`      |
| 単体          | `pnpm exec vitest run src/lib/practice.test.ts src/lib/quiz-session.test.ts` | all pass                   |
| 全体          | `pnpm test:run`                                                              | all pass                   |
| Lint / Vitals | `pnpm lint && pnpm vitals`                                                   | exit 0 / `Health: 100/100` |

## Scope

**In scope**:

- `src/lib/components/Canvas.svelte`
- `src/lib/practice.svelte.ts`、`src/lib/practice.test.ts`
- `src/routes/practice/+page.svelte`
- `src/lib/quiz-session.svelte.ts`、`src/lib/quiz-session.test.ts`

**Out of scope**:

- `src/lib/words.ts` の `charWord` / `wordById`（scripts と共有する純粋データ層。言語を知らせない）。
- `PracticeSession.done()` の内部タイマー（`flyStar` / `drive` / toast）— 画面遷移後に発火しても状態を書くだけで記録には触れない。
- `Tracer` の判定ロジック。

## Git workflow

- Branch: `advisor/005-canvas-timers-url-guards`
- コミット 2 つ（タイマー／URL ガード）でも 1 つでもよい。例: `fix: 書き取り面の完了タイマーを再マウントで止め、別の文字に記録が付かないように` / `fix: 練習・クイズの URL が不正でも白い画面にせず既定に戻す`。末尾に `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`。

## Steps

### Step 1: `Canvas.svelte` のタイマーを 1 か所で管理して cleanup で止める

`idle` と同じ型の変数を増やす代わりに、予約したタイマーを集めて cleanup で全部止める:

```ts
let idle: ReturnType<typeof setTimeout> | undefined;
// 演出と完了通知のタイマー。{#key} で作り直されたあとに古い方が発火して別の文字に記録を付けないよう、破棄時に全部止める
const timers = new Set<ReturnType<typeof setTimeout>>();
const later = (fn: () => void, ms: number) => {
  const t = setTimeout(() => {
    timers.delete(t);
    fn();
  }, ms);
  timers.add(t);
};
$effect(() => {
  if (mode === 'trace') playDemo();
  armIdle();
  return () => {
    clearTimeout(idle);
    for (const t of timers) clearTimeout(t);
    timers.clear();
  };
});
```

`failed()` の `setTimeout(() => (shake = false), 300)` → `later(() => (shake = false), 300)`、
`completed()` の `setTimeout(() => (bounce = -1), 400)` → `later(...)`、
`setTimeout(() => onDone(t.result()), 400)` → `later(() => onDone(t.result()), 400)`。
`idle`（`armIdle` / 4 秒の自動判定）は `clearTimeout(idle)` で個別に止める現在の仕組みを維持する。

**Verify**: `pnpm check` → `0 ERRORS`。`grep -c "setTimeout(" src/lib/components/Canvas.svelte` が 3（`later` の中・`armIdle`・`up` の自動判定。`ReturnType<typeof setTimeout>` の宣言行は `setTimeout(` に一致しないので数えない）。

### Step 2: 練習画面の単語を、その言語で書けるものに限定する

`src/lib/practice.svelte.ts` に純粋関数を追加:

```ts
// URL の w= から練習する単語を決める。その言語に書き順の無い文字を含む（例: 言語が en のときの char-あ）なら既定の単語に戻す
export function resolveWord(id: string | null, l: Lang): Word {
  const w = id ? wordById(id) : undefined;
  const strokes = strokesOf(l);
  return w && lettersOf(w, l).every((c) => c in strokes) ? w : wordById('patocar')!;
}
```

`import { WORDS, wordById, type Word } from './words';` に `wordById` を、
`import { lettersOf, charsOf, strokesOf, type Lang } from './lang.svelte';` に `strokesOf` と `Lang` を足す。

`src/routes/practice/+page.svelte:26-27` を次に置き換える:

```ts
const word = $derived(resolveWord(page.url.searchParams.get('w'), lang.v));
const strokes = $derived(strokesOf());
```

`wordById` の import が不要になれば消し、`resolveWord` を `$lib/practice.svelte` から import する
（`lang` はすでに import 済み）。

**Verify**: `pnpm check` → `0 ERRORS`。

### Step 3: `levelFromParam` を整数に丸める

```ts
export const levelFromParam = (v: string | null): Level =>
  Math.min(3, Math.max(1, Math.round(Number(v) || 1))) as Level;
```

**Verify**: `pnpm exec vitest run src/lib/quiz-session.test.ts` → 既存 pass。

### Step 4: テストを足す

`src/lib/practice.test.ts` に追加:

```ts
it('resolveWord: その言語に無い文字の単語は既定の単語に戻す', () => {
  expect(resolveWord('bus', 'ja').id).toBe('bus');
  expect(resolveWord('bus', 'en').id).toBe('bus'); // en 名 bus の 3 文字は STROKES_EN にある
  expect(resolveWord('char-あ', 'ja').id).toBe('char-あ');
  expect(resolveWord('char-あ', 'kana').id).toBe('patocar'); // カタカナの文字セットに あ は無い
  expect(resolveWord('char-あ', 'en').id).toBe('patocar');
  expect(resolveWord('nope', 'ja').id).toBe('patocar');
  expect(resolveWord(null, 'ja').id).toBe('patocar');
});
```

（`resolveWord` の import を足す。`beforeEach` の `setLang('ja')` に依存しない。）

`src/lib/quiz-session.test.ts:20-22` の `levelFromParam` テストに `expect(levelFromParam('2.5')).toBe(3);`
と `expect(levelFromParam('1.2')).toBe(1);` を足す。

**Verify**: `pnpm exec vitest run src/lib/practice.test.ts src/lib/quiz-session.test.ts` → all pass。

### Step 5: 全体確認

**Verify**: `pnpm test:run` all pass、`pnpm lint` exit 0、`pnpm vitals` 100、`pnpm build` exit 0。
可能なら `pnpm build && pnpm preview --port 4173` で `http://localhost:4173/kakikaki/practice?w=char-%E3%81%82`
を言語 `en`（`localStorage.setItem('kk:lang','en')` 後にリロード）で開き、白い画面にならず ぱとかー が出ることを見る。

## Test plan

- 新規: `practice.test.ts` の `resolveWord` 1 件、`quiz-session.test.ts` の丸め 2 アサーション。
- タイマーの cleanup は `.svelte` 内なので vitest で直接は検証しない。`Canvas.svelte` から `later` 以外の `setTimeout` が消えていることを grep で確認する。
- 既存 `practice.test.ts` 4 件、`quiz-session.test.ts` 3 件が通る。

## Done criteria

- [ ] `grep -c "setTimeout(" src/lib/components/Canvas.svelte` が 3（`later` 内・`armIdle`・`up` の自動判定）
- [ ] `grep -n "resolveWord" src/routes/practice/+page.svelte` が 2 件（import と使用）
- [ ] `pnpm test:run` 全件 pass（新規を含む）
- [ ] `pnpm check` `0 ERRORS`、`pnpm lint` exit 0、`pnpm vitals` 100
- [ ] In scope 以外に変更なし
- [ ] `plans/README.md` 更新

## STOP conditions

- 「Current state」の抜粋と実物が食い違う（Plan 002 による `id` 引数の追加は除く）。
- `resolveWord` を通しても `strokes[s.c]` が `undefined` になるケースが残る（`resolveWord` と `strokesOf()` が別の言語を見ている等）。
- `practice.test.ts` に `strokes-en` を import すると `words.test.ts` 以外で初めて en データを読むことになるが、これは問題ない。テストが 2 回直しても落ちるなら報告。

## Maintenance notes

- `Canvas` に新しい演出タイマーを足すときは `later()` を使う。生の `setTimeout` はレビューで弾く。
- 別言語の `char-` id を「同じ音のカタカナに置き換える」などの親切は今回やっていない。必要なら `resolveWord` の中で `toKatakana` を使って対応できる。
- かきクイズの `?level=` は 1〜3 の整数だけを受け付ける。新しい級を足すときは `Math.min(3, …)` の上限を変える。
