# Plan 020: 走る絵の向き・ピンボールの記録・読み上げの点灯・判定の二重実行・クイズの離脱・リセット漏れを直す

> **Executor instructions**: 上から順に。各ステップの検証を確認してから次へ。STOP 条件に当たったら報告。
> 終わったら `plans/README.md` の行を更新。
>
> **Drift check（最初に実行）**:
> `git diff --stat dbe4daa..HEAD -- src/lib/components/DriveBy.svelte src/lib/components/Bouncer.svelte src/lib/audio.ts src/lib/components/WordWithHear.svelte src/lib/components/ReadPrompt.svelte src/routes/quiz/write/+page.svelte src/routes/practice/+page.svelte src/lib/tracer.svelte.ts src/lib/tracer.test.ts src/lib/practice.svelte.ts src/lib/practice.test.ts src/lib/quiz-session.svelte.ts src/lib/quiz-session.test.ts src/routes/quiz/read/+page.svelte src/lib/progress.svelte.ts src/lib/profiles.test.ts src/routes/balloon/+page.svelte`
> 差分があれば「Current state」と見比べ、食い違えば STOP。

## Status

- Priority = P1 · Effort = M（S × 8） · Risk = LOW · Depends on = none · Category = bug
- Planned at = commit `dbe4daa`, 2026-09-15

## Why this matters

どれも 1〜10 行の修正だが、子どもが見る画面で起きる。

1. 単語クリアのお祝いで走る絵（`DriveBy`）だけ `facing.ts` の反転を通っておらず、きりん・ひつじ・やぎ・かば・ぞう・りす など 22 語が**後ろ向きに滑る**。スプラッシュとピンボールは 2 コミット（`98162d0` / `35f3a25`）で直したのに 3 つ目が残っている。
2. ピンボールの壁当て回数は「消える」フレームでしか保存されず、もどる で離れると 100 回当てても記録ゼロ（`pinball-100` / `pinball-200` のメダルが取れない）。
3. 「きく」を押した直後に単語カードのスピーカーを押すと、先に押した方の点灯が永久に消えない（`say()` が中断された古い Promise を解決しない）。
4. おてほんなし の「できた」を 2 回叩くと、同じ線をもう一度照合して不合格が 2 回積まれる。かきクイズでは 2 連打で「お手本を使った」扱いになりその問題が正解に数えられない。練習では「にがてな もじ」の回数が水増しされる。
5. クイズの最終問題に正解した直後に もどる で離れると、900ms / 1400ms 後にホーム画面で紙吹雪とファンファーレが鳴る。
6. 「きろくを リセット」で「すべて」を選んでも かくし要素の記録（`kk:secret` / `kk:balloon`）が残り、実績画面を開いた瞬間にかくしメダルが取り直される。
7. `nextMode` がクリア条件の `2` / `1` を `progress.svelte.ts` の `CAP` と別にリテラルで持っている（計画 010 の取りこぼし。`CAP` を変えると食い違う）。
8. 風船の「+点」表示が連続ヒットで早く消える。ゲーム終了後もランキング表示の裏で rAF が回り続ける。

**設計上の判断（変えない）**: おてほんなし で不合格になった線は消さない。`fd16d59` は「つなげ書き・途中で離す・なぞり直し」でも通るように照合を変えており、足りない画（濁点など）を書き足してから再判定する流れは意図と読める。消したいときは やりなおす がある。ここで直すのは「新しい線を書いていないのに再判定される」ことだけ。

## Current state

### 1. DriveBy

`src/lib/components/DriveBy.svelte:8-17`:

```svelte
<img
  class="drive"
  src={imageUrl(word)}
  alt=""
  width="280"
  height="200"
  loading="eager"
  onerror={onend}
  onanimationend={onend}
/>
```

