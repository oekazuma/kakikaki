# Plan 013: えいご の単語は先頭を大文字で見せ、大文字 26 字が単語とクイズから届くようにする

> **Executor instructions**: 上から順に。検証を確認してから次へ。STOP 条件に当たったら報告。終わったら索引を更新。
>
> **Drift check**: `git diff --stat d0dc711..HEAD -- src/lib/lang.svelte.ts src/lib/words.ts src/lib/words.test.ts src/lib/quiz.test.ts README.md CLAUDE.md`

## Status

- **Priority**: P1 · **Effort**: S · **Risk**: LOW-MED（既存の小文字の記録は大文字に引き継がれない。履歴が 1 日分の今が最も安い） · **Depends on**: none · **Category**: direction
- **Planned at**: commit `d0dc711`, 2026-09-14

## Why this matters

214 語の `en` 名はすべて小文字なので、`CHARS_EN` 52 字のうち大文字 26 字は単語にもよみクイズの穴埋めにも一度も出ない。
大文字の行メダル 4 つと `chars-all` / `gold-all` は `/chars` のマス目を 26 回こなさないと取れない。
絵本や看板で子どもが先に出会うのは大文字なので、単語名を Dog のように先頭だけ大文字で見せると、大文字は「単語の 1 文字目」として自然に練習に入る。
先頭文字の分布を数えると、これで届かない大文字は Q と X だけなので、くいず（quiz）と れんとげん（x-ray）を足して全 52 字を単語から届くようにする。

## Current state

`src/lib/lang.svelte.ts:35-48`:

```ts
export const nameOf = (w: Word, l: Lang = lang.v) => (l === 'ja' ? w.name : l === 'kana' ? toKatakana(w.name) : w.en);
...
export const subOf = (w: Word, l: Lang = lang.v): string[] =>
  w.name === w.en
    ? []
    : l === 'ja'
      ? [toKatakana(w.name), w.en]
      : l === 'kana'
        ? [w.name, w.en]
        : [toKatakana(w.name), w.name];
export const lettersOf = (w: Word, l: Lang = lang.v) => [...nameOf(w, l)].filter((c) => c !== ' ' && c !== '-');
```

`src/lib/words.test.ts:24-25` は `w.en` が `/^[a-z ]+$/` に一致することを assert（データは小文字のまま保ち、表示だけ大文字にする）。
`src/lib/quiz.ts:61-64` の `blankLetters` は正解と同じ大文字小文字の候補から選ぶので、先頭が穴なら大文字の選択肢になる。
`src/lib/words.ts` の `charWord` は `en: c` なので 1 文字練習には影響しない（`char-D` は D のまま）。

## Steps

1. `lang.svelte.ts` に `export const enName = (w: Word) => w.en.charAt(0).toUpperCase() + w.en.slice(1);` を置き、`nameOf` の `w.en` と `subOf` の 2 か所の `w.en` を `enName(w)` にする。`charWord`（`en: c`、1 文字）は `charAt(0).toUpperCase()` で大文字化されてしまうので、`enName` は `w.id.startsWith('char-')` なら `w.en` をそのまま返す（`isCharWord` を import）。
   **Verify**: `pnpm check` 0 errors。
2. 単語を 2 語追加: あそび に `['quiz', 'くいず', '❓', 'quiz']`、からだ に `['x-ray', 'れんとげん', '🩻', 'x-ray']`。`words.test.ts` の正規表現を `/^[a-z -]+$/` に（`lettersOf` はハイフンを除く）。`node scripts/fetch-images.ts` で 2 枚取得。
   **Verify**: `ls static/img/quiz.svg static/img/x-ray.svg`。
3. テスト: `words.test.ts` に「en の全単語の先頭文字を集めると A〜Z の 26 字すべてを含む」と「`nameOf(w, 'en')` は先頭だけ大文字、`nameOf(charWord('d'), 'en')` は d のまま」を追加。`quiz.test.ts` の「英語の穴埋めは大文字小文字を合わせる」は `c === c.toLowerCase()` を assert しているので、「穴が先頭なら全候補が大文字、そうでなければ全候補が小文字」に書き換える。
4. README の 214 → 216（2 か所）。CLAUDE.md「単語を増やす」に「英語名は小文字で書く（表示で先頭だけ大文字になる）」を 1 文。
5. `pnpm verify`、`pnpm build`。preview でホームを えいご にして単語カードが Dog / Police car になること、練習画面の 1 文字目が大文字の書き順になること、よみクイズの穴埋めで先頭が穴のとき大文字の選択肢が出ることを確認。

## Done criteria

- [ ] `grep -n "enName" src/lib/lang.svelte.ts` 3 件以上
- [ ] 新テスト 2 件を含め全 pass、`WORDS.length` 216
- [ ] すべての検証が通る

## STOP conditions

- Twemoji に ❓（2753）か 🩻（1fa7b）の SVG が無い → その語を入れずに報告。
- `recognize.test.ts` の「英語: 同形の字は 2 位でも可」が落ちる（大文字化で認識が変わることは無いはず）。
