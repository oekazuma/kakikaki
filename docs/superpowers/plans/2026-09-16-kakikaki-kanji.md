# かきかき かんじ 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal** 小学 1〜3 年の漢字 440 字を、ひらがな・かたかな・えいご と並ぶ 4 つ目の ことば `kanji` として足す。

**Architecture** `Lang` に `kanji` を加え、文字セット・書き順・読み上げは既存の `info()` / `strokesOf` / `charsOf` 経由で引く。練習は既存の 1 文字練習（`char-一`）を使い、ホームは学年ごとの字のマス、クイズは読みを使う専用の出題関数、単語系のメダルと表示は `TOTAL(l).words === 0` で隠す。

**Tech Stack** SvelteKit（Svelte 5 runes、TypeScript）、vitest（happy-dom）、KanjiVG、Klee One（pyftsubset）、Playwright（scratchpad）。

**Spec** `docs/superpowers/specs/2026-09-16-kakikaki-kanji-design.md`

## Global Constraints

- UI 文言は子ども向けのひらがな中心。保護者向け画面（`/about` 配下）だけ漢字可。
- 追加ランタイム依存はゼロ。
- コンポーネントは 200 行未満（svelte-vitals `architecture/component-size`、Health 100 を維持）。
- `src/lib/kanji.ts` は `$app/*` を import しない（scripts が Node で直接読む）。
- 内部リンクは `resolve()` か `practiceUrl` で書く。
- コードコメントは非自明な WHY だけ。変更履歴やタスク参照は書かない。
- 紫は使わない。絵文字はメダルの `emoji` 欄以外では使わない。
- Markdown（この計画・CLAUDE.md・README）は textlint フックの対象。太字＋コロンのリスト項目と、コロンで終わる文は書かない。
- 各タスクの最後に `pnpm lint` と `pnpm check` と `pnpm test:run` を通してからコミットする。コミットメッセージの末尾に `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` を付ける。push はしない（ユーザーが指示したときだけ）。
- 作業ディレクトリは `/Users/oekazuma/localRepo/kakikaki/.claude/worktrees/kakikaki-intro-video-21b1a6`。一時ファイルは scratchpad（`/private/tmp/claude-501/-Users-oekazuma-localRepo-kakikaki--claude-worktrees-kakikaki-intro-video-21b1a6/d030e799-1ab2-4f6e-a39c-d2fbdc9d30f6/scratchpad`）に置く。

---

## ファイル構成

新規

- `src/lib/kanji.ts` 学年ごとの字と読み。`KANJI` / `READINGS` / `KANJI_ALL` / `kanjiReading`。
- `src/lib/kanji.test.ts` 字数・読み・重複・書き順の網羅。
- `src/lib/strokes-kanji.ts` KanjiVG から生成（`pnpm strokes`）。
- `src/lib/shuffle.ts` `quiz.ts` から移した `shuffle`。
- `src/lib/quiz-kanji.ts` / `src/lib/quiz-kanji.test.ts` よみ 2 形式・かき 1 形式の出題。
- `src/lib/components/KanjiGrid.svelte` ホームの学年ごとのマス。
- `static/logo-mark-kanji.svg`、`static/fonts/KleeOne-Regular-kanji.woff2`、`static/fonts/KleeOne-SemiBold-kanji.woff2`。

変更

- `src/lib/lang.svelte.ts` `Lang` / `LANGS` / `LANG_INFO` / `nameOf` / `kk:lang`。
- `src/lib/audio.ts` `speechOf(c, l)`。
- `src/lib/progress.svelte.ts` `data` を `LANGS` から作る。
- `src/lib/badges.ts` `ROWS` / `ALL_CHARS` / `TOTAL` / `badgesOf` / `BADGE_GROUPS`。
- `src/lib/quiz.ts` `levelName`、`ReadKind` / `WriteKind` / `WriteQ.accept`、かんじ への委譲。
- `src/lib/quiz-session.svelte.ts` `WriteQuiz.accept`。
- `src/lib/recognize.ts` / `src/lib/tracer.svelte.ts` / `src/lib/components/Canvas.svelte` `passes(targets, …)` と `accept`。
- `src/lib/practice.svelte.ts` `resolveWord` の既定、`starOf` / `crownOf`、`done()` の判定。
- `src/lib/components/CompleteModal.svelte` / `WordCard.svelte` / `WordWithHear.svelte` / `LangToggle.svelte` / `ReadPrompt.svelte` / `ReadQuestion.svelte` / `QuizHeader.svelte` / `QuizResult.svelte` / `DeleteConfirm.svelte`。
- `src/lib/components/trophies/StatTiles.svelte`、`src/lib/components/about/LangOverview.svelte` / `Ring.svelte` / `QuizBars.svelte` / `Guide.svelte`。
- `src/routes/+page.svelte`、`src/routes/chars/+page.svelte`、`src/routes/practice/+page.svelte`、`src/routes/quiz/+page.svelte` / `read/+page.svelte` / `write/+page.svelte`、`src/routes/about/+page.svelte` / `about/progress/+page.svelte`。
- `static/app.css`、`scripts/fetch-strokes.ts`、`scripts/make-icon.ts`、`CLAUDE.md`、`README.md`。
- テスト `src/lib/badges.test.ts` / `quiz.test.ts` / `recognize.test.ts` / `practice.test.ts` / `audio.test.ts`。

---

### Task 1: 漢字の一覧と読み `kanji.ts`

**ファイル**

- Create `src/lib/kanji.ts`
- Create `src/lib/kanji.test.ts`

**Interfaces**

- Produces `type Grade = 1 | 2 | 3`、`KANJI: { grade: Grade; name: string; chars: string[] }[]`（1ねんせい 80 / 2ねんせい 160 / 3ねんせい 200）、`READINGS: Record<string, string[]>`（先頭が代表の読み）、`KANJI_ALL: string[]`（学年順 440 字）、`kanjiReading(c: string): string`。

- [ ] **Step 1** 失敗するテストを書く

`src/lib/kanji.test.ts` を次の内容で作る。

```ts
import { describe, it, expect } from 'vitest';
import { KANJI, KANJI_ALL, READINGS, kanjiReading } from './kanji';

describe('kanji', () => {
  it('学年ごとに 80 / 160 / 200 字、全体で重複なし', () => {
    expect(KANJI.map((k) => k.chars.length)).toEqual([80, 160, 200]);
    expect(KANJI.map((k) => k.name)).toEqual(['1ねんせい', '2ねんせい', '3ねんせい']);
    expect(KANJI_ALL.length).toBe(440);
    expect(new Set(KANJI_ALL).size).toBe(440);
  });
  it('全字に読みがあり、読みはひらがなだけ。先頭が代表の読み', () => {
    for (const c of KANJI_ALL) {
      expect(READINGS[c]?.length, c).toBeGreaterThan(0);
      for (const r of READINGS[c]) expect(r, c).toMatch(/^[ぁ-ゖー]+$/);
    }
    expect(kanjiReading('一')).toBe('いち');
    expect(kanjiReading('花')).toBe('はな');
    expect(READINGS['一']).toEqual(['いち', 'ひと']);
  });
});
```

- [ ] **Step 2** 失敗を確かめる

Run `pnpm exec vitest run src/lib/kanji.test.ts`
Expected FAIL（`./kanji` が見つからない）

- [ ] **Step 3** `src/lib/kanji.ts` を作る

表は 1 行が「字 読み …」で、先頭の読みが代表。学年別漢字配当表の順（学年ごとに五十音順）。

```ts
// 小学 1〜3 年で習う漢字（学年別漢字配当表の順）と読み。1 行が「字 読み…」で、先頭の読みが代表（きく とクイズに使う）。
// 同じ学年で代表の読みがかぶる字（工・公 など）は、かきクイズ側で同じ読みの字をどれも正解にして吸収する。
// scripts が Node で直接読むので $app/* を import しない
export type Grade = 1 | 2 | 3;

const TABLE: Record<Grade, string> = {
  1: `
一 いち ひと
右 みぎ ゆう
雨 あめ う
円 えん まる
王 おう
音 おと おん
下 した か
火 か ひ
花 はな か
貝 かい
学 がく まなぶ
気 き け
九 きゅう ここのつ
休 やすむ きゅう
玉 たま ぎょく
金 きん かね
空 そら くう
月 つき げつ
犬 いぬ けん
見 みる けん
五 ご いつつ
口 くち こう
校 こう
左 ひだり さ
三 さん みっつ
山 やま さん
子 こ し
四 し よん よっつ
糸 いと し
字 じ
耳 みみ じ
七 なな しち ななつ
車 くるま しゃ
手 て しゅ
十 じゅう とお
出 でる しゅつ
女 おんな じょ
小 ちいさい しょう
上 うえ じょう
森 もり しん
人 ひと じん にん
水 みず すい
正 ただしい せい
生 いきる せい なま
青 あお せい
夕 ゆう
石 いし せき
赤 あか せき
千 せん ち
川 かわ せん
先 さき せん
早 はやい そう
草 くさ そう
足 あし そく
村 むら そん
大 おおきい だい
男 おとこ だん
竹 たけ ちく
中 なか ちゅう
虫 むし ちゅう
町 まち ちょう
天 てん
田 た でん
土 つち ど
二 に ふたつ
日 ひ にち
入 はいる にゅう
年 とし ねん
白 しろ はく
八 はち やっつ
百 ひゃく
文 ぶん もん
木 き もく
本 ほん もと
名 な めい
目 め もく
立 たつ りつ
力 ちから りょく
林 はやし りん
六 ろく むっつ
`,
  2: `
引 ひく いん
羽 はね う
雲 くも うん
園 えん その
遠 とおい えん
何 なに なん
科 か
夏 なつ か
家 いえ か うち
歌 うた か
画 が かく
回 まわる かい
会 あう かい
海 うみ かい
絵 え かい
外 そと がい
角 かど かく つの
楽 たのしい がく らく
活 かつ
間 あいだ かん ま
丸 まる がん
岩 いわ がん
顔 かお がん
汽 き
記 き しるす
帰 かえる き
弓 ゆみ きゅう
牛 うし ぎゅう
魚 さかな ぎょ
京 きょう けい
強 つよい きょう
教 おしえる きょう
近 ちかい きん
兄 あに きょう
形 かたち けい
計 はかる けい
元 もと げん
言 いう げん
原 はら げん
戸 と こ
古 ふるい こ
午 ご
後 あと ご のち
語 ご かたる
工 こう く
公 こう
広 ひろい こう
交 まじわる こう
光 ひかり こう
考 かんがえる こう
行 いく こう ぎょう
高 たかい こう
黄 きいろ おう
合 あう ごう
谷 たに こく
国 くに こく
黒 くろ こく
今 いま こん
才 さい
細 ほそい さい
作 つくる さく
算 さん
止 とまる し
市 し いち
矢 や し
姉 あね し
思 おもう し
紙 かみ し
寺 てら じ
自 じ みずから
時 とき じ
室 しつ むろ
社 しゃ やしろ
弱 よわい じゃく
首 くび しゅ
秋 あき しゅう
週 しゅう
春 はる しゅん
書 かく しょ
少 すこし しょう
場 ば じょう
色 いろ しょく
食 たべる しょく
心 こころ しん
新 あたらしい しん
親 おや しん
図 ず と
数 かず すう
西 にし せい
声 こえ せい
星 ほし せい
晴 はれ せい
切 きる せつ
雪 ゆき せつ
船 ふね せん
線 せん
前 まえ ぜん
組 くみ そ
走 はしる そう
多 おおい た
太 ふとい たい
体 からだ たい
台 だい たい
地 ち じ
池 いけ ち
知 しる ち
茶 ちゃ さ
昼 ひる ちゅう
長 ながい ちょう
鳥 とり ちょう
朝 あさ ちょう
直 なおす ちょく
通 とおる つう
弟 おとうと てい
店 みせ てん
点 てん
電 でん
刀 かたな とう
冬 ふゆ とう
当 あたる とう
東 ひがし とう
答 こたえ とう
頭 あたま とう
同 おなじ どう
道 みち どう
読 よむ どく
内 うち ない
南 みなみ なん
肉 にく
馬 うま ば
売 うる ばい
買 かう ばい
麦 むぎ ばく
半 はん なかば
番 ばん
父 ちち ふ
風 かぜ ふう
分 わける ぶん ふん
聞 きく ぶん
米 こめ べい
歩 あるく ほ
母 はは ぼ
方 かた ほう
北 きた ほく
毎 まい
妹 いもうと まい
万 まん
明 あかるい めい
鳴 なく めい
毛 け もう
門 もん かど
夜 よる や
野 の や
友 とも ゆう
用 よう もちいる
曜 よう
来 くる らい
里 さと り
理 り
話 はなす わ
`,
  3: `