CSS `:20-33` は `left: -300px` → `left: 110vw`（左から右へ）。
同じ「走る絵」の `SplashRunner.svelte:20` は `style:scale={flipFor(runner.id, 'left') ? '-1 1' : '1 1'}`、
`Bouncer.svelte:66-68` は transform の末尾で `scale(±1, 1)`。`src/lib/facing.ts:28`:
`export const flipFor = (id: string, dir: 'left' | 'right') => (dir === 'right' ? LEFT.has(id) : RIGHT.has(id));`

### 2. Bouncer の記録

`src/lib/components/Bouncer.svelte:23-43`:

```ts
  $effect(() => {
    recordEgg(profiles.cur);
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      b.tick(Math.min(0.05, (t - last) / 1000));
      last = t;
      if (b.hits >= GOAL && !celebrated) { ... }
      if (b.phase === 'done') {
        recordPinball(profiles.cur, b.hits);
        return onend();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });
```

`src/lib/secret.ts:20-21` `recordPinball` は `Math.max` なので何度呼んでも冪等。

### 3. 読み上げ

`src/lib/audio.ts:46-72`:

```ts
// 複数渡すと順番に読む（文字 → 単語 など）。読み終わり（または中断）で resolve
// 新しい say() が古い方を cancel すると古い utterance の onerror が来るが、古い Promise は解決しない
// （呼び出し側の「読んでいる」表示が新しい音声より先に消えないように）
let gen = 0;
export function say(text: string | string[], locale = 'ja-JP'): Promise<void> {
  if (!('speechSynthesis' in window)) return Promise.resolve();
  const me = ++gen;
  speechSynthesis.cancel();
  ...
  return new Promise((done) => {
    const timer = setTimeout(done, 15000); // 端末側でイベントが来ないときの保険
    list.forEach((t, k) => {
      ...
      const finish = () => {
        clearTimeout(timer);
        if (me === gen) done();
      };
      if (k === list.length - 1) u.onend = finish;
      u.onerror = finish; // cancel による中断も含む
      speechSynthesis.speak(u);
    });
  });
}
```

呼び出し側は 4 か所とも同じ形（`speaking = true; await say(...); speaking = false;`）。
`src/lib/components/WordWithHear.svelte:33-37`、`src/lib/components/ReadPrompt.svelte:10-14`、
`src/routes/quiz/write/+page.svelte:35-39`、`src/routes/practice/+page.svelte:37-41`。
`audio.test.ts` は `readingOf` だけを検証（`say` は Web Speech に依存し happy-dom には無いのでテスト外）。

### 4. 判定の二重実行

`src/lib/tracer.svelte.ts:80-87,111-117`:

```ts
  up(id = 0): UpEvent {
    ...
    this.trails.push(this.trail);
    this.trail = [];
    if (this.mode === 'free') { ... }
    return 'drawn';
  }
  // おてほんなし: 書いた画列を全文字のお手本と照合する。何も書いていなければ null
  judge(): Result | null {
    if (this.trails.length === 0) return null;
    const r = recognize(this.trails, templatesFor(this.strokes));
    const mine = r.find((x) => x.char === this.char)!;
    return { mode: 'test', score: testScore(mine.dist), ok: passes(this.char, r), top: r[0].char };
  }
```

`src/lib/components/Canvas.svelte:45-49` `judge()` は `clearTimeout(idle); const r = t.judge(); if (r) onDone(r);`。
`:84-88` の `up()` は `'drawn'` で `onDraw?.()` と 4 秒後の自動 `judge` を仕込む。

`src/lib/practice.svelte.ts:176-182`（不合格分岐は `busy` を立てない）。

```ts
  done(r: Result) {
    if (this.busy) return;
    if (r.mode === 'test' && !r.ok) {
      recordMiss(this.c);
      this.msg = `おしい！ 「${r.top}」に みえるよ。もういちど！`;
      this.fx.buu?.();
      return;
    }
```

