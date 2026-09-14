# Plan 001: 削除・リセットは最終確認の「削除する」を押した瞬間に実行され、シュレッダー演出中に閉じても取り消されない

> **Executor instructions**: この計画を上から順に実行する。各ステップの検証コマンドを走らせ、
> 期待結果を確認してから次へ進む。「STOP conditions」に当たったら作業を止めて報告する（自分で判断して
> 別の方法を試さない）。終わったら `plans/README.md` の自分の行のステータスを更新する
> （レビュアーから「索引は自分が管理する」と言われている場合を除く）。
>
> **Drift check（最初に実行）**:
> `git diff --stat b611db7..HEAD -- src/lib/components/profiles/DangerZone.svelte src/lib/components/profiles/ProfileEditor.svelte src/lib/components/Shredder.svelte`
> 対象ファイルが変わっていたら、下の「Current state」の抜粋と実物を見比べ、食い違えば STOP。

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `b611db7`, 2026-09-14

## Why this matters

「この人を けす」「きろくを リセット」は保護者が掛け算ゲートとチェックボックスを通ってから実行する、
このアプリで唯一のデータ破壊操作である。ところが実際の削除（`deleteProfile` / `resetRecords`）は
シュレッダー演出が 3.2 秒かけて終わったとき（`onend`）にだけ呼ばれる。演出中に画面の暗い部分を
タップすると編集シート全体が閉じ、シュレッダーが unmount されてタイマーが cleanup で消え、
**削除は何も起こらない**。保護者は「消した」と信じて画面を離れる。

さらに編集シート `.sheet` は `position: fixed` に `transform: translate(-50%, -50%)` を併用しており、
CSS の仕様上、その子孫の `position: fixed` 要素（DangerModal・DeleteConfirm・Shredder の全画面 `.dim` /
`.stage`）はビューポートではなくシートを基準に配置される。つまり暗幕も演出もシートの箱の中に閉じ込められ、
シートの外側には編集シート自身の `.dim`（`onclick={onclose}`）が生きたまま残る。これが上の取り消し経路の
原因である。

この計画では (1) 削除を「削除する」ボタンの `onconfirm` で即時実行し、演出は純粋な見せ物にする、
(2) シートの中央寄せを `transform` から `inset: 0; margin: auto` に変えて子孫の `fixed` が
ビューポート基準に戻るようにする。

## Current state

- `src/lib/components/profiles/DangerZone.svelte` — 種類選択 → DangerModal（ことば選択＋掛け算）→ DeleteConfirm（件数＋チェック）→ Shredder → `finish()` の順を管理。
- `src/lib/components/profiles/ProfileEditor.svelte` — 名前・アバター編集のシート。`deleting` が true のとき DangerZone をシートの中に描く。
- `src/lib/components/Shredder.svelte` — 3.2 秒の演出。`$effect` の中で `setTimeout(onend, 3200)`、cleanup で `clearTimeout`。
- `src/lib/components/DeleteConfirm.svelte` — 最終確認。「削除する」で `onconfirm()`。

`src/lib/components/profiles/DangerZone.svelte:17-21`（削除は `onend` からしか呼ばれない）:

```ts
function finish() {
  if (kind === 'person') deleteProfile(id);
  else resetRecords(id, langs);
  ondone();
}
```

`src/lib/components/profiles/DangerZone.svelte:46-56`:

```svelte
{:else if kind && step === 'confirm'}
  <DeleteConfirm
    pid={id}
    mode={kind === 'person' ? 'person' : 'records'}
    {langs}
    onconfirm={() => (step = 'shred')}
    oncancel={() => (step = 'pick')}
  />
{:else if step === 'shred'}
  <Shredder name={p?.name ?? ''} lang={target} onend={finish} />
{/if}
```

`src/lib/components/profiles/ProfileEditor.svelte:25-26,41-43`（シート外の暗幕がいつでも閉じる）:

```svelte
<div class="dim" transition:fade={{ duration: 150 }} role="presentation" onclick={onclose}></div>
<section class="card sheet" transition:scale={{ duration: 200, start: 0.9 }}>
  ...
  {#if deleting && id}
    <DangerZone {id} canDelete={profiles.list.length > 1} ondone={onclose} />
  {/if}
</section>
```