悪 わるい あく
安 やすい あん
暗 くらい あん
医 い
委 い
意 い
育 そだつ いく
員 いん
院 いん
飲 のむ いん
運 はこぶ うん
泳 およぐ えい
駅 えき
央 おう
横 よこ おう
屋 や おく
温 あたたかい おん
化 ばける か
荷 に か
界 かい
開 ひらく かい
階 かい
寒 さむい かん
感 かん
漢 かん
館 かん やかた
岸 きし がん
起 おきる き
期 き
客 きゃく
究 きゅう
急 いそぐ きゅう
級 きゅう
宮 みや きゅう
球 たま きゅう
去 さる きょ
橋 はし きょう
業 ぎょう わざ
曲 まがる きょく
局 きょく
銀 ぎん
区 く
苦 くるしい く
具 ぐ
君 きみ くん
係 かかり けい
軽 かるい けい
血 ち けつ
決 きめる けつ
研 けん
県 けん
庫 こ
湖 みずうみ こ
向 むく こう
幸 しあわせ こう
港 みなと こう
号 ごう
根 ね こん
祭 まつり さい
皿 さら
仕 し つかえる
死 しぬ し
使 つかう し
始 はじめる し
指 ゆび し
歯 は し
詩 し
次 つぎ じ
事 こと じ
持 もつ じ
式 しき
実 み じつ
写 うつす しゃ
者 もの しゃ
主 ぬし しゅ
守 まもる しゅ
取 とる しゅ
酒 さけ しゅ
受 うける じゅ
州 しゅう す
拾 ひろう しゅう
終 おわる しゅう
習 ならう しゅう
集 あつめる しゅう
住 すむ じゅう
重 おもい じゅう
宿 やど しゅく
所 ところ しょ
暑 あつい しょ
助 たすける じょ
昭 しょう
消 きえる しょう
商 しょう
章 しょう
勝 かつ しょう
乗 のる じょう
植 うえる しょく
申 もうす しん
身 み しん
神 かみ しん
真 ま しん
深 ふかい しん
進 すすむ しん
世 よ せ
整 ととのえる せい
昔 むかし せき
全 ぜん まったく
相 あい そう
送 おくる そう
想 そう
息 いき そく
速 はやい そく
族 ぞく
他 た ほか
打 うつ だ
対 たい
待 まつ たい
代 かわる だい よ
第 だい
題 だい
炭 すみ たん
短 みじかい たん
談 だん
着 きる ちゃく
注 そそぐ ちゅう
柱 はしら ちゅう
丁 ちょう てい
帳 ちょう
調 しらべる ちょう
追 おう つい
定 さだめる てい
庭 にわ てい
笛 ふえ てき
鉄 てつ
転 ころぶ てん
都 みやこ と
度 ど たび
投 なげる とう
豆 まめ とう
島 しま とう
湯 ゆ とう
登 のぼる とう
等 ひとしい とう
動 うごく どう
童 どう わらべ
農 のう
波 なみ は
配 くばる はい
倍 ばい
箱 はこ
畑 はたけ
発 はつ
反 はん
坂 さか はん
板 いた ばん
皮 かわ ひ
悲 かなしい ひ
美 うつくしい び
鼻 はな び
筆 ふで ひつ
氷 こおり ひょう
表 おもて ひょう
秒 びょう
病 やまい びょう
品 しな ひん
負 まける ふ
部 ぶ
服 ふく
福 ふく
物 もの ぶつ
平 たいら へい
返 かえす へん
勉 べん
放 はなす ほう
味 あじ み
命 いのち めい
面 めん おもて
問 とう もん
役 やく
薬 くすり やく
由 ゆう よし
油 あぶら ゆ
有 ある ゆう
遊 あそぶ ゆう
予 よ
羊 ひつじ よう
洋 よう
葉 は よう
陽 よう
様 さま よう
落 おちる らく
流 ながれる りゅう
旅 たび りょ
両 りょう
緑 みどり りょく
礼 れい
列 れつ
練 ねる れん
路 みち ろ
和 わ
`
};

const GRADES: Grade[] = [1, 2, 3];
const rows = (g: Grade) =>
  TABLE[g]
    .trim()
    .split('\n')
    .map((line) => line.trim().split(/\s+/));

export const KANJI: { grade: Grade; name: string; chars: string[] }[] = GRADES.map((g) => ({
  grade: g,
  name: `${g}ねんせい`,
  chars: rows(g).map(([c]) => c)
}));
export const READINGS: Record<string, string[]> = Object.fromEntries(
  GRADES.flatMap((g) => rows(g).map(([c, ...r]) => [c, r]))
);
export const KANJI_ALL: string[] = KANJI.flatMap((k) => k.chars);
export const kanjiReading = (c: string) => READINGS[c][0];
```

- [ ] **Step 4** テストを通す

Run `pnpm exec vitest run src/lib/kanji.test.ts`
Expected PASS（2 tests）。字数が合わないときは表の該当学年で行の抜け・重複を探す（`node -e` で `KANJI[n].chars` の `Set` と比べる）。

- [ ] **Step 5** コミット

```bash
git add src/lib/kanji.ts src/lib/kanji.test.ts
git commit -m "feat: 小学 1〜3 年の漢字 440 字と読みのデータ（kanji.ts）"
```

---

### Task 2: 書き順 `strokes-kanji.ts` を KanjiVG から生成

**ファイル**

- Modify `scripts/fetch-strokes.ts`
- Create `src/lib/strokes-kanji.ts`（生成物）
- Modify `src/lib/kanji.test.ts`
- Modify `src/lib/recognize.test.ts`

**Interfaces**

- Produces `STROKES_KANJI: Record<string, string[]>`（440 字、KanjiVG の 109×109 座標の path 文字列）。

- [ ] **Step 1** 失敗するテストを足す

`src/lib/kanji.test.ts` の import に `import { STROKES_KANJI } from './strokes-kanji';` を足し、`describe` の中に次を足す。

```ts
it('書き順は 440 字ぶんそろっている', () => {
  for (const c of KANJI_ALL) expect(STROKES_KANJI[c]?.length, c).toBeGreaterThan(0);
  expect(Object.keys(STROKES_KANJI).length).toBe(440);
});
```

`src/lib/recognize.test.ts` の import に `import { STROKES_KANJI } from './strokes-kanji';` と `import { KANJI_ALL } from './kanji';` を足し、`T_KANA` の下に `const T_KANJI = makeTemplates(STROKES_KANJI);` を足す。`describe('recognize', …)` の中に次を足す（440 字全部だと遅いので 10 字おきに 44 字）。

```ts
it('漢字: お手本そのものは 440 字のお手本の中で合格する（10 字おきに確認）', () => {
  for (const c of KANJI_ALL.filter((_, i) => i % 10 === 0))
    expect(passes(c, recognize(drawn(STROKES_KANJI, c), T_KANJI)), c).toBe(true);
});
```

- [ ] **Step 2** 失敗を確かめる

Run `pnpm exec vitest run src/lib/kanji.test.ts src/lib/recognize.test.ts`
Expected FAIL（`./strokes-kanji` が見つからない）

- [ ] **Step 3** 生成スクリプトに漢字を足す

`scripts/fetch-strokes.ts` の import に `import { KANJI_ALL } from '../src/lib/kanji.ts';` を足し、対象の配列を次にする。

```ts
for (const [chars, file, name] of [
  [CHARS, 'src/lib/strokes.ts', 'STROKES'],
  [CHARS_KANA, 'src/lib/strokes-kana.ts', 'STROKES_KANA'],
  [KANJI_ALL, 'src/lib/strokes-kanji.ts', 'STROKES_KANJI']
] as const) {
```

- [ ] **Step 4** 生成する

Run `pnpm strokes`
Expected 3 行の出力で末尾が `src/lib/strokes-kanji.ts 440 chars`。`strokes.ts` / `strokes-kana.ts` の差分は `git diff --stat src/lib/strokes.ts src/lib/strokes-kana.ts` で 0 であること（同じコミットから取るので変わらない）。`unsupported path command` で止まったら、その字のコードポイントと出力を報告して止まる（KanjiVG が M/L/C/S/H/V/Z 以外を使う字は現行の平坦化で扱えない）。

- [ ] **Step 5** テストを通す

Run `pnpm exec vitest run src/lib/kanji.test.ts src/lib/recognize.test.ts`
Expected PASS。`ls -la src/lib/strokes-kanji.ts` の大きさを控えておく（Task 13 で CLAUDE.md に書く）。

- [ ] **Step 6** コミット

```bash
git add scripts/fetch-strokes.ts src/lib/strokes-kanji.ts src/lib/kanji.test.ts src/lib/recognize.test.ts
git commit -m "feat: 漢字 440 字の書き順を KanjiVG から生成（strokes-kanji.ts）"
```

---

### Task 3: ことば `kanji` を `Lang` に足す

**ファイル**

- Modify `src/lib/lang.svelte.ts`
- Modify `src/lib/audio.ts`
- Modify `src/lib/progress.svelte.ts:58`
- Modify `src/lib/badges.ts:48-53`
- Modify `src/lib/audio.test.ts`

**Interfaces**

- Produces `type Lang = 'ja' | 'kana' | 'kanji' | 'en'`、`LANGS = ['ja', 'kana', 'kanji', 'en']`、`info('kanji')`（title `かきかき かんじ`、short `かんじ`、glyph `漢`、speech `ja-JP`、strokes `STROKES_KANJI`、chars `KANJI_ALL`）、`speechOf(c: string, l?: Lang): string`（`audio.ts`。かんじ なら代表の読み、それ以外は `readingOf(c)`）、`ROWS.kanji`（学年 3 行）、`TOTAL('kanji') = { chars: 440, words: 0 }`。

- [ ] **Step 1** 失敗するテストを書く

`src/lib/audio.test.ts` の import に `import { speechOf } from './audio';` を足し（既存の import 行に `speechOf` を加える）、ファイル末尾の `describe` の中か新しい `describe('speechOf', …)` に次を足す。

```ts
describe('speechOf', () => {
  it('かんじ は代表の読み、それ以外は文字そのもの（小書き文字は説明）', () => {
    expect(speechOf('花', 'kanji')).toBe('はな');
    expect(speechOf('一', 'kanji')).toBe('いち');
    expect(speechOf('あ', 'ja')).toBe('あ');
    expect(speechOf('っ', 'ja')).toBe('ちいさい つ');
    expect(speechOf('ア', 'kana')).toBe('ア');
  });
});
```

- [ ] **Step 2** 失敗を確かめる

Run `pnpm exec vitest run src/lib/audio.test.ts`
Expected FAIL（`speechOf` が無い）

- [ ] **Step 3** `lang.svelte.ts` を変える

```ts
import { CHARS, CHARS_EN, CHARS_KANA, toKatakana } from './chars';
import { KANJI_ALL } from './kanji';
import { STROKES } from './strokes';
import { STROKES_EN } from './strokes-en';
import { STROKES_KANA } from './strokes-kana';
import { STROKES_KANJI } from './strokes-kanji';
import { isCharWord, type Word } from './words';
import { getRaw, setRaw } from './storage';

export type Lang = 'ja' | 'kana' | 'kanji' | 'en';
export const LANGS: Lang[] = ['ja', 'kana', 'kanji', 'en'];
const KEY = 'kk:lang';

// 現在の言語。ホームのトグルで切り替え、全画面が参照する
const saved = getRaw(KEY);
export const lang = $state<{ v: Lang }>({ v: LANGS.find((l) => l === saved) ?? 'ja' });
```

