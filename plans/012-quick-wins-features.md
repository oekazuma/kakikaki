# Plan 012: 「みる」ボタン、そ・ぽ を含む単語、記録のバックアップ（書き出しと読み込み）

> **Executor instructions**: 上から順に。STOP 条件に当たったら報告。
>
> **Drift check**: `git diff --stat 948551a..HEAD -- src/lib/components/Canvas.svelte src/routes/practice/+page.svelte src/lib/words.ts static/img src/lib/components/about src/routes/about/+page.svelte src/lib/progress.svelte.ts README.md CLAUDE.md`

## Status

- **Priority**: P3 · **Effort**: M · **Risk**: LOW〜MED（読み込みは全記録の置き換え） · **Depends on**: 003（`storage.ts`） · **Category**: direction
- **Planned at**: commit `948551a`, 2026-09-14

## Why this matters

- じぶんでかく で書き順を見たい子は 6 秒待つしかない（`Canvas.svelte` の `playDemo` は export されておらず、右カラムに「みる」が無い。初日の設計にはあった）。
- ひらがな そ・ぽ を含む単語が 0 で、`/chars` のマス目でしか練習できずクイズにも出ない。
- 記録は端末の localStorage にだけあり、iOS のサイトデータ削除・端末の初期化・買い替えで全部消える。同期やサーバーは非目標だが、保護者が自分で持つファイルへの書き出しと読み込みはその線を越えない。

## Steps

1. **みる**: `Canvas.svelte` の `playDemo` を `export function playDemo()` にし、`armIdle()` も呼ぶ。`practice/+page.svelte` の右カラムに `<ActionButton icon="eye" label="みる" onclick={() => canvas?.playDemo()} />` を きく の下に足す（`test` モードでは出さない: お手本なしの趣旨）。`Icon` に `eye` があることを確認（`quiz/+page.svelte` で使用済み）。
2. **単語**: `words.ts` に 4 語: しぜん に `['dandelion', 'たんぽぽ', '🌼', 'dandelion']`、みのまわり に `['postbox', 'ぽすと', '📮', 'postbox']`、たべもの に `['french-fries', 'ぽてと', '🍟', 'french fries']`、のりもの に `['sled', 'そり', '🛷', 'sled']`。`node scripts/fetch-images.ts` で Twemoji を取得。`words.test.ts` pass（英語名は `[a-z ]+`）。README / CLAUDE.md の「210」を「214」に。
3. **バックアップ**: `src/lib/backup.ts`（新規、`$app/*` 不要）に
   - `exportAll(): string` — `localStorage` の `kk:` で始まるキーを全部 `{ app: 'kakikaki', version, at: today(), data: Record<string, string> }` にして JSON 文字列に。
   - `parseBackup(text: string): Record<string, string>` — 形を検証し（`app === 'kakikaki'`、`data` がオブジェクトで全キーが `kk:` 始まり・値が文字列）、不正なら `throw`。
   - `importAll(data: Record<string, string>)` — 既存の `kk:` キーを全部消してから入れる（置き換え）。
   - `summarize(data)` — 人数（`kk:profiles` の `list.length`）と記録キー数を返す（確認画面用）。
     `src/lib/backup.test.ts` に「書き出し → 消去 → 読み込みで同じ」「不正な JSON / app 名違い / kk: 以外のキーは throw」。
4. **UI**: `src/lib/components/about/Backup.svelte`（新規、保護者向けなので漢字可、200 行未満）を `/about` の右カラム `AppStatus` の下に置く。
   - 「記録を書き出す」: `exportAll()` を `Blob` にして `<a download="kakikaki-<date>.json">` を生成してクリック（iPad Safari では共有シートかファイルに保存される）。
   - 「記録を読み込む」: `<input type="file" accept="application/json,.json">` → `parseBackup` → 失敗なら赤字で理由 → 成功なら `Gate`（掛け算）→ `summarize` の件数と「いまの記録はすべて置き換わります。元に戻せません」のチェック → `importAll` → `location.reload()`。ゲートと確認は `DangerModal` / `DeleteConfirm` を再利用せず、このコンポーネント内の小さなフォームで済ませる（別の Profile を前提にしていないため）。
   - `Guide.svelte` の「データについて」に 1 行「記録の書き出しと読み込みは右の「バックアップ」から。」を足す。
5. **全体**: `pnpm verify`、`pnpm build`。preview ビルドで書き出し（ダウンロードが発生）と読み込み（不正ファイルの拒否、正しいファイルの置き換え）を確認。

## Done criteria

- [ ] `grep -n "export function playDemo" src/lib/components/Canvas.svelte` 1 件、`grep -n 'label="みる"' src/routes/practice/+page.svelte` 1 件
- [ ] `ls static/img/{dandelion,postbox,french-fries,sled}.svg` が 4 件、`WORDS.length` 214
- [ ] `src/lib/backup.ts` / `backup.test.ts` / `components/about/Backup.svelte` がある
- [ ] すべての検証が通る

## STOP conditions

- Twemoji に該当の絵文字 SVG が無い（404）→ その語は入れずに報告（自作 SVG は対象外）。
- `<a download>` が preview で動かない → 読み込み側だけ入れて書き出しは報告。