`:95` `drawn = $state(false)` は「おてほんなしで 1 画以上書いた」で、練習ページ `:97` の `ready={s.drawn}` に使う。
`src/lib/quiz-session.svelte.ts:121-133` の `WriteQuiz.onDone` も同じ構造（`this.miss++` → `miss >= 2` で trace）。`:83` `drawn = $state(false)`。

`src/lib/tracer.test.ts:95-108`（`describe('Tracer おてほんなし')`）は `judge()` を 1 回ずつしか呼んでいない。テストの補助 `drag(t, pts)` と `strokePts(char, i)` は同ファイル上部にある。

### 5. クイズの離脱

`src/lib/quiz-session.svelte.ts:58-67`（`ReadQuiz.pick`）と `:140-148`（`WriteQuiz.onDone`）は `setTimeout(() => {...}, 900 / 1400)` の id を持たない。
`src/routes/quiz/read/+page.svelte:16-21`、`quiz/write/+page.svelte:19-31` はセッションを `$derived.by` + `untrack` で作るだけで破棄の手当てが無い。
`src/lib/components/QuizHeader.svelte:9` `guard = i > 0 && !done` — 最終問題正解直後は `done` がまだ false なので確認モーダル経由で離脱できる。
参考: `Canvas.svelte:36-43` はタイマーを `Set` に持ち、`$effect` の cleanup で全部止めている。

### 6. リセット

`src/lib/progress.svelte.ts:48-54,115-120`:

```ts
export function deleteProfile(id: string) {
  const wasCur = profiles.cur === id;
  if (!removeProfile(id)) return;
  removeBest(id);
  removeSecret(id);
  if (wasCur) switchProfile(profiles.cur);
}
...
export function resetRecords(pid: string, langs: Lang[]) {
  for (const l of langs) {
    for (const name of DATA_NAMES) removeKey(keyOf(pid, l, name));
    if (pid === profiles.cur) data[l] = { progress: {}, earned: {}, days: [], quiz: {} };
  }
}
```

`LANGS` は `:2` で import 済み。`src/lib/profiles.test.ts:64-72` に `resetRecords('p1', ['ja'])` のテストがある。

### 7. `nextMode`

`src/lib/practice.svelte.ts:59-62`:

```ts
export function nextMode(ch: string): Mode | null {
  const p = get(ch);
  return p.trace < 2 ? 'trace' : p.free < 1 ? 'free' : null;
}
```

`src/lib/progress.svelte.ts:22` `const CAP: Record<Mode, number> = { trace: 2, free: 1, test: 1 };`（export されていない）。

### 8. 風船ページ

`src/routes/balloon/+page.svelte:31-43,64-72`:

```ts
  $effect(() => {
    start();
    let last = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      g.tick(Math.min(0.05, (t - last) / 1000));
      last = t;
      if (g.over && !settled) finish();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });
  ...
  function pop(b: Balloon, e: PointerEvent) {
    ...
    floater = { x: e.clientX, y: e.clientY, pts, id: b.id };
    setTimeout(() => (floater = null), 600);
  }
```

`start()`（`:26-30`）は `isBest = false; settled = false; g.start();`。`Ranking` の もういちど は `onretry={start}`（`:104`）。

## Commands you will need

| Purpose | Command                                                                                                                      | Expected |
| ------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| 単体    | `pnpm exec vitest run src/lib/tracer.test.ts src/lib/practice.test.ts src/lib/quiz-session.test.ts src/lib/profiles.test.ts` | all pass |
| 型検査  | `pnpm check`                                                                                                                 | 0 errors |
| 一括    | `pnpm verify`                                                                                                                | exit 0   |

## Scope

**In scope**: Drift check に列挙した 17 ファイル。

**Out of scope**:

- `src/lib/facing.ts` のデータ（実機で 2 回調整済み。触らない）。
- 不合格時に線を消す変更（上の「設計上の判断」）。
- `DeleteConfirm.svelte` の件数表に かくし要素を足すこと（表示の追加は別件）。
- `Canvas.svelte`（判定の冪等化は `Tracer` 側で閉じる）。