`LANG_INFO` に `kana` の次（`en` の前）に次を足す。

```ts
  kanji: {
    title: 'かきかき かんじ',
    short: 'かんじ',
    glyph: '漢',
    speech: 'ja-JP',
    strokes: STROKES_KANJI,
    chars: KANJI_ALL
  },
```

`nameOf` を、`en` を末尾の分岐にして かんじ は ひらがな と同じ `w.name` を返すようにする。

```ts
// 表示名。カタカナはひらがな名から変換、英語は先頭だけ大文字。かんじ の単語は 1 文字なのでそのまま
export const nameOf = (w: Word, l: Lang = lang.v) =>
  l === 'kana' ? toKatakana(w.name) : l === 'en' ? enName(w) : w.name;
```

`subOf` は変えない（1 文字単語は `w.name === w.en` なので `[]` を返す）。

- [ ] **Step 4** `audio.ts` に `speechOf` を足す

`readingOf` の直後に次を足す（`kanji.ts` と `Lang` の import も足す。`Lang` は `import type { Lang } from './lang.svelte';`）。

```ts
import { kanjiReading } from './kanji';
import { lang, type Lang } from './lang.svelte';
```

```ts
// 「きく」で読む文字列。かんじ は字ではなく代表の読み（一 → いち）を読む
export const speechOf = (c: string, l: Lang = lang.v) => (l === 'kanji' ? kanjiReading(c) : readingOf(c));
```

`audio.ts` が `lang.svelte.ts` を import しても循環にはならない（`lang.svelte.ts` は `audio.ts` を読まない）。

- [ ] **Step 5** `Record<Lang, …>` のリテラルを直す

`src/lib/progress.svelte.ts` の `data` を次にする。

```ts
const data = $state<Record<Lang, Data>>(Object.fromEntries(LANGS.map((l) => [l, load(l)])) as Record<Lang, Data>);
```

`src/lib/badges.ts` の import に `import { KANJI } from './kanji';` を足し、`ROWS_KANA` の下を次にする。

```ts
const ROWS_KANJI: Row[] = KANJI.map((k) => ({ name: k.name, chars: k.chars }));
export const ROWS: Record<Lang, Row[]> = { ja: ROWS_JA, kana: ROWS_KANA, kanji: ROWS_KANJI, en: ROWS_EN };
const ALL_CHARS: Record<Lang, string[]> = {
  ja: CHARS,
  kana: CHARS_KANA,
  kanji: KANJI.flatMap((k) => k.chars),
  en: CHARS_EN
};
export const CAT_TOTAL = Object.fromEntries(CATEGORIES.map((c) => [c, WORDS.filter((w) => w.category === c).length]));
// かんじ は単語を持たない（1 文字練習だけ）。単語の合計が 0 の ことば では単語系のメダル・表示を出さない
export const TOTAL = (l: Lang) => ({ chars: ALL_CHARS[l].length, words: l === 'kanji' ? 0 : WORDS.length });
```

- [ ] **Step 6** 型と全テストを通す

Run `pnpm check && pnpm test:run`
Expected `0 ERRORS` と全テスト PASS。`badges.test.ts` の `全部クリアで全メダル` は `'ja' | 'kana' | 'en'` しか回さないのでこの時点では通る（Task 4 で かんじ を足す）。

- [ ] **Step 7** lint とコミット

Run `pnpm lint`
Expected エラーなし。

```bash
git add src/lib/lang.svelte.ts src/lib/audio.ts src/lib/audio.test.ts src/lib/progress.svelte.ts src/lib/badges.ts
git commit -m "feat: ことば kanji を Lang に足す（文字セット・書き順・読み上げ speechOf、記録キー kk:*:kanji:*）"
```

---

### Task 4: かんじ 用のメダル `badgesOf('kanji')`

**ファイル**

- Modify `src/lib/badges.ts:95-195`
- Modify `src/lib/badges.test.ts`

**Interfaces**

- Produces `BADGE_GROUPS` に `'がくねん'`。`badgesOf('kanji')` は 42 枚（はじめて 2、もじ 6、きんのほし 6、がくねん 3、クイズ 8、つづけた ひ 5、かくし 12）。単語が 0 の ことば では `first-word` / `first-crown` / `words-*` / `cat-*` / `crowns-*` を含まない。

- [ ] **Step 1** 失敗するテストを書く

`src/lib/badges.test.ts` の import に `import { LANGS } from './lang.svelte';` を足し、次のように変える。

`id は一意で、行グループは全文字を過不足なく分ける` のループを `for (const l of LANGS)` にし、`all` の決め方を次にする。

```ts
const all = l === 'ja' ? CHARS : l === 'kana' ? CHARS_KANA : l === 'en' ? CHARS_EN : KANJI_ALL;
```

（import に `import { KANJI_ALL } from './kanji';` を足す。）

`全部クリアで全メダル` のループも `for (const l of LANGS)` にし、枚数の期待値を次にする。

```ts
expect(badgesOf(l).length).toBe(l === 'en' ? 62 : l === 'kanji' ? 42 : 66);
```

さらに `describe` の中に次を足す。

```ts
it('かんじ: 単語系のメダルが無く、段は がくねん、しきい値は 440 字向け', () => {
  const ids = badgesOf('kanji').map((b) => b.id);
  for (const id of ids) expect(id).not.toMatch(/^(first-word|first-crown|words-|cat-|crowns-)/);
  expect(ids).toEqual(
    expect.arrayContaining(['chars-10', 'chars-50', 'chars-100', 'chars-200', 'chars-300', 'chars-all'])
  );
  expect(ids).toEqual(expect.arrayContaining(['gold-10', 'gold-50', 'gold-100', 'gold-200', 'gold-300', 'gold-all']));
  expect(ids).toEqual(expect.arrayContaining(['row-1ねんせい', 'row-2ねんせい', 'row-3ねんせい']));
  expect(badgesOf('kanji').find((b) => b.id === 'row-1ねんせい')?.group).toBe('がくねん');
  expect(badgesOf('kanji').find((b) => b.id === 'chars-all')?.name).toBe('かんじ マスター');
  expect(badgesOf('ja').map((b) => b.id)).toEqual(
    expect.arrayContaining(['chars-10', 'chars-30', 'chars-50', 'chars-all'])
  );
});
```

- [ ] **Step 2** 失敗を確かめる

Run `pnpm exec vitest run src/lib/badges.test.ts`
Expected FAIL（`row-1ねんせい` の group が `ぎょう マスター`、`chars-100` が無い、枚数が違う）

- [ ] **Step 3** `badges.ts` を変える

`BADGE_GROUPS` を次にする（`'ぎょう マスター'` の次に `'がくねん'`）。

```ts
export const BADGE_GROUPS = [
  'はじめて',
  'もじ',
  'きんのほし',
  'ぎょう マスター',
  'がくねん',
  'たんご',
  'はかせ',
  'おうかん',
  'クイズ',
  'つづけた ひ',
  'かくし'
] as const;
```

`badgesOf` の先頭と、もじ・きんのほし・行・単語のメダルを次に置き換える（`first-char` から `crowns-all` まで）。

```ts
// もじ・きんのほし の刻み。かんじ は 440 字なので段を多くする
const STEPS: Record<Lang, number[]> = { ja: [10, 30, 50], kana: [10, 30, 50], kanji: [10, 50, 100, 200, 300], en: [10, 30, 50] };
const STEP_EMOJI = ['🔟', '📘', '📗', '📙', '📕'];
const GOLD_EMOJI = ['⭐', '🌟', '✨', '🌠', '☀️'];
const ALL_NAME: Record<Lang, string> = { ja: 'ひらがな', kana: 'かたかな', kanji: 'かんじ', en: 'あるふぁべっと' };

export function badgesOf(l: Lang): Badge[] {
  const T = TOTAL(l);
  const all = ALL_NAME[l];
  const words: Badge[] =
    T.words === 0
      ? []
      : [
          count('first-word', 'はじめて', '🎈', 'はじめての たんご', 'たんごに はじめて ほしが ついた', (s) => [s.words, 1]),
          count('first-crown', 'はじめて', '👑', 'はじめての おうかん', 'たんごの ぜんぶの もじが きんのほし', (s) => [
            s.crowns,
            1
          ]),
          count('words-10', 'たんご', '🎒', 'たんご 10', '10この たんごに ほし', (s) => [s.words, 10]),
          count('words-50', 'たんご', '🚌', 'たんご 50', '50この たんごに ほし', (s) => [s.words, 50]),
          count('words-100', 'たんご', '🚀', 'たんご 100', '100この たんごに ほし', (s) => [s.words, 100]),
          count('words-all', 'たんご', '🎖️', 'たんご マスター', 'ぜんぶの たんごに ほし', (s) => [s.words, T.words]),
          ...CATEGORIES.map((c) =>
            count(`cat-${c}`, 'はかせ', CAT_EMOJI[c] ?? '🏅', `${c} はかせ`, `${c}の たんごに ぜんぶ ほし`, (s) => [
              s.cats[c],
              CAT_TOTAL[c]
            ])
          ),
          count('crowns-10', 'おうかん', '👸', 'おうかん 10', '10この たんごに おうかん', (s) => [s.crowns, 10]),
          count('crowns-all', 'おうかん', '🏰', 'おうかん マスター', 'ぜんぶの たんごに おうかん', (s) => [
            s.crowns,
            T.words
          ])
        ];
  return [
    count('first-char', 'はじめて', '🌱', 'はじめの いっぽ', 'もじを 1つ クリア', (s) => [s.chars, 1]),
    ...words.filter((b) => b.id === 'first-word'),
    count('first-gold', 'はじめて', '✨', 'はじめての きんのほし', 'おてほんなしで はじめて ごうかく', (s) => [
      s.gold,
      1
    ]),
    ...words.filter((b) => b.id === 'first-crown'),
    ...STEPS[l].map((n, k) =>
      count(`chars-${n}`, 'もじ', STEP_EMOJI[k], `もじ ${n}`, `もじを ${n}こ クリア`, (s) => [s.chars, n])
    ),
    count('chars-all', 'もじ', '🏆', `${all} マスター`, `${T.chars}もじ ぜんぶ クリア`, (s) => [s.chars, T.chars]),
    ...STEPS[l]
      .slice(0, l === 'kanji' ? 5 : 2)
      .map((n, k) =>
        count(`gold-${n}`, 'きんのほし', GOLD_EMOJI[k], `きんのほし ${n}`, `おてほんなしで ${n}もじ ごうかく`, (s) => [
          s.gold,
          n
        ])
      ),
    count(
      'gold-all',
      'きんのほし',
      '💫',
      'きんのほし マスター',
      `おてほんなしで ${T.chars}もじ ぜんぶ ごうかく`,
      (s) => [s.gold, T.chars]
    ),
    ...ROWS[l].map((r) =>
      count(
        `row-${r.name}`,
        l === 'kanji' ? 'がくねん' : 'ぎょう マスター',
        l === 'kanji' ? '📖' : r.chars[0],
        `${r.name} マスター`,
        `${r.name}${l === 'kanji' ? 'の かんじ' : ''}を ぜんぶ クリア`,
        (s) => [s.rows[r.name], r.chars.length]
      )
    ),
    ...words.filter((b) => b.group !== 'はじめて'),
```

このあとに既存の `...(['read', 'write'] as const).flatMap(…)`（クイズ）、`days-*` / `streak-*`、かくし の配列がそのまま続く。既存の ja/kana/en の id と並び（`first-char`, `first-word`, `first-gold`, `first-crown`, `chars-10`, `chars-30`, `chars-50`, `chars-all`, `gold-10`, `gold-30`, `gold-all`, `row-*`, `words-*`, `cat-*`, `crowns-*`, …）は変わらない。

- [ ] **Step 4** テストを通す