`src/lib/components/profiles/ProfileEditor.svelte:53-65`（`transform` が子孫の fixed の包含ブロックになる）:

```css
.sheet {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(760px, calc(100vw - 60px));
  max-height: calc(100vh - 60px);
  overflow: auto;
  padding: 22px 26px;
  display: grid;
  gap: 16px;
  z-index: 71;
}
```

`src/lib/components/Shredder.svelte:6-9`:

```ts
$effect(() => {
  const t = setTimeout(onend, 3200);
  return () => clearTimeout(t);
});
```

規約（CLAUDE.md より）: `.svelte` は描画とイベント配線だけ。UI 文言は子ども向けひらがな、保護者向け
文言（この削除フロー）は漢字可。コードコメントは非自明な WHY だけ。ブラウザ標準の `confirm` は使わない。
コンポーネントは 200 行未満（svelte-vitals `architecture/component-size`）。

## Commands you will need

| Purpose         | Command                                  | Expected on success                                                     |
| --------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| Install         | `pnpm install --frozen-lockfile`         | exit 0                                                                  |
| Typecheck       | `pnpm check`                             | `0 ERRORS 0 WARNINGS`                                                   |
| Tests           | `pnpm test:run`                          | `Test Files 16 passed`, `Tests 69 passed`（本計画はテストを増やさない） |
| Lint            | `pnpm lint`                              | exit 0                                                                  |
| Vitals          | `pnpm vitals`                            | `Health: 100/100`                                                       |
| Build + preview | `pnpm build && pnpm preview --port 4173` | `http://localhost:4173/kakikaki/` で起動                                |

## Scope

**In scope**（変更してよいファイル）:

- `src/lib/components/profiles/DangerZone.svelte`
- `src/lib/components/profiles/ProfileEditor.svelte`

**Out of scope**（触らない）:

- `src/lib/components/Shredder.svelte`、`DeleteConfirm.svelte`、`DangerModal.svelte` — 演出と確認の中身は正しい。`fixed` の基準が直れば意図どおり全画面になる。
- `src/lib/progress.svelte.ts` の `deleteProfile` / `resetRecords` — 削除ロジック自体に不具合はない（`kk:balloon` の取り残しは Plan 004 が扱う）。
- `Gate` / 掛け算ゲートの仕様。

## Git workflow

- Branch: `advisor/001-delete-at-confirm`
- コミットは 1 つでよい。メッセージは日本語の conventional commits（例: `fix: 削除・リセットは最終確認の「削除する」で即時実行し、演出中に閉じても取り消されないように`）。末尾に `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`。
- 指示がなければ push も PR も作らない。

## Steps

### Step 1: 削除を `onconfirm` で実行し、演出の `onend` は閉じるだけにする

`src/lib/components/profiles/DangerZone.svelte` の `finish()` を 2 つに分ける:

```ts
// 削除は最終確認の「削除する」を押した瞬間に行う。演出は見せるだけで、途中で閉じられても結果は変わらない
function commit() {
  if (kind === 'person') deleteProfile(id);
  else resetRecords(id, langs);
  step = 'shred';
}
```

`DeleteConfirm` の `onconfirm={() => (step = 'shred')}` を `onconfirm={commit}` に、
`Shredder` の `onend={finish}` を `onend={ondone}` にする。`finish` 関数は削除する。

注意: `deleteProfile(id)` の後も Shredder の `name={p?.name ?? ''}` は表示できる（`p` はマウント時に
`untrack(() => byId(id))` で取った参照で、`removeProfile` はリストを `filter` で作り直すだけなので
オブジェクトは生きている）。

**Verify**: `pnpm check` → `0 ERRORS`。`pnpm test:run` → 69 passed。

### Step 2: シートの中央寄せを `transform` からマージンに変える

`src/lib/components/profiles/ProfileEditor.svelte` の `.sheet` を次のようにする（`left`/`top`/`transform` を
`inset`/`margin`/`height` に置き換える。他のプロパティはそのまま）:

```css
.sheet {
  position: fixed;
  inset: 0;
  margin: auto;
  height: fit-content;
  width: min(760px, calc(100vw - 60px));
  max-height: calc(100vh - 60px);
  overflow: auto;
  padding: 22px 26px;
  display: grid;
  gap: 16px;
  z-index: 71;
}
```

`transition:scale` は開閉の 200ms だけインラインの `transform` を当てるので、その間は子孫の
`fixed` がシート基準になるが、削除フローは開いた後に始まるので問題ない。

**Verify**: `pnpm lint` → exit 0。`pnpm vitals` → `Health: 100/100`。

### Step 3: ブラウザで両モードを通す

`pnpm build && pnpm preview --port 4173` を起動し、1180×820 のビューポートで
`http://localhost:4173/kakikaki/profiles` を開く（CLAUDE.md「UI 確認」のとおり、必要なら一時ディレクトリに
Playwright を入れて使う。ブラウザペインで確認できるならそれでもよい）。事前に「ついか する」で 2 人目を
作っておく。

確認すること:

1. 2 人目の鉛筆 → 「けす・リセット」→ 「この人を けす」で開く DangerModal の暗幕が**画面全体**を覆う（シートの箱の中に収まっていない）。
2. 掛け算に答え → チェック → 「削除する」を押した**直後**（演出中）に、画面の暗い部分をタップして閉じる。
3. 閉じた後の一覧からその人が消えている（= 演出中に閉じても削除済み）。`localStorage` の `kk:profiles` の `list` からも消えている（`javascript_tool` か DevTools で `JSON.parse(localStorage.getItem('kk:profiles')).list.map(p=>p.id)`）。
4. 同様に「きろくを リセット」でことばを 1 つ選び、演出中に閉じても `kk:<pid>:<lang>:progress` が `null` になっている。
5. 演出を最後まで見た場合はシートが自動で閉じる（`onend={ondone}`）。

**Verify**: 上の 1〜5 がすべて成立。スクリーンショットを 1 枚残す（全画面の暗幕が写っているもの）。

## Test plan

vitest では CSS の包含ブロックもタイマーの unmount も再現できないため、新規ユニットテストは書かない。
Step 3 の手動ウォークスルーが検証である。既存 69 件が引き続き通ること。

## Done criteria

- [ ] `pnpm check` が `0 ERRORS 0 WARNINGS`
- [ ] `pnpm test:run` が 69 passed
- [ ] `pnpm lint` exit 0、`pnpm vitals` が `Health: 100/100`
- [ ] `grep -n "onend={finish}" src/lib/components/profiles/DangerZone.svelte` が 0 件
- [ ] `grep -n "transform: translate(-50%, -50%)" src/lib/components/profiles/ProfileEditor.svelte` が 0 件
- [ ] Step 3 の 1〜5 を preview ビルドで確認済み
- [ ] `git status` で In scope 以外のファイルに変更がない
- [ ] `plans/README.md` のステータス更新

## STOP conditions

- 「Current state」の抜粋が実物と一致しない。
- ブラウザ（Playwright かブラウザペイン）で preview ビルドを開けず、Step 3 を実行できない → 実装だけ終えて「未確認」と明記して報告する。
- Step 3 の 1 で暗幕が全画面にならない（`inset/margin` の中央寄せが効いていない）→ 2 回直して駄目なら報告。
- `deleteProfile` を先に呼ぶと Shredder の名前が空になる、などマウント時参照の前提が崩れている。

## Maintenance notes

- 以後、破壊的操作の「実行」は演出の完了イベントに紐づけない。演出は結果を見せるだけ、という順序をレビューで確認する。
- `position: fixed` の要素に `transform` を当てると、その子孫の `fixed` はビューポート基準を失う。モーダルを入れ子にするときは中央寄せに `inset: 0; margin: auto` を使う。
- 将来 `ProfileEditor` の `.dim` を「削除フロー中はタップで閉じない」にするのは別判断（今回は対象外）。削除は即時実行になったので、閉じても結果は同じ。