## Git workflow

- 1 項目 1 コミットが読みやすい（例: `fix: 単語クリアで走る絵も facing.ts の向きに合わせて反転する`、`fix: おてほんなし は新しい線を書くまで再判定しない（できた の連打で不合格が積まれていた）`）。push / PR は指示が無い限りしない。

## Steps

### Step 1: DriveBy の反転

`DriveBy.svelte` に `import { flipFor } from '$lib/facing';` を足し、`<img>` に `style:scale={flipFor(word.id, 'right') ? '-1 1' : '1 1'}` を追加（`SplashRunner` と同じ書き方。`DriveBy` は `left` で動かしていて `transform` を使っていないので `scale` プロパティで問題ない）。

**Verify**: `pnpm check` → 0 errors。`grep -n "flipFor" src/lib/components/DriveBy.svelte` → 2 件（import と使用）。

### Step 2: ピンボールの回数を離脱時にも保存

`Bouncer.svelte` の `$effect` の cleanup を `return () => { cancelAnimationFrame(raf); recordPinball(profiles.cur, b.hits); };` にする。`done` 経路の `recordPinball` はそのままでよい（冪等）。ただし `profiles.cur` を cleanup で読むのは追跡外なので問題ない。あわせて `recordEgg(profiles.cur)` を `untrack(() => recordEgg(profiles.cur))` で囲む（`untrack` は `:2` で import 済み。effect の依存に `profiles.cur` を入れない）。

**Verify**: `pnpm check` → 0 errors。

### Step 3: 読み上げの点灯を「自分の世代」で管理する

`src/lib/audio.ts`: `gen` / `me` を消し、`finish` は `clearTimeout(timer); done();` にする。`:46-48` のコメントを「読み終わり（または別の読み上げによる中断）で resolve する。中断された方の Promise も解決するので、呼び出し側は自分が最新かを見て表示を戻す（`speaker`）」に書き換える。そして補助を 1 つ export。

```ts
// 「読んでいる」表示のための補助。同じボタンを二度押したときは古い方の set(false) を捨て、
// 別のボタンに中断されたときは自分の表示を戻す
export function speaker(set: (on: boolean) => void) {
  let gen = 0;
  return async (text: string | string[], locale?: string) => {
    const me = ++gen;
    set(true);
    await say(text, locale);
    if (me === gen) set(false);
  };
}
```

呼び出し側 4 か所を書き換える。例（`WordWithHear.svelte`）。

```ts
  import { say, sfx, unlock } from '$lib/audio';   // → say を speaker に
  let speaking = $state(false);
  const hear = speaker((on) => (speaking = on));
  ...
  <button ... onclick={() => hear(nameOf(word), info().speech)}>
```

`ReadPrompt.svelte`（`hear()` を `() => hear(nameOf(q.answer), info().speech)`）、`quiz/write/+page.svelte`（`nameOf(w.word)`）、`practice/+page.svelte`（`readingOf(s.c)`; `readingOf` の import は残す）も同様。`async function hear()` は消す。

**Verify**: `pnpm check` → 0 errors。`grep -rn "await say(" src` → 0 件（`audio.ts` の `speaker` 内を除く）。`pnpm vitals --diff` → warning 0。

### Step 4: 判定は新しい線を書くまで 1 回だけ

`Tracer` に `private judged = false;` を足し、`up()` の `return 'drawn';` の直前で `this.judged = false;`、`judge()` を次のようにする。

```ts
  // おてほんなし: 書いた画列を全文字のお手本と照合する。何も書いていない・前回の判定から線を足していなければ null
  judge(): Result | null {
    if (this.trails.length === 0 || this.judged) return null;
    this.judged = true;
    ...
```

`PracticeSession.done` の不合格分岐に `this.drawn = false;` を足す（`できた` が次の線まで灰色に戻る。次の `'drawn'` で `onDraw` → `drawn = true`）。`WriteQuiz.onDone` の不合格分岐にも同じく `this.drawn = false;`。