Run `pnpm exec vitest run src/lib/badges.test.ts src/lib/progress.test.ts`
Expected PASS。枚数が 42 に合わないときは `badgesOf('kanji').map((b) => b.id)` を出して数える（はじめて 2、もじ 6、きんのほし 6、がくねん 3、クイズ 8、つづけた ひ 5、かくし 12）。

- [ ] **Step 5** lint / check / コミット

Run `pnpm lint && pnpm check && pnpm test:run`

```bash
git add src/lib/badges.ts src/lib/badges.test.ts
git commit -m "feat: かんじ のメダル一覧（単語系なし、がくねん マスター、440 字向けの刻み）"
```

---

### Task 5: 級の名前を ことば ごとに `levelName(lv, l)`

**ファイル**

- Modify `src/lib/quiz.ts:5-8`
- Modify `src/lib/badges.ts`（クイズのメダル名）
- Modify `src/lib/components/QuizHeader.svelte`、`QuizResult.svelte`、`trophies/StatTiles.svelte`、`about/QuizBars.svelte`
- Modify `src/routes/quiz/+page.svelte`、`quiz/read/+page.svelte`、`quiz/write/+page.svelte`、`about/progress/+page.svelte`
- Modify `src/lib/quiz.test.ts`

**Interfaces**

- Produces `levelName(lv: Level, l: Lang): string`（かんじ は `1ねんせい` / `2ねんせい` / `3ねんせい`、それ以外は かんたん / ふつう / むずかしい）。`LEVEL_NAME` は export しなくなる。`QuizBars` は `l: Lang` を受け取る。

- [ ] **Step 1** 失敗するテストを書く

`src/lib/quiz.test.ts` の import を `import { levelOf, wordsOf, makeReadQuiz, makeWriteQuiz, pickChoices, levelName, type ReadQ } from './quiz';` にし、`describe('quiz', …)` の中に次を足す。

```ts
it('級の名前は かんじ だけ学年', () => {
  expect([1, 2, 3].map((lv) => levelName(lv as 1 | 2 | 3, 'ja'))).toEqual(['かんたん', 'ふつう', 'むずかしい']);
  expect([1, 2, 3].map((lv) => levelName(lv as 1 | 2 | 3, 'kanji'))).toEqual(['1ねんせい', '2ねんせい', '3ねんせい']);
});
```

- [ ] **Step 2** 失敗を確かめる

Run `pnpm exec vitest run src/lib/quiz.test.ts`
Expected FAIL（`levelName` が無い）

- [ ] **Step 3** `quiz.ts` を変える

```ts
export type Level = 1 | 2 | 3;
export type Kind = 'read' | 'write';
const LEVEL_NAME: Record<Level, string> = { 1: 'かんたん', 2: 'ふつう', 3: 'むずかしい' };
// 級の表示名。かんじ は文字数の級ではなく学年で出題範囲を絞るので、名前も学年
export const levelName = (lv: Level, l: Lang) => (l === 'kanji' ? `${lv}ねんせい` : LEVEL_NAME[lv]);
export const QUESTIONS: Record<Kind, number> = { read: 10, write: 5 };
```

- [ ] **Step 4** 利用箇所を置き換える

- `src/lib/badges.ts` の import を `import { levelName } from './quiz';` にし、クイズのメダルの `LEVEL_NAME[lv]`（2 か所）を `levelName(lv, l)` にする。
- `src/lib/components/QuizHeader.svelte` は `import { levelName, type Level } from '$lib/quiz';` と `import { lang } from '$lib/lang.svelte';` にし、`{LEVEL_NAME[level]}` を `{levelName(level, lang.v)}` にする。
- `src/lib/components/QuizResult.svelte` も同じく `levelName(next, lang.v)`。
- `src/lib/components/trophies/StatTiles.svelte` は `LEVEL_NAME[lv as 1 | 2 | 3]` を `levelName(lv as 1 | 2 | 3, lang.v)` にする（`lang` は import 済み）。
- `src/lib/components/about/QuizBars.svelte` は props を `let { quiz, l }: { quiz: Record<string, number>; l: Lang } = $props();` にし（`import type { Lang } from '$lib/lang.svelte';`）、`label` を `` `${name} ${levelName(lv, l)}` `` にする。`src/routes/about/progress/+page.svelte` の `<QuizBars quiz={d.quiz} />` を `<QuizBars quiz={d.quiz} l={sel} />` にする。
- `src/routes/quiz/read/+page.svelte` と `write/+page.svelte` の `<title>` は `{levelName(level, lang.v)}`（`import { lang, info } from '$lib/lang.svelte';`）。
- `src/routes/quiz/+page.svelte` は `import { levelName, QUESTIONS, type Kind, type Level } from '$lib/quiz';` と `import { lang, info } from '$lib/lang.svelte';` にし、`{LEVEL_NAME[lv]}` を `{levelName(lv, lang.v)}` にする。

- [ ] **Step 5** 通す

Run `pnpm check && pnpm lint && pnpm test:run`
Expected `LEVEL_NAME` の参照が残っていれば `pnpm check` が落ちるので、`grep -rn LEVEL_NAME src` が `quiz.ts` の 2 行だけになるまで直す。

- [ ] **Step 6** コミット

```bash
git add -A src
git commit -m "refactor: 級の表示名を levelName(lv, l) にして、かんじ では学年の名前を出す"
```

---

### Task 6: 認識の合否を候補の集合で判定する（`passes` / `accept`）

**ファイル**

- Modify `src/lib/recognize.ts:64-68`
- Modify `src/lib/tracer.svelte.ts:28-32,136`
- Modify `src/lib/components/Canvas.svelte:10-27`
- Modify `src/lib/recognize.test.ts`

**Interfaces**

- Produces `passes(targets: string[], results)`、`new Tracer(char, strokes, mode, accept?: string[])`、`Canvas` の prop `accept?: string[]`（省略時は `[char]`）。

- [ ] **Step 1** 失敗するテストを書く

`src/lib/recognize.test.ts` の既存の `passes(c, …)` / `passes('O', …)` などの第 1 引数をすべて配列にする（`passes([c], …)`、`passes(['O'], …)`、`passes(['あ'], …)`、`passes(['た'], …)`、`passes(['き'], …)`。Task 2 で足した漢字のテストの `passes(c, …)` も含む）。さらに次を足す。

```ts
it('候補が複数なら、1 位がそのどれかで合格（かきクイズで同じ読みの字をどれも正解にする）', () => {
  const r = recognize(drawn(STROKES_KANJI, '工'), T_KANJI);
  expect(r[0].char).toBe('工');
  expect(passes(['公', '工'], r)).toBe(true);
  expect(passes(['公'], r)).toBe(false);
  expect(passes([], r)).toBe(false);
});
```

- [ ] **Step 2** 失敗を確かめる

Run `pnpm exec vitest run src/lib/recognize.test.ts`
Expected FAIL（型エラーか、`findIndex` が配列と比較して常に -1）

- [ ] **Step 3** `recognize.ts` の `passes` を変える

```ts
// 合格: 1 位が候補のどれかで距離が D_MAX × 2 未満、または 2 位以内に候補があり 1 位との差が MARGIN 未満。
// 候補は普通 1 字だが、かきクイズでは同じ読みの字（工・公 など）をまとめて渡す
export function passes(targets: string[], results: { char: string; dist: number }[]) {
  const i = results.findIndex((r) => targets.includes(r.char));
  if (i === 0) return results[0].dist < RECOG.D_MAX * 2;
  return i === 1 && results[1].dist - results[0].dist < RECOG.MARGIN;
}
```

- [ ] **Step 4** `Tracer` と `Canvas` に `accept` を通す

`src/lib/tracer.svelte.ts` のコンストラクタを次にする。

```ts
  constructor(
    readonly char: string,
    readonly strokes: Record<string, string[]>,
    readonly mode: Mode,
    // おてほんなし で正解にする字。省略時は char だけ
    private accept: string[] = [char]
  ) {
    this.samples = strokes[char].map((d) => pathToPoints(d));
  }
```

`judge()` の `ok: passes(this.char, r)` を `ok: passes(this.accept, r)` にする。

`src/lib/components/Canvas.svelte` の props に `accept` を足す。

```ts
let {
  char,
  strokes,
  mode,
  accept,
  onDone,
  onStroke,
  onDrawn
}: {
  char: string;
  strokes: Record<string, string[]>;
  mode: Mode;
  accept?: string[]; // おてほんなし で正解にする字（省略時は char だけ）
  onDone: (r: Result) => void;
  onStroke?: (i: number) => void;
  onDrawn?: (has: boolean) => void; // おてほんなし で線が 1 本以上あるか（できた を押せるか）
} = $props();

// 文字・モードの切替は親が {#key} で再マウントするので、判定器は初期値で 1 回だけ作る
const t = untrack(() => new Tracer(char, strokes, mode, accept));
```

- [ ] **Step 5** 通す

Run `pnpm check && pnpm test:run`
Expected PASS。

- [ ] **Step 6** コミット

```bash
git add src/lib/recognize.ts src/lib/recognize.test.ts src/lib/tracer.svelte.ts src/lib/components/Canvas.svelte
git commit -m "feat: おてほんなし の合否を候補の集合で判定できるようにする（passes(targets)、Canvas の accept）"
```

---

### Task 7: かんじ の出題 `quiz-kanji.ts`

**ファイル**

- Create `src/lib/shuffle.ts`
- Create `src/lib/quiz-kanji.ts`
- Create `src/lib/quiz-kanji.test.ts`
- Modify `src/lib/quiz.ts`
- Modify `src/lib/quiz-session.svelte.ts`
- Modify `src/lib/quiz.test.ts:56,103`

**Interfaces**

- Consumes `KANJI` / `KANJI_ALL` / `READINGS` / `kanjiReading`（Task 1）、`charWord` / `charWordId`（`words.ts`）。
- Produces `shuffle<T>(arr, rnd)`（`shuffle.ts`）。`ReadKind` に `'kanji-read' | 'kanji-listen'`、`WriteKind` に `'kanji'`、`WriteQ.accept?: string[]`。`makeKanjiReadQuiz(level, n = 10, rnd)`（`kanji-read` は `key` が代表の読みで `letters` が読み 3 つ、`kanji-listen` は `key` が `charWordId(c)` で `choices` が字 3 つ）、`makeKanjiWriteQuiz(level, n = 5, rnd)`（`kind: 'kanji'`、`accept` は同じ読みを持つ 440 字中の字）。`makeReadQuiz('kanji', …)` / `makeWriteQuiz('kanji', …)` はこれらに委譲。`WriteQuiz.accept`。

- [ ] **Step 1** 失敗するテストを書く

`src/lib/quiz-kanji.test.ts` を次の内容で作る。

