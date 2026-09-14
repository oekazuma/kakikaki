# Plan 002: 書き取り面は 1 本の指（1 つの pointerId）だけを追い、2 本目の指や手のひらで画がやり直しにならない

> **Executor instructions**: この計画を上から順に実行する。各ステップの検証コマンドを走らせ、
> 期待結果を確認してから次へ進む。「STOP conditions」に当たったら作業を止めて報告する。
> 終わったら `plans/README.md` の自分の行のステータスを更新する。
>
> **Drift check（最初に実行）**:
> `git diff --stat b611db7..HEAD -- src/lib/tracer.svelte.ts src/lib/tracer.test.ts src/lib/components/Board.svelte src/lib/components/Canvas.svelte`
> 変わっていたら「Current state」の抜粋と実物を見比べ、食い違えば STOP。

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `b611db7`, 2026-09-14

## Why this matters

iPad で子どもが書くとき、手のひらや 2 本目の指が盤面に触れるのは日常である。いまの `Board.svelte` は
`pointerdown` / `pointermove` / `pointerup` / `pointercancel` をどの pointerId からでも同じ `Tracer` に
流す。なぞる モードでは 2 本目の指の最初の `pointermove` が線から遠いので `advance()` が `-1` を返し、
`fail()` で描いている画が消えて振動とブザーが鳴る。じぶんでかく / おてほんなし では `down()` が
`this.trail = [p]` で 1 本目の軌跡を無言で捨てる。子どもが間違っていないのに罰される。

判定は `Tracer`（状態機械、vitest で検証）に、描画と配線は `Board` に置く規約に従い、pointerId の
ゲートは `Tracer` に持たせてテストで固定する。

## Current state

- `src/lib/tracer.svelte.ts` — 1 文字ぶんの書き取りの状態機械。`down(p)` / `move(p)` / `up()`。
- `src/lib/components/Board.svelte` — SVG 描画と座標変換。ポインタイベントを `on.down/move/up` に配線。
- `src/lib/components/Canvas.svelte` — `Board` に渡す `down/move/up` を定義し、`Tracer` を呼ぶ。
- `src/lib/tracer.test.ts` — 既存テスト（`drag` ヘルパが `down → move… → up`）。

`src/lib/tracer.svelte.ts:39-49`:

```ts
  // 指を置いた。なぞるでは始点の近くでないと無視する
  down(p: Pt): boolean {
    if (this.finished) return false;
    if (this.mode === 'trace') {
      if (!canStart(this.current, p)) return false;
      this.cursor = 0;
    }
    this.tracing = true;
    this.trail = [p];
    return true;
  }
```

`src/lib/tracer.svelte.ts:51-53,66-68`:

```ts
  move(p: Pt): 'moved' | 'fail' | 'idle' {
    if (!this.tracing) return 'idle';
    ...
  up(): UpEvent {
    if (!this.tracing) return 'idle';
    this.tracing = false;
```

`src/lib/tracer.svelte.ts:84-88`（逸脱時のリセット）:

```ts
  private fail() {
    this.tracing = false;
    this.cursor = 0;
    this.trail = [];
  }
```

`src/lib/components/Board.svelte:16,35-38`:

```ts
    on: { down: (p: Pt) => boolean; move: (p: Pt) => void; up: () => void; demoend: () => void };
```

```svelte
onpointerdown={(e) => on.down(toView(e)) && svg.setPointerCapture(e.pointerId)}
onpointermove={(e) => on.move(toView(e))}
onpointerup={on.up}
onpointercancel={on.up}
```

`src/lib/components/Canvas.svelte:54-73`:

```ts
  function down(p: Pt) {
    unlock();
    demo = false;
    clearTimeout(idle);
    return t.down(p);
  }
  function move(p: Pt) {
    if (t.move(p) === 'fail') failed();
  }
  function up() {
    const i = t.si;
    const ev = t.up();
    ...
```

`src/lib/tracer.test.ts:7-11`（既存ヘルパ。引数なしの呼び出しが動き続ける必要がある）:

```ts
const drag = (t: Tracer, pts: Pt[]) => {
  t.down(pts[0]);
  for (const p of pts) t.move(p);
  return t.up();
};
```

規約: 状態は `*.svelte.ts` のクラスに置き vitest で検証、`.svelte` は配線のみ。コメントは WHY だけ。
既存テストの呼び出し形（`down(p)` / `move(p)` / `up()`）を壊さないため、pointerId は既定値つきの
追加引数にする。

## Commands you will need

| Purpose   | Command                                       | Expected on success            |
| --------- | --------------------------------------------- | ------------------------------ |
| Typecheck | `pnpm check`                                  | `0 ERRORS 0 WARNINGS`          |
| Tests     | `pnpm exec vitest run src/lib/tracer.test.ts` | all pass（既存 7 + 新規 1〜2） |
| All tests | `pnpm test:run`                               | all pass                       |
| Lint      | `pnpm lint`                                   | exit 0                         |
| Vitals    | `pnpm vitals`                                 | `Health: 100/100`              |

## Scope

**In scope**:

- `src/lib/tracer.svelte.ts`
- `src/lib/tracer.test.ts`
- `src/lib/components/Board.svelte`
- `src/lib/components/Canvas.svelte`

**Out of scope**:

- `src/lib/judge.ts`（判定のしきい値 `JUDGE` は実機で調整済み。触らない）
- `src/lib/components/profiles/AvatarCrop.svelte`（独自に 2 本指ピンチを扱っており、別物）
- `Field.svelte`（風船ゲームは 1 タップ 1 風船で、複数指は仕様どおり動く）

## Git workflow

- Branch: `advisor/002-pointer-id-gating`
- コミット 1 つ。例: `fix: 書き取り面は最初に触れた指だけを追い、2 本目の指や手のひらで画がやり直しにならないように`。末尾に `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`。
- push / PR は指示があるときだけ。

## Steps

### Step 1: `Tracer` に pointerId のゲートを足す

`src/lib/tracer.svelte.ts` に非リアクティブなフィールドを追加し、3 メソッドに既定値つきの `id` 引数を足す:

```ts
  // いま追っている指。2 本目の指や手のひらは無視する（1 本目の画を壊さない）
  private pointer: number | null = null;

  down(p: Pt, id = 0): boolean {
    if (this.finished || this.pointer !== null) return false;
    if (this.mode === 'trace') {
      if (!canStart(this.current, p)) return false;
      this.cursor = 0;
    }
    this.pointer = id;
    this.tracing = true;
    this.trail = [p];
    return true;
  }

  move(p: Pt, id = 0): 'moved' | 'fail' | 'idle' {
    if (!this.tracing || id !== this.pointer) return 'idle';
    ...（以降は現状のまま）
  }

  up(id = 0): UpEvent {
    if (!this.tracing || id !== this.pointer) return 'idle';
    this.pointer = null;
    this.tracing = false;
    ...（以降は現状のまま）
  }

  private fail() {
    this.pointer = null;
    this.tracing = false;
    this.cursor = 0;
    this.trail = [];
  }
```

`complete()` は `up()` の中からしか呼ばれず `up()` で `pointer = null` 済みなので変更不要。
`pointer` は `$state` にしない（描画に使わない）。

**Verify**: `pnpm exec vitest run src/lib/tracer.test.ts` → 既存 7 件 pass（既定値 0 で従来どおり）。

### Step 2: テストを追加する

`src/lib/tracer.test.ts` の `describe('Tracer なぞる')` に追加:

```ts
it('2 本目の指は無視され、1 本目の画は続く', () => {
  const t = new Tracer('あ', STROKES, 'trace');
  const pts = strokePts('あ', 0);
  expect(t.down(pts[0], 1)).toBe(true);
  for (const p of pts.slice(0, 5)) t.move(p, 1);
  const cursor = t.cursor;
  expect(t.down({ x: 100, y: 100 }, 2)).toBe(false); // 手のひら
  expect(t.move({ x: 100, y: 100 }, 2)).toBe('idle'); // 線から遠くても fail にならない
  expect(t.up(2)).toBe('idle');
  expect([t.tracing, t.cursor]).toEqual([true, cursor]);
  for (const p of pts.slice(5)) t.move(p, 1);
  expect(t.up(1)).toBe('stroke');
});
```

`describe('Tracer じぶんでかく')` に追加:

```ts
it('じぶんでかく でも 2 本目の指は軌跡を捨てない', () => {
  const t = new Tracer('ー', STROKES, 'free');
  const pts = strokePts('ー', 0);
  t.down(pts[0], 7);
  for (const p of pts.slice(0, 3)) t.move(p, 7);
  expect(t.down({ x: 50, y: 90 }, 8)).toBe(false);
  expect(t.trail.length).toBe(4);
  expect(t.up(8)).toBe('idle');
  expect(t.tracing).toBe(true);
});
```

**Verify**: `pnpm exec vitest run src/lib/tracer.test.ts` → 9 passed。

### Step 3: `Board` と `Canvas` で pointerId を渡す

`src/lib/components/Board.svelte`:

```ts
    on: { down: (p: Pt, id: number) => boolean; move: (p: Pt, id: number) => void; up: (id: number) => void; demoend: () => void };
```

```svelte
onpointerdown={(e) => on.down(toView(e), e.pointerId) && svg.setPointerCapture(e.pointerId)}
onpointermove={(e) => on.move(toView(e), e.pointerId)}
onpointerup={(e) => on.up(e.pointerId)}
onpointercancel={(e) => on.up(e.pointerId)}
```

`src/lib/components/Canvas.svelte` の `down` / `move` / `up` に `id: number` を足して `t.down(p, id)` /
`t.move(p, id)` / `t.up(id)` に渡す。`Board` へ渡す `on={{ down, move, up, ... }}` はそのまま。

**Verify**: `pnpm check` → `0 ERRORS`。`pnpm lint` → exit 0。`pnpm vitals` → 100。

### Step 4: 全体確認

**Verify**: `pnpm test:run` → all pass（71 件）。`pnpm build` → exit 0。

## Test plan

- 新規: `tracer.test.ts` の 2 件（Step 2）。なぞる で 2 本目が `fail` を起こさず 1 本目が完了すること、じぶんでかく で軌跡が捨てられないこと。
- 既存 `tracer.test.ts` 7 件は引数なしのまま通る（既定値 0）。
- 実機の感触（手のひらを置いたまま書く）は保護者が iPad で確認する項目として README の索引に残す。

## Done criteria

- [ ] `pnpm exec vitest run src/lib/tracer.test.ts` が 9 passed
- [ ] `pnpm test:run` が全件 pass
- [ ] `pnpm check` `0 ERRORS`、`pnpm lint` exit 0、`pnpm vitals` 100
- [ ] `grep -n "pointerId" src/lib/components/Board.svelte | wc -l` が 5 以上（down・capture・move・up・cancel）
- [ ] In scope 以外に変更なし（`git status`）
- [ ] `plans/README.md` 更新

## STOP conditions

- 「Current state」の抜粋と実物が食い違う。
- 既存の `tracer.test.ts` が Step 1 の後に落ちる（既定値の設計が壊れている）。
- `Canvas.svelte` の `on` の型を変えると `Board` 以外の呼び出し元が見つかる（現状は `Canvas` だけのはず）。

## Maintenance notes

- `pointercancel` は `up` と同じ経路（じぶんでかく では画として確定する）。この挙動は現状維持で、変えるなら別計画。
- `setPointerCapture` は 1 本目の指だけに掛かる。2 本目の指のイベントも SVG 上なら届くが `Tracer` が無視する。
- 将来 `AvatarCrop` のように 2 本指を使う機能を盤面に足すなら、このゲートを外すのではなく `Tracer` の外で扱う。