`tracer.test.ts` の `describe('Tracer おてほんなし')` に 1 ケース。

```ts
it('同じ線で二度は判定しない。線を足せばまた判定できる', () => {
  const t = new Tracer('あ', STROKES, 'test');
  drag(t, strokePts('ー', 0));
  expect(t.judge()).not.toBeNull();
  expect(t.judge()).toBeNull();
  drag(t, strokePts('あ', 1));
  expect(t.judge()).not.toBeNull();
});
```

`practice.test.ts` の「完了モーダルから おてほんなし に挑戦」テスト（`:54-78`）の不合格 `s.done({ mode: 'test', ... ok: false ... })` の直後に `expect(s.drawn).toBe(false);` を足す（その前に `s.drawn = true` を置く）。`quiz-session.test.ts:60-63` の 1 回目の不合格の直後にも `expect(w.drawn).toBe(false)`。

**Verify**: `pnpm exec vitest run src/lib/tracer.test.ts src/lib/practice.test.ts src/lib/quiz-session.test.ts` → 全 pass。

### Step 5: クイズのタイマーを離脱で止める

`ReadQuiz` / `WriteQuiz` にそれぞれ `private timer: ReturnType<typeof setTimeout> | undefined;` を足し、`setTimeout(...)` の戻りを `this.timer =` に受ける。`start()` の先頭で `clearTimeout(this.timer)`。両クラスに次を足す。

```ts
  // 画面を離れたら結果の演出と記録は出さない（ホームで紙吹雪が鳴らないように）
  dispose() {
    clearTimeout(this.timer);
  }
```

ページ側（`quiz/read/+page.svelte`、`quiz/write/+page.svelte`）の `<script>` に `$effect(() => { const q = r; return () => q.dispose(); });`（write は `w`）。`$derived.by` で級ごとに作り直されるので、古いセッションの cleanup が走る。

`quiz-session.test.ts` に 1 ケース: `ReadQuiz` で最終問題まで進めて `r.pick(r.q.key)` の直後に `r.dispose()`、`vi.advanceTimersByTime(900)` しても `r.done` が false で `quiz().read1` が増えない。

**Verify**: `pnpm exec vitest run src/lib/quiz-session.test.ts` → pass。`pnpm check` → 0 errors。

### Step 6: 「すべて」のリセットは かくし要素も消す

`resetRecords` の末尾に次を足す。

```ts
// ことばをまたぐ かくし要素の記録は「すべて」のときだけ消す（1 ことば だけのリセットでは残す）
if (langs.length === LANGS.length) {
  removeSecret(pid);
  removeBest(pid);
}
```

`profiles.test.ts` の既存テスト（`:64-72`）の後ろに: `recordPinball('p1', 30)`（`secret.ts` から import）と `b.saveScore('p1', 80, '2026-09-15')`（`b` はこのテストには無いので `const b = await import('./balloon.svelte');` を `:92` と同じ形で足す）→ `m.resetRecords('p1', ['ja'])` では残る → `m.resetRecords('p1', [...m.LANGS])` で `secretOf('p1').pinball === 0` と `loadBests().p1` が undefined。

**Verify**: `pnpm exec vitest run src/lib/profiles.test.ts` → pass。

### Step 7: `nextMode` は `CAP` を使う

`progress.svelte.ts:22` を `export const CAP ...` にし、`practice.svelte.ts` の import に `CAP` を足して `return p.trace < CAP.trace ? 'trace' : p.free < CAP.free ? 'free' : null;`。

**Verify**: `pnpm exec vitest run src/lib/practice.test.ts` → pass。`grep -n "trace < 2\|free < 1" src/lib/practice.svelte.ts` → 0 件。

### Step 8: 風船の +点 と rAF

`balloon/+page.svelte`:

- `pop()` の `setTimeout(() => (floater = null), 600)` を `const id = b.id; setTimeout(() => { if (floater?.id === id) floater = null; }, 600);` にする。
- ループを effect の外に出し、`over` で止める。

```ts
let raf = 0;
let last = 0;
const loop = (t: number) => {
  g.tick(Math.min(0.05, (t - last) / 1000));
  last = t;
  if (g.over) return finish(); // 終了画面では回さない（もういちど で start() が再開する）
  raf = requestAnimationFrame(loop);
};
function start() {
  isBest = false;
  settled = false;
  g.start();
  cancelAnimationFrame(raf);
  last = performance.now();
  raf = requestAnimationFrame(loop);
}
$effect(() => {
  start();
  return () => cancelAnimationFrame(raf);
});
```

`finish()` は `settled` を見なくてよくなるが、`settled` 変数は残しても害は無い（消すなら `:21` のコメントごと）。

**Verify**: `pnpm check` → 0 errors。`pnpm exec vitest run src/lib/balloon.test.ts` → pass（状態機械は触っていない）。

### Step 9: 一括検証

**Verify**: `pnpm verify` → exit 0。

## Test plan

- 新規: `tracer.test.ts` 1（二重判定）、`practice.test.ts` / `quiz-session.test.ts` の `drawn` assertion、`quiz-session.test.ts` 1（`dispose`）、`profiles.test.ts` 1（すべてリセットで かくし も消える）。
- 手本: 各ファイルの既存テスト（フェイクタイマーは `quiz-session.test.ts:13-18` の形）。
- DriveBy / Bouncer / audio / balloon ページは `.svelte` なので単体テスト無し。`pnpm check` と、可能なら preview で「きりん の単語をクリアして右向きに走る」「きく → スピーカー の順に押して両方の点灯が戻る」を目視。

## Done criteria

- [ ] `pnpm verify` が exit 0
- [ ] `grep -rn "await say(" src --include='*.svelte'` が 0 件
- [ ] `grep -n "judged" src/lib/tracer.svelte.ts` が 3 件以上
- [ ] `grep -n "dispose" src/lib/quiz-session.svelte.ts src/routes/quiz/read/+page.svelte src/routes/quiz/write/+page.svelte` が各 1 件以上
- [ ] `grep -n "removeSecret\|removeBest" src/lib/progress.svelte.ts` が `resetRecords` 内にもある
- [ ] `git status` で in scope 以外の変更が無い
- [ ] `plans/README.md` の 020 の行を更新

## STOP conditions

- 「Current state」の抜粋と一致しない箇所がある（特に `audio.ts` の `gen` 構造、`Tracer.judge`）。
- `speaker` に書き換えた後 `pnpm vitals` が `architecture/component-size` で落ちる（どのファイルも 190 行未満なので想定外。落ちたら報告）。
- Step 4 で `tracer.test.ts` の `drag` / `strokePts` が想定と違う形で、テストが書けない。
- `pnpm verify` が worktree で `Tsconfig not found` で落ちる: `/Users/oekazuma/.claude/projects/-Users-oekazuma-localRepo-kakikaki/memory/kakikaki-worktree-build.md` の回避策を試し、駄目なら報告。

## Maintenance notes

- 走る絵を出す 4 つ目のコンポーネントを作るときは `flipFor` を通す（`SplashRunner` / `Bouncer` / `DriveBy` が手本）。
- `say()` を新しい場所で使うときは `speaker()` 経由にする（生の `say` を `await` して `speaking` を戻すと今回の不具合が再発する）。
- `Tracer.judged` は「線を足すまで再判定しない」だけで、線は残す。線を消す仕様に変えるなら `Canvas` の `{#key}` 再マウント（`gen++`）で行う。
- 先送り: `DeleteConfirm` の件数表に かくし要素（風船の自己ベスト・ピンボール最高回数）を出す。`AvatarPicker` の長押し中断で `justHeld` が残る件（CORR-13、実機で再現確認が先）。