```ts
import { describe, it, expect } from 'vitest';
import { makeKanjiReadQuiz, makeKanjiWriteQuiz } from './quiz-kanji';
import { makeReadQuiz, makeWriteQuiz } from './quiz';
import { KANJI, READINGS, kanjiReading } from './kanji';

const seeded =
  (s = 1) =>
  () =>
    (s = (s * 9301 + 49297) % 233280) / 233280;

describe('quiz-kanji', () => {
  it('よみクイズは 10 問、2 形式が 5 問ずつ、出題は学年の字だけ、重複なし', () => {
    for (const level of [1, 2, 3] as const)
      for (const seed of [1, 2, 3]) {
        const qs = makeKanjiReadQuiz(level, 10, seeded(seed));
        expect(qs.length).toBe(10);
        expect(new Set(qs.map((q) => q.answer.id)).size).toBe(10);
        expect(qs.filter((q) => q.kind === 'kanji-read').length).toBe(5);
        expect(qs.filter((q) => q.kind === 'kanji-listen').length).toBe(5);
        for (const q of qs) expect(KANJI[level - 1].chars).toContain(q.answer.name);
      }
  });
  it('字を見て読みを選ぶ: 正解は代表の読み、外れは出題した字のどの読みとも一致しない', () => {
    const qs = makeKanjiReadQuiz(2, 10, seeded(4)).filter((q) => q.kind === 'kanji-read');
    for (const q of qs) {
      const c = q.answer.name;
      expect(q.key).toBe(kanjiReading(c));
      expect(q.letters!.length).toBe(3);
      expect(new Set(q.letters).size).toBe(3);
      expect(q.letters).toContain(q.key);
      for (const r of q.letters!) if (r !== q.key) expect(READINGS[c], `${c} ${r}`).not.toContain(r);
    }
  });
  it('読みを聞いて字を選ぶ: 外れは流した読みをどの読みにも持たない字', () => {
    const qs = makeKanjiReadQuiz(1, 10, seeded(5)).filter((q) => q.kind === 'kanji-listen');
    for (const q of qs) {
      const c = q.answer.name;
      const reading = kanjiReading(c);
      expect(q.key).toBe(q.answer.id);
      expect(q.choices.length).toBe(3);
      expect(q.choices.some((w) => w.id === q.answer.id)).toBe(true);
      for (const w of q.choices)
        if (w.id !== q.answer.id) expect(READINGS[w.name], `${c} ${w.name}`).not.toContain(reading);
    }
  });
  it('かきクイズは 5 問、同じ読みを持つ字を全部 accept に入れる', () => {
    const ws = makeKanjiWriteQuiz(2, 5, seeded(6));
    expect(ws.length).toBe(5);
    for (const w of ws) {
      expect(w.kind).toBe('kanji');
      expect(w.accept).toContain(w.word.name);
      for (const c of w.accept!) expect(READINGS[c]).toContain(kanjiReading(w.word.name));
    }
    const kou = makeKanjiWriteQuiz(2, 160, seeded(7)).find((w) => w.word.name === '工')!;
    expect(kou.accept).toEqual(expect.arrayContaining(['工', '公']));
  });
  it('makeReadQuiz / makeWriteQuiz は かんじ をこちらに委譲する', () => {
    expect(makeReadQuiz('kanji', 1, 10, seeded(8)).every((q) => q.kind.startsWith('kanji-'))).toBe(true);
    expect(makeWriteQuiz('kanji', 1, 5, seeded(8)).every((q) => q.kind === 'kanji')).toBe(true);
  });
});
```

- [ ] **Step 2** 失敗を確かめる

Run `pnpm exec vitest run src/lib/quiz-kanji.test.ts`
Expected FAIL（`./quiz-kanji` が無い）

- [ ] **Step 3** `shuffle.ts` を作り、`quiz.ts` から移す

`src/lib/shuffle.ts` を作る。

```ts
export function shuffle<T>(arr: T[], rnd = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

`src/lib/quiz.ts` から `shuffle` の定義を消し、`import { shuffle } from './shuffle';` を足す。`quiz.ts` から `shuffle` を import している所は無い（`grep -rn "from './quiz'" src | grep shuffle` が空であること）。

- [ ] **Step 4** `quiz.ts` の型と委譲を足す

```ts
import { makeKanjiReadQuiz, makeKanjiWriteQuiz } from './quiz-kanji';
```

```ts
// よみクイズの出題形式
//   word: 文字を見てイラストを選ぶ / picture: イラストを見て文字を選ぶ / listen: 聞いてイラストを選ぶ
//   initial: 「り」で はじまる のは？ → イラスト / blank: り？ご の ？ に入る文字を選ぶ（letters が選択肢、key が正解）
//   kanji-read: 字を見て読みを選ぶ（letters が読み、key が代表の読み）/ kanji-listen: 読みを聞いて字を選ぶ（choices が字）
type ReadKind = 'word' | 'picture' | 'listen' | 'initial' | 'blank' | 'kanji-read' | 'kanji-listen';
// 単語の 5 形式の割り当て。かんじ の 2 形式は quiz-kanji.ts が組むのでここには入れない
export const READ_KINDS: ReadKind[] = ['word', 'picture', 'listen', 'initial', 'blank'];
```

`makeReadQuiz` の先頭に委譲を足す。

```ts
export function makeReadQuiz(l: Lang, level: Level, n = QUESTIONS.read, rnd = Math.random): ReadQ[] {
  if (l === 'kanji') return makeKanjiReadQuiz(level, n, rnd);
  const pool = wordsOf(l, level);
```

かきクイズの型と `makeWriteQuiz` を次にする。

```ts
// かきクイズの出題形式。picture: イラストを見て書く / listen: 聞いて書く（絵なし）/ blank: 1 文字だけ ？ にして書く。順に出す
// kanji: 読みを見て（聞いて）字を書く。accept は正解にする字（同じ読みの字をまとめる）
type WriteKind = 'picture' | 'listen' | 'blank' | 'kanji';
export const WRITE_KINDS: WriteKind[] = ['picture', 'listen', 'blank'];
export type WriteQ = { word: Word; kind: WriteKind; blank?: number; accept?: string[] };
export function makeWriteQuiz(l: Lang, level: Level, n = QUESTIONS.write, rnd = Math.random): WriteQ[] {
  if (l === 'kanji') return makeKanjiWriteQuiz(level, n, rnd);
  return shuffle(wordsOf(l, level), rnd)
```

- [ ] **Step 5** `quiz-kanji.ts` を作る

```ts
import { KANJI, KANJI_ALL, READINGS, kanjiReading } from './kanji';
import { charWord } from './words';
import { shuffle } from './shuffle';
import type { Level, ReadQ, WriteQ } from './quiz';

// かんじ のクイズ。級は学年（Level 1〜3 = 1〜3 年）で、出題はその学年の字だけ。
// quiz.ts とは型だけを共有する（値を import すると循環になる）
const gradeChars = (level: Level) => KANJI[level - 1].chars;
const uniq = <T>(a: T[]) => [...new Set(a)];

// よみクイズ: 字を見て読みを選ぶ（kanji-read）と、読みを聞いて字を選ぶ（kanji-listen）を半分ずつ混ぜる
export function makeKanjiReadQuiz(level: Level, n = 10, rnd = Math.random): ReadQ[] {
  const pool = gradeChars(level);
  const qs = shuffle(pool, rnd)
    .slice(0, n)
    .map((c, i): ReadQ => {
      const reading = kanjiReading(c);
      if (i % 2 === 0) {
        // 外れは同じ学年の別の字の代表の読み。出題した字のどの読みとも一致しないものだけ
        const others = uniq(
          shuffle(
            pool.filter((o) => o !== c),
            rnd
          )
            .map(kanjiReading)
            .filter((r) => !READINGS[c].includes(r))
        ).slice(0, 2);
        return {
          kind: 'kanji-read',
          answer: charWord(c),
          key: reading,
          choices: [charWord(c)],
          letters: shuffle([reading, ...others], rnd)
        };
      }
      // 外れは流した読みをどの読みにも持たない字（き と聞いて 木 と 気 が並ばないように）
      const others = shuffle(
        pool.filter((o) => o !== c && !READINGS[o].includes(reading)),
        rnd
      ).slice(0, 2);
      const answer = charWord(c);
      return { kind: 'kanji-listen', answer, key: answer.id, choices: shuffle([c, ...others], rnd).map(charWord) };
    });
  return shuffle(qs, rnd);
}

// かきクイズ: 読みを見て字を書く。同じ読みを持つ字（440 字の中から）はどれを書いても正解
export function makeKanjiWriteQuiz(level: Level, n = 5, rnd = Math.random): WriteQ[] {
  return shuffle(gradeChars(level), rnd)
    .slice(0, n)
    .map((c) => {
      const reading = kanjiReading(c);
      return { word: charWord(c), kind: 'kanji', accept: KANJI_ALL.filter((o) => READINGS[o].includes(reading)) };
    });
}
```

- [ ] **Step 6** `WriteQuiz` に `accept` を足す

`src/lib/quiz-session.svelte.ts` の `WriteQuiz` の `get kind()` の下に次を足す。

```ts
  // おてほんなし で正解にする字（かんじ は同じ読みの字をまとめる）。省略時は Canvas が書く字だけを正解にする
  get accept() {
    return this.qs[this.i]?.accept;
  }
```

- [ ] **Step 7** `quiz.test.ts` のループを単語のある ことば に絞る

`src/lib/quiz.test.ts` の import に `import { TOTAL } from './badges';` を足し、`3 ことば × 3 級 とも …` と `かきクイズの穴埋めは …` の `for (const l of LANGS)` を `for (const l of LANGS.filter((x) => TOTAL(x).words > 0))` にする（2 か所）。`表示名が同じ 2 語は …` のループは `LANGS` のままでよい（かんじ でも `nameOf` は `w.name`）。

- [ ] **Step 8** 通す

Run `pnpm check && pnpm test:run`
Expected PASS。`quiz-kanji.test.ts` の 5 件を含む。

- [ ] **Step 9** lint / コミット

Run `pnpm lint`

```bash
git add src/lib/shuffle.ts src/lib/quiz-kanji.ts src/lib/quiz-kanji.test.ts src/lib/quiz.ts src/lib/quiz-session.svelte.ts src/lib/quiz.test.ts
git commit -m "feat: かんじ のクイズ出題（字を見て読み・読みを聞いて字・読みを見て書く。同じ読みの字は accept でまとめる）"
```

---

### Task 8: クイズ画面（よみ 2 形式・かき の読み提示・学年の文言）

**ファイル**

- Modify `src/lib/components/ReadPrompt.svelte`
- Modify `src/lib/components/ReadQuestion.svelte:10-16`
- Modify `src/routes/quiz/write/+page.svelte`
- Modify `src/routes/quiz/+page.svelte`

**Interfaces**

- Consumes `ReadQ.kind` の `kanji-read` / `kanji-listen`、`WriteQuiz.kind === 'kanji'`、`WriteQuiz.accept`、`kanjiReading`、`levelName`。

- [ ] **Step 1** `ReadPrompt.svelte` に 2 形式を足す

`import { kanjiReading } from '$lib/kanji';` を足し、`{:else if q.kind === 'blank'}` の前に次を足す。

```svelte
  {:else if q.kind === 'kanji-read'}
    <b class="target kyokasho">{nameOf(q.answer)}</b>
    <span>の よみかたは？</span>
  {:else if q.kind === 'kanji-listen'}
    <button
      class={['hear', 'big', { speaking }]}
      onclick={() => hear(kanjiReading(q.answer.name), info().speech)}
      ><Icon name="speaker" size={40} /> きく</button
    >
    <b class="target kyokasho">{kanjiReading(q.answer.name)}</b>
    <span>と よむ かんじは どれ？</span>
```

- [ ] **Step 2** `ReadQuestion.svelte` で読みの選択肢を出す

`items` と `pictures` を次にする。

```ts
const pictures = $derived(q.kind === 'word' || q.kind === 'listen' || q.kind === 'initial');
// 文字列の選択肢: 穴埋めは文字、かんじ の「字を見て読み」は読み。どちらも letters に入っている
const texts = $derived(q.kind === 'blank' || q.kind === 'kanji-read');
const items: { key: string; label: string; word?: Word }[] = $derived(
  texts
    ? q.letters!.map((c) => ({ key: c, label: c }))
    : q.choices.map((w) => ({ key: w.id, label: nameOf(w), word: w }))
);
```

`class` の `letter: q.kind === 'blank'` を `letter: q.kind === 'blank' || q.kind === 'kanji-listen'` にする（1 字の選択肢を出題の字と同じ 56px にする）。読みの選択肢は既定の 40px。

- [ ] **Step 3** かきクイズの読み提示と `accept`

`src/routes/quiz/write/+page.svelte` の import に `import { kanjiReading } from '$lib/kanji';` を足し、`.pic` の中を次にする。

```svelte
<div class="card pic">
  {#if w.kind === 'kanji'}
    <b class="yomi kyokasho">{kanjiReading(w.word.name)}</b>
    <button class={['hear', { speaking }]} onclick={() => hear(kanjiReading(w.word.name), info().speech)}
      ><Icon name="speaker" size={22} /> きく</button
    >
  {:else if w.kind === 'listen'}
    <button class={['hear', 'big', { speaking }]} onclick={() => hear(nameOf(w.word), info().speech)}
      ><Icon name="speaker" size={40} /> きく</button
    >
    <small>きこえた ことばを かこう</small>
  {:else}
    <img src={imageUrl(w.word)} alt="" width="210" height="150" loading="eager" />
    <button class={['hear', { speaking }]} onclick={() => hear(nameOf(w.word), info().speech)}
      ><Icon name="speaker" size={22} /> きく</button
    >
  {/if}
</div>
```

`<Canvas …>` に `accept={w.accept}` を足す。案内文を次にする。

```svelte
<p class="hint">
  {w.msg ||
    (w.mode === 'test'
      ? w.kind === 'blank'
        ? '？ の もじを かこう'
        : w.kind === 'kanji'
          ? 'よみを みて かんじを かこう'
          : `${w.k + 1} もじめを かいてみよう`
      : 'まるから せんに そって なぞろう')}
</p>
```

`<style>` に次を足す。

```css
.yomi {
  font-size: 56px;
  color: var(--blue);
}
```

`<meta name="description">` は「えを みて もじを かく クイズ。」のままでよい。

- [ ] **Step 4** クイズ選択画面の文言を ことば で分ける

`src/routes/quiz/+page.svelte` の `KINDS` / `LEVELS` を `$derived` にする。

```ts
const kanji = $derived(lang.v === 'kanji');
const KINDS = $derived<{ id: Kind; icon: 'eye' | 'pencil'; name: string; desc: string }[]>([
  {
    id: 'read',
    icon: 'eye',
    name: 'よみクイズ',
    desc: kanji ? 'かんじの よみを こたえよう' : 'もじを よんで えを えらぼう'
  },
  {
    id: 'write',
    icon: 'pencil',
    name: 'かきクイズ',
    desc: kanji ? 'よみを みて かんじを かこう' : 'えを みて もじを かこう'
  }
]);
const LEVELS = $derived<{ lv: Level; hint: string }[]>(
  kanji
    ? [
        { lv: 1, hint: '80 じ' },
        { lv: 2, hint: '160 じ' },
        { lv: 3, hint: '200 じ' }
      ]
    : [
        { lv: 1, hint: 'みじかい ことば' },
        { lv: 2, hint: 'ふつうの ことば' },
        { lv: 3, hint: 'ながい ことば' }
      ]
);
```

- [ ] **Step 5** 通す

Run `pnpm check && pnpm lint && pnpm test:run && pnpm vitals --diff`
Expected エラーなし、Health 100。`ReadPrompt.svelte` が 200 行を超えたら、かんじ の 2 分岐を `KanjiPrompt.svelte` に切り出す。

- [ ] **Step 6** コミット

```bash
git add src/lib/components/ReadPrompt.svelte src/lib/components/ReadQuestion.svelte src/routes/quiz
git commit -m "feat: かんじ のクイズ画面（読みの選択肢、読みを聞いて字を選ぶ、読みを見て書く、学年の文言）"
```

---

### Task 9: 練習画面を 1 文字練習で正しく動かす

**ファイル**

- Modify `src/lib/practice.svelte.ts:55-62,205-262`
- Modify `src/lib/components/CompleteModal.svelte:7-15`
- Modify `src/lib/components/WordCard.svelte`
- Modify `src/lib/components/WordWithHear.svelte:7-8,50`
- Modify `src/routes/practice/+page.svelte:21,92`
- Modify `src/routes/chars/+page.svelte`
- Modify `src/lib/practice.test.ts`

**Interfaces**

- Produces `starOf(w: Word)` / `crownOf(w: Word)`（`practice.svelte.ts`。1 文字単語は `charCleared` / `charGold`、それ以外は `wordStar` / `wordCrown`）。`resolveWord(id, 'kanji')` の既定は `char-一`。

- [ ] **Step 1** 失敗するテストを書く

`src/lib/practice.test.ts` の import を次のように足す（`starOf`, `crownOf` を `./practice.svelte` から、`charWord` を `./words` から）。

```ts
import { PracticeSession, nextMode, nextWordId, openWords, resolveWord, starOf, crownOf } from './practice.svelte';
import { wordById, charWord } from './words';
```

`resolveWord` のテストに次を足す。

```ts
expect(resolveWord(null, 'kanji').id).toBe('char-一');
expect(resolveWord('bus', 'kanji').id).toBe('char-一'); // 単語は かんじ では書けない
expect(resolveWord('char-花', 'kanji').id).toBe('char-花');
expect(resolveWord('char-花', 'ja').id).toBe('patocar');
```

`describe('PracticeSession', …)` の中に次を足す。

```ts
it('1 文字練習: 星・王冠は字のクリア・金星で決まり、完了モーダルは新しく取ったときだけ出る', () => {
  setLang('kanji');
  const one = charWord('一');
  expect([starOf(one), crownOf(one)]).toEqual([false, false]);
  const s = new PracticeSession(one);
  s.done(ok('trace'));
  vi.runAllTimers();
  s.done(ok('trace'));
  vi.runAllTimers();
  s.done(ok('free', 0.9));
  vi.runAllTimers();
  expect([s.complete, starOf(one), crownOf(one)]).toEqual([true, true, false]); // クリアで ほし
  s.replay();
  s.done(ok('trace'));
  vi.runAllTimers();
  s.done(ok('trace'));
  vi.runAllTimers();
  s.done(ok('free', 0.9));
  vi.runAllTimers();
  expect(s.complete).toBe(false); // クリア済みのやり直しでは出ない
  s.challenge();
  expect(s.mode).toBe('test');
  s.done(ok('test'));
  vi.runAllTimers();
  expect([s.complete, crownOf(one)]).toEqual([true, true]); // 金星で おうかん
  s.complete = false;
  s.challenge();
  expect(s.complete).toBe(false); // 金星済みなら ちょうせん は何もしない
  setLang('ja');
});
```

- [ ] **Step 2** 失敗を確かめる

Run `pnpm exec vitest run src/lib/practice.test.ts`
Expected FAIL（`starOf` が無い、`resolveWord(null, 'kanji')` が `patocar`）

- [ ] **Step 3** `practice.svelte.ts` を変える

import に `charWord` を足す（`import { WORDS, wordById, charWordId, charWord, isCharWord, type Word } from './words';`）。`resolveWord` を次にする。

```ts
// URL の w= から練習する単語を決める。その言語に書き順の無い文字を含む（例: 言語が en のときの char-あ）なら既定に戻す。
// かんじ は単語を持たないので既定も 1 文字（学年順の先頭）
export function resolveWord(id: string | null, l: Lang): Word {
  const w = id ? wordById(id) : undefined;
  const strokes = strokesOf(l);
  if (w && lettersOf(w, l).every((c) => c in strokes)) return w;
  return l === 'kanji' ? charWord(charsOf(l)[0]) : wordById('patocar')!;
}

// 星・王冠。1 文字練習は単語の記録を持たないので、字のクリア・金星で決める
export const starOf = (w: Word) => (isCharWord(w) ? charCleared(w.name) : wordStar(w));
export const crownOf = (w: Word) => (isCharWord(w) ? charGold(w.name) : wordCrown(w));
```

`done()` の `wasW` / `wasG` と、あとの 2 か所を次にする。

```ts
const wasC = charCleared(c),
  wasW = starOf(this.word),
  wasG = crownOf(this.word);
```

```ts
    if (!wasW && starOf(this.word)) {
```

```ts
      // 完了モーダルは新しく星か王冠を取ったときだけ。クリア済みの単語をやり直したときは出さない
      else if (!wasW || (!wasG && crownOf(this.word))) this.complete = true;
```

`wordDone` / `wordStar` の既存の使い方はそのまま（単語の星の記録は変えない）。

- [ ] **Step 4** `CompleteModal.svelte` と `WordCard.svelte`

`CompleteModal.svelte` は `import { wordCrown } from '$lib/progress.svelte';` を `import { crownOf } from '$lib/practice.svelte';` にし、`const crown = $derived(crownOf(word));` にする。

`WordCard.svelte` を次にする（角の印は `starOf` / `crownOf`、1 文字単語は絵を要求せず字を出し、かんじ は読みを添える）。

```svelte
<script lang="ts">
  import { isCharWord, type Word } from '$lib/words';
  import { imageUrl } from '$lib/image';
  import { starOf, crownOf } from '$lib/practice.svelte';
  import { nameOf, subOf, lang } from '$lib/lang.svelte';
  import { kanjiReading } from '$lib/kanji';
  import Icon from './Icon.svelte';
  // ghost: イラストを灰色のシルエットにする（かくし演出でイラストが跳び出している間）。
  // fill: 親のグリッドのマス幅に合わせる（ホームの一覧。画面幅で右に余白が残らないように）
  let {
    word,
    onclick,
    size = 180,
    lazy = false,
    ghost = false,
    fill = false
  }: { word: Word; onclick?: () => void; size?: number; lazy?: boolean; ghost?: boolean; fill?: boolean } = $props();
  let missing = $state(false);
  // 1 文字練習にはイラストが無いので、取りに行かずに字を大きく出す
  const plain = $derived(missing || isCharWord(word));
</script>

<button class="card" style:width={fill ? '100%' : `${size}px`} {onclick}>
  {#if crownOf(word)}<span class="badge gold"><Icon name="crown" size={18} fill /></span>{:else if starOf(word)}<span
      class="badge"><Icon name="star" size={18} fill /></span
    >{/if}
  {#if plain}
    <span class="initial kyokasho" style:height="{size * 0.6}px">{word.name[0]}</span>
  {:else}
    <img
      class={{ ghost }}
      src={imageUrl(word)}
      alt=""
      width={size - 20}
      height={size * 0.6}
      loading={lazy ? 'lazy' : 'eager'}
      style:height="{size * 0.6}px"
      onerror={() => (missing = true)}
    />
  {/if}
  {#if isCharWord(word) && lang.v === 'kanji'}
    <span class="name kyokasho">{kanjiReading(word.name)}</span>
  {:else}
    <span class="name kyokasho">{nameOf(word)}</span>
  {/if}
  {#each subOf(word) as line (line)}<span class="desc">{line}</span>{/each}
</button>
```

`<style>` は変えない。

- [ ] **Step 5** 読み上げを `speechOf` にする

`WordWithHear.svelte` は import を `import { speaker, sfx, unlock, speechOf } from '$lib/audio';` と `import { isCharWord, type Word } from '$lib/words';` にし、スピーカーの `hear(nameOf(word), info().speech)` を `hear(isCharWord(word) ? speechOf(word.name) : nameOf(word), info().speech)` にする。

`src/routes/practice/+page.svelte` は `import { speaker, sfx, speechOf } from '$lib/audio';` にし（`readingOf` を外す）、右の「きく」を `hear(speechOf(s.c), info().speech)` にする。

- [ ] **Step 6** `/chars` は かんじ ではホームへ戻す

`src/routes/chars/+page.svelte` の `<script>` に次を足す（`import { goto } from '$app/navigation';` と `import { resolve } from '$app/paths';` も）。

```ts
// かんじ ではホームが字の一覧を兼ねる。この画面は ひらがな の表を出してしまい、押すと書けない字で練習画面が落ちる
$effect(() => {
  if (lang.v === 'kanji') goto(resolve('/'), { replaceState: true });
});
```

- [ ] **Step 7** 通す

Run `pnpm check && pnpm lint && pnpm test:run && pnpm vitals --diff`
Expected PASS、Health 100。

- [ ] **Step 8** コミット

```bash
git add src/lib/practice.svelte.ts src/lib/practice.test.ts src/lib/components/CompleteModal.svelte src/lib/components/WordCard.svelte src/lib/components/WordWithHear.svelte src/routes/practice/+page.svelte src/routes/chars/+page.svelte
git commit -m "feat: 1 文字練習の星・王冠を字のクリア・金星で決め、かんじ の既定の字と読み上げを整える"
```

---

### Task 10: ホーム（4 つの ことば、学年のマス、テーマ色、ロゴ）

**ファイル**

- Create `src/lib/components/KanjiGrid.svelte`
- Modify `src/routes/+page.svelte`
- Modify `src/lib/components/LangToggle.svelte`
- Modify `static/app.css:21-30`
- Modify `scripts/make-icon.ts`
- Create `static/logo-mark-kanji.svg`（生成物）

**Interfaces**

- Consumes `KANJI` / `kanjiReading`、`charCleared` / `charGold`、`charWordId`、`practiceUrl`、`TOTAL`。

- [ ] **Step 1** `KanjiGrid.svelte` を作る

```svelte
<script lang="ts">
  import Icon from './Icon.svelte';
  import { practiceUrl } from '$lib/nav';
  import { KANJI, kanjiReading } from '$lib/kanji';
  import { charWordId } from '$lib/words';
  import { charCleared, charGold } from '$lib/progress.svelte';
  import { unlock } from '$lib/audio';
  // ホーム（かんじ）: 学年ごとに字のマスを並べる。単語カードの代わり
</script>

{#each KANJI as g (g.grade)}
  <h2>{g.name} <small>{g.chars.filter(charCleared).length} / {g.chars.length}</small></h2>
  <div class="grid">
    {#each g.chars as c (c)}
      <a class={['card', 'cell', { done: charCleared(c) }]} href={practiceUrl(charWordId(c))} onclick={unlock}>
        <span class="ch kyokasho">{c}</span>
        <span class="yomi">{kanjiReading(c)}</span>
        {#if charGold(c)}<span class="s gold"><Icon name="crown" size={16} fill /></span>{:else if charCleared(c)}<span
            class="s"><Icon name="star" size={16} fill /></span
          >{/if}
      </a>
    {/each}
  </div>
{/each}

<style>
  h2 {
    font-size: 18px;
    color: var(--sub);
    margin: 22px 0 8px;
  }
  h2 small {
    font-size: 14px;
    font-weight: normal;
    margin-left: 6px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
    gap: 8px;
  }
  .cell {
    position: relative;
    height: 96px;
    display: grid;
    place-content: center;
    gap: 2px;
    text-decoration: none;
    color: var(--ink);
    text-align: center;
  }
  .ch {
    font-size: 34px;
    font-weight: bold;
    line-height: 1.1;
  }
  .yomi {
    font-size: 12px;
    color: var(--sub);
  }
  .done {
    background: #fff8dc;
  }
  .s {
    position: absolute;
    right: 6px;
    bottom: 6px;
    color: var(--star);
    display: grid;
  }
  .s.gold {
    color: var(--warn);
  }
</style>
```

- [ ] **Step 2** ホームを分岐する

`src/routes/+page.svelte` の import に `import KanjiGrid from '$lib/components/KanjiGrid.svelte';` を足し、`<script>` に `const kanji = $derived(lang.v === 'kanji');` を足す。`nav` の たんご の行と「もじから えらぶ」を次にする。

```svelte
        <span class="pl">もじ {s.chars}/{total.chars}<Bar have={s.chars} need={total.chars} /></span>
        {#if total.words}
          <span class="pl"
            >たんご {s.words}/{total.words}<Bar have={s.words} need={total.words} color="var(--teal)" /></span
          >
        {/if}
      </a>
      <a class="card btn quiz" href={resolve('/quiz')}><Icon name="bulb" size={22} /> クイズ</a>
      {#if !kanji}<a class="card btn" href={resolve('/chars')}>もじから えらぶ</a>{/if}
```

本文を次にする。

```svelte
{#key lang.v}
  <div class="words" in:fly={{ x: 80, duration: 350 }}>
    {#if kanji}
      <KanjiGrid />
    {:else}
      <ContinueCard />
      {#each CATEGORIES as cat (cat)}
        <h2>{cat}</h2>
        <div class="row">
          {#each WORDS.filter((w) => w.category === cat) as w, n (w.id)}
            <WordCard
              word={w}
              size={150}
              fill
              lazy={cat !== CATEGORIES[0] || n >= 7}
              onclick={() => {
                unlock();
                goto(practiceUrl(w.id));
              }}
            />
          {/each}
        </div>
      {/each}
    {/if}
  </div>
{/key}
```

`<meta name="description">` の「ひらがな書き練習アプリ」は「ひらがな・カタカナ・漢字・英語の書き練習アプリ」にする。

- [ ] **Step 3** `LangToggle.svelte` の「漢」を教科書体にする

ボタンの中身を `<span class={{ kyokasho: l === 'kanji' }}>{info(l).glyph}</span> <small>{info(l).short}</small>` にする。`--step` は 88px のまま（4 つで 352px。1240 幅以下は 56px × 4 = 224px）。Task 13 のスクリーンショットで 1024 幅の見出し行が折り返さないことを確かめ、折り返すなら `--step: 80px` にする。

- [ ] **Step 4** テーマ色

`static/app.css` の `[data-lang='en']` の後に次を足す（赤系。ひらがな 青・かたかな 緑・えいご オレンジ と並ぶ。紫は使わない）。

```css
[data-lang='kanji'] {
  --blue: #c2495f;
  --teal: #a63b4f;
  --dark: #962e44;
}
```

- [ ] **Step 5** ロゴ

`scripts/make-icon.ts` を次のように変える。

- 先頭コメントを「実行: node scripts/make-icon.ts [文字] [地の色] [影の色] [出力名]」にし、例に `例(かんじ版): node scripts/make-icon.ts 漢 "#c2495f" "#962e44" logo-mark-kanji` を足す。
- `import { STROKES_KANJI } from '../src/lib/strokes-kanji.ts';` を足す。
- 引数と字の取り方を次にする。

```ts
const [glyph = 'あ', main = '#4f7cae', dark = '#2f5b8a', out = 'logo-mark'] = process.argv.slice(2);
const GLYPHS: Record<string, string[]> = { A: ['M18 92 L54.5 14 L91 92', 'M31 66 H78'] };
const ds = STROKES[glyph] ?? STROKES_KANA[glyph] ?? STROKES_KANJI[glyph] ?? GLYPHS[glyph];
if (!ds) throw new Error(`no strokes for ${glyph}`);
// 画数の多い漢字は線を細くしないと潰れる
const sw = ds.length > 8 ? 7 : 15;
```

- `stroke-width="15"` の 2 か所を `stroke-width="${sw}"` にする。
- 書き出しを次にする（PWA アイコンは ひらがな のときだけ。ほかの ことば で回して上書きしないため）。

```ts
if (glyph === 'あ') writeFileSync('static/icon.svg', icon);
writeFileSync(
  `static/${out}.svg`,
  icon.replace('<rect width="512" height="512" fill=', '<rect width="512" height="512" rx="112" fill=')
);
console.log(
  `static/${out}.svg を書き出した${glyph === 'あ' ? '（static/icon.svg も）' : ''}。PNG 化: qlmanage -t -s 512 -o static static/icon.svg && mv static/icon.svg.png static/icon-512.png && sips -z 180 180 static/icon-512.png --out static/icon-180.png`
);
```

Run `node scripts/make-icon.ts 漢 "#c2495f" "#962e44" logo-mark-kanji`
Expected `static/logo-mark-kanji.svg` ができる。`git status` で `static/icon.svg` と `static/logo-mark.svg` が変わっていないこと。見た目は `qlmanage -t -s 256 -o <scratchpad> static/logo-mark-kanji.svg` で PNG にして Read で見る。字が潰れて読めなければ `sw` を 6 にして作り直す。

- [ ] **Step 6** 通す

Run `pnpm check && pnpm lint && pnpm test:run && pnpm vitals --diff`
Expected PASS、Health 100。`+page.svelte` が 200 行を超えたら、`nav` の進み具合カードを `ProgressCard.svelte` に切り出す。

- [ ] **Step 7** コミット

```bash
git add src/lib/components/KanjiGrid.svelte src/lib/components/LangToggle.svelte src/routes/+page.svelte static/app.css scripts/make-icon.ts static/logo-mark-kanji.svg
git commit -m "feat: ホームに かんじ（学年ごとの字のマス、4 つ目のトグル、テーマ色、ロゴ）"
```

---

### Task 11: 教科書体の漢字フォント

**ファイル**

- Create `static/fonts/KleeOne-Regular-kanji.woff2`、`static/fonts/KleeOne-SemiBold-kanji.woff2`
- Modify `static/app.css:45-56`

**Interfaces**

- Consumes `KANJI_ALL`。

- [ ] **Step 1** 道具を用意する

scratchpad に venv を作り fonttools と brotli を入れ、Klee One の TTF を Google Fonts のリポジトリから取る。

```bash
S=/private/tmp/claude-501/-Users-oekazuma-localRepo-kakikaki--claude-worktrees-kakikaki-intro-video-21b1a6/d030e799-1ab2-4f6e-a39c-d2fbdc9d30f6/scratchpad
python3 -m venv $S/venv && $S/venv/bin/pip install -q fonttools brotli
for w in Regular SemiBold; do curl -sL -o $S/KleeOne-$w.ttf https://github.com/google/fonts/raw/main/ofl/kleeone/KleeOne-$w.ttf; done
ls -la $S/KleeOne-*.ttf
```

Expected 2 本とも 4MB 前後。

- [ ] **Step 2** 440 字のコードポイント一覧を作る

```bash
cd /Users/oekazuma/localRepo/kakikaki/.claude/worktrees/kakikaki-intro-video-21b1a6
node --input-type=module -e "const { KANJI_ALL } = await import('./src/lib/kanji.ts'); console.log(KANJI_ALL.map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(','))" > $S/kanji-unicodes.txt
wc -c $S/kanji-unicodes.txt
```

- [ ] **Step 3** 切り出す

```bash
for w in Regular SemiBold; do $S/venv/bin/pyftsubset $S/KleeOne-$w.ttf --unicodes="$(cat $S/kanji-unicodes.txt)" --flavor=woff2 --layout-features='*' --output-file=static/fonts/KleeOne-$w-kanji.woff2; done
$S/venv/bin/python -c "
from fontTools.ttLib import TTFont
for w in ['Regular','SemiBold']:
    f = TTFont(f'static/fonts/KleeOne-{w}-kanji.woff2')
    n = len([u for u in f.getBestCmap() if 0x4E00 <= u <= 0x9FFF])
    print(w, n)
"
ls -la static/fonts/
```

Expected 両方 `440`。少なければ元の TTF に無い字なので、その字を報告して止まる。

- [ ] **Step 4** `app.css` の `@font-face`

既存の 2 つに `unicode-range` を足し、漢字用の 2 つを足す。

```css
/* 教科書体（Klee One、SIL OFL）。書き順のお手本（KanjiVG）と同じ字形で り・き・さ を見せるため、ひらがな・カタカナ・英字を自前で持つ。
   説明文までこの書体だと読みづらいので、UI は丸ゴシックのまま、書く対象の文字・単語だけ .kyokasho で使う。
   漢字（小学 1〜3 年の 440 字）は別ファイルにして unicode-range で分け、漢字を描く画面でだけ読み込まれるようにする。
   既存の 2 つにも範囲を書くのは、範囲の無い face が漢字にも一致し、字が無くても同じ family の別 face には落ちないため */
@font-face {
  font-family: 'Klee One';
  font-weight: 400;
  font-display: swap;
  src: url('fonts/KleeOne-Regular.woff2') format('woff2');
  unicode-range:
    U+0020-007E, U+00A0-00FF, U+2010-2027, U+3000-303F, U+3040-309F, U+30A0-30FF, U+FF01-FF5E, U+2190-2193, U+2605-2606,
    U+25CB, U+25EF, U+00D7;
}
@font-face {
  font-family: 'Klee One';
  font-weight: 700;
  font-display: swap;
  src: url('fonts/KleeOne-SemiBold.woff2') format('woff2');
  unicode-range:
    U+0020-007E, U+00A0-00FF, U+2010-2027, U+3000-303F, U+3040-309F, U+30A0-30FF, U+FF01-FF5E, U+2190-2193, U+2605-2606,
    U+25CB, U+25EF, U+00D7;
}
@font-face {
  font-family: 'Klee One';
  font-weight: 400;
  font-display: swap;
  src: url('fonts/KleeOne-Regular-kanji.woff2') format('woff2');
  unicode-range: U+4E00-9FFF;
}
@font-face {
  font-family: 'Klee One';
  font-weight: 700;
  font-display: swap;
  src: url('fonts/KleeOne-SemiBold-kanji.woff2') format('woff2');
  unicode-range: U+4E00-9FFF;
}
```

漢字用の `unicode-range` は CJK 統合漢字の全域 `U+4E00-9FFF` でよい（この範囲を描くのは かんじ の画面だけで、ファイルには 440 字しか入っていないので他の字はシステムフォントに落ちる）。

- [ ] **Step 5** 確かめる

Run `pnpm build`
Expected 成功。`build/fonts/` に 4 本。scratchpad の静的サーバー（Task 13 の `serve.mjs`）で `/kakikaki/` を開き、かんじ に切り替えてから `read_network_requests` か Playwright の `page.on('request')` で `KleeOne-Regular-kanji.woff2` が取られること、ひらがな のホームでは取られないことを確かめる。

- [ ] **Step 6** コミット

```bash
git add static/fonts/KleeOne-Regular-kanji.woff2 static/fonts/KleeOne-SemiBold-kanji.woff2 static/app.css
git commit -m "feat: 教科書体の漢字 440 字を別の woff2 にして unicode-range で読み分ける"
```

---

### Task 12: 実績・保護者向け画面・説明文

**ファイル**

- Modify `src/lib/components/trophies/StatTiles.svelte`
- Modify `src/lib/components/about/LangOverview.svelte`、`Ring.svelte`
- Modify `src/lib/components/DeleteConfirm.svelte:71`
- Modify `src/routes/about/+page.svelte:45`
- Modify `src/lib/components/about/Guide.svelte:9,33-35`
- Modify `README.md:17,25`

**Interfaces**

- Consumes `TOTAL(l).words`。`Ring` の `words` を省略可にする。

- [ ] **Step 1** `StatTiles.svelte`

`tiles` を単語の無い ことば では 2 枚にし、カテゴリの棒を隠す。

```ts
const tiles = $derived(
  [
    { label: 'もじ', icon: 'pencil', have: s.chars, need: total.chars, color: 'var(--blue)' },
    { label: 'きんのほし', icon: 'star', have: s.gold, need: total.chars, color: 'var(--star)' },
    { label: 'たんご', icon: 'book', have: s.words, need: total.words, color: 'var(--teal)' },
    { label: 'おうかん', icon: 'crown', have: s.crowns, need: total.words, color: 'var(--warn)' }
  ].filter((t) => t.need > 0) as {
    label: string;
    icon: 'pencil' | 'star' | 'book' | 'crown';
    have: number;
    need: number;
    color: string;
  }[]
);
```

（`icon` の型は `Icon` の `name` に合わせる。`as const` は `.filter` の前に付けられないのでこの形にする。）カテゴリの `<section class="card cats">` を `{#if total.words}` … `{/if}` で囲む。`.tiles` の `grid-template-columns: repeat(4, 1fr)` を `repeat(auto-fit, minmax(200px, 1fr))` にして 2 枚でも広がるようにする。

- [ ] **Step 2** `Ring.svelte` と `LangOverview.svelte`

`Ring.svelte` の props を `let { chars, words }: { chars: [number, number]; words?: [number, number] } = $props();` にし、内側の 2 つの `<circle>`（`r={R2}` の track と words）を `{#if words}` … `{/if}` で囲む。コメントを「達成率のリング。外が文字、内が単語（単語の無い ことば では外だけ）」にする。

`LangOverview.svelte` を次にする。

```svelte
<Ring chars={[d.chars, total.chars]} words={total.words ? [d.words, total.words] : undefined} />
<span
  ><span class="c">●</span> 文字 {d.chars}/{total.chars}
  {#if total.words}<span class="w">●</span> 単語 {d.words}/{total.words}{/if}</span
>
<span class="sub"
  >金の星 {d.gold}{#if total.words}
    · 王冠 {d.crowns}{/if} · メダル {d.medals}/{d.medalTotal}</span
>
```

- [ ] **Step 3** 文言

- `DeleteConfirm.svelte` の「ひらがな・かたかな・えいご の上の記録」を「ひらがな・かたかな・かんじ・えいご の上の記録」に。
- `src/routes/about/+page.svelte` の「ホーム上部で ひらがな・かたかな・えいご を切り替えます。」を「ホーム上部で ひらがな・かたかな・かんじ・えいご を切り替えます。」に。
- `Guide.svelte` の「あ ひらがな｜ア かたかな｜A えいご」を「あ ひらがな｜ア かたかな｜漢 かんじ｜A えいご」に。「連続日数は 3 ことば をまたいで」を「4 ことば をまたいで」に。クイズの行の後に次を足す。

```svelte
<li>
  かんじ は小学 1〜3 年の 440 字を学年ごとに並べ、字と読みを 1
  字ずつ練習します。クイズは学年で範囲を絞り、よみ（字を見て読みを選ぶ・読みを聞いて字を選ぶ）と
  かき（読みを見て書く。同じ読みの字はどれを書いても正解）です。
</li>
```

- `README.md` の「ひらがな・カタカナ・英語の切り替え」（動画の alt）はそのまま。25 行目の見出しを「**ひらがな・かたかな・かんじ・えいご**」にし、文中に「かんじ（小学 1〜3 年の 440 字。学年ごとに字のマスが並び、1 字ずつ読みと一緒に練習。画面の色は赤）」を足す。

- [ ] **Step 4** 通す

Run `pnpm check && pnpm lint && pnpm test:run && pnpm vitals --diff`
Expected PASS、Health 100。README の textlint は `~/.claude/textlint/node_modules/.bin/textlint --config ~/.claude/textlint/.textlintrc.json README.md`。

- [ ] **Step 5** コミット

```bash
git add src/lib/components/trophies/StatTiles.svelte src/lib/components/about/LangOverview.svelte src/lib/components/about/Ring.svelte src/lib/components/DeleteConfirm.svelte src/routes/about/+page.svelte src/lib/components/about/Guide.svelte README.md
git commit -m "feat: 単語の無い ことば では たんご・おうかん の表示を出さない。かんじ の説明を つかいかた と README に足す"
```

---

### Task 13: 画面確認・CLAUDE.md・全体検証

**ファイル**

- Modify `CLAUDE.md`
- scratchpad `pw/kanji.mjs`（一時）

- [ ] **Step 1** ビルドして Playwright で撮る

`pnpm build` のあと、scratchpad の `pw/serve.mjs`（`build/` を `http://localhost:4173/kakikaki/` で配る静的サーバー。無ければ Task 11 の Step 5 で作ったものを使う）を起動し、次のスクリプトを `pw/kanji.mjs` として実行する。

```js
import { chromium } from 'playwright';
const base = 'http://localhost:4173/kakikaki';
const b = await chromium.launch();
for (const [w, h] of [
  [1024, 768],
  [1180, 820]
]) {
  const page = await b.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.goto(base + '/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      'kk:profiles',
      JSON.stringify({ list: [{ id: 'p1', name: 'わたし', avatar: 'cat', lang: 'kanji' }], cur: 'p1' })
    );
    localStorage.setItem('kk:lang', JSON.stringify('kanji'));
    localStorage.setItem(
      'kk:p1:kanji:progress',
      JSON.stringify({ 一: { trace: 2, free: 1, test: 1 }, 二: { trace: 2, free: 1, test: 0 } })
    );
  });
  await page.goto(base + '/');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `kanji-home-${w}.png` });
  console.log(
    w,
    'header wraps:',
    await page.evaluate(() => document.querySelector('header').getBoundingClientRect().height > 90)
  );
  await page.goto(base + '/practice?w=char-%E8%8A%B1');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `kanji-practice-${w}.png` });
  console.log(w, 'card text:', await page.evaluate(() => document.querySelector('.wordbox')?.textContent?.trim()));
  await page.goto(base + '/quiz');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `kanji-quiz-${w}.png` });
  await page.goto(base + '/quiz/read?level=1');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `kanji-read-${w}.png` });
  await page.goto(base + '/quiz/write?level=1');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `kanji-write-${w}.png` });
  await page.goto(base + '/trophies');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `kanji-trophies-${w}.png` });
  await page.goto(base + '/about/progress');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `kanji-progress-${w}.png` });
  await page.close();
}
await b.close();
```

Expected `pageerror` が 1 つも出ない。`header wraps` が両方 `false`（`true` なら `LangToggle` の `--step` を 80px にして撮り直す）。各 PNG を Read で見て、ホームに 3 段のマス、練習画面のカードに「花」と「はな」、クイズ選択に 1ねんせい 〜 3ねんせい と 80 じ 〜 200 じ、よみクイズに読みか字の選択肢、かきクイズに読みとスピーカー、実績に たんご のタイルが無いこと、保護者向けに かんじ のカードが 1 本リングで出ることを確かめる。気になる所は直して撮り直す。

- [ ] **Step 2** ひらがな が変わっていないことを確かめる

同じスクリプトで `lang` を `ja` にした版（`kk:lang` と profile の `lang` を `'ja'`、progress を `kk:p1:ja:progress`、練習は `/practice?w=dog`）を 1180×820 で撮り、ホームの単語カード・つづきから・もじから えらぶ、練習画面の絵と読み上げボタン、実績の 4 タイルが今までどおり出ることを見る。

- [ ] **Step 3** `CLAUDE.md` を更新する

次を書き加える（既存の文を直す形で）。

- 概要の「ひらがな・カタカナ・アルファベット」に 漢字（小学 1〜3 年の 440 字）を足す。
- コマンドの `pnpm strokes` の説明に `strokes-kanji.ts`（漢字）を足し、`pnpm icon` の説明に「出力名を 4 つ目の引数で変える。PWA アイコンは ひらがな のときだけ書く」を足す。
- フォントの段落に、漢字用の 2 本（`KleeOne-*-kanji.woff2`、`unicode-range: U+4E00-9FFF`、既存の 2 本にも範囲を明示）と再生成の手順（Task 11 の Step 1〜3 のコマンド。`--unicodes` は `kanji.ts` の 440 字）を足す。
- アーキテクチャの冒頭を「ひらがな（`ja`）・カタカナ（`kana`）・漢字（`kanji`）・英語（`en`）の 4 言語」にし、漢字の段落を足す。内容は次のとおり。`kanji.ts`（学年ごとの字と読み、先頭が代表の読み、`kanjiReading`）、`strokes-kanji.ts`（大きさは Task 2 で控えた値）、練習は 1 文字練習（`char-一`）で `resolveWord` の既定は学年順の先頭、星・王冠は `starOf` / `crownOf`（1 文字単語は字のクリア・金星）、ホームは `KanjiGrid`、`/chars` はホームへ戻す、読み上げは `audio.ts` の `speechOf`、クイズは `quiz-kanji.ts`（級 = 学年、`levelName`、よみ 2 形式、かき は `accept` で同じ読みの字を正解に。`passes(targets, …)`）、`TOTAL('kanji').words === 0` で単語系メダル・たんご のタイル・二重リング・つづきから・もじから えらぶ を出さない、メダルの刻みは `STEPS`、段「がくねん」、テーマ色は赤系。
- `badges.ts` の説明の「行グループは ja/kana が五十音の行、en は …」に「kanji は学年」を足す。
- `viewport` などは変えない。

書いたら `~/.claude/textlint/node_modules/.bin/textlint --config ~/.claude/textlint/.textlintrc.json CLAUDE.md` と `pnpm exec prettier --check CLAUDE.md` を通す。

- [ ] **Step 4** 全体検証

Run `pnpm verify`
Expected lint / check / test:run / vitals / build がすべて成功。

- [ ] **Step 5** コミット

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md に かんじ（4 つ目の ことば）の構成を書く"
```

- [ ] **Step 6** 報告

ユーザーに、スクリーンショット（ホーム・練習・クイズ・実績）を `SendUserFile` で送り、テーマ色（赤系 `#c2495f`）でよいか、読みの一覧（`kanji.ts`）に直したい所がないかを聞く。push はユーザーの指示を待つ。
