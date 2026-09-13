<p align="center">
  <img src="static/logo.svg" alt="かきかき ひらがな" width="520">
</p>

<p align="center">
  iPad 横画面で使う、子ども向けのひらがな書き練習 PWA。<br>
  好きな単語を選んで、なぞって、じぶんで書いて、星を集める。
</p>

<p align="center">
  <a href="https://oekazuma.github.io/kakikaki-hiragana/">https://oekazuma.github.io/kakikaki-hiragana/</a>
</p>

---

![ホーム画面](docs/images/home.png)

![練習画面](docs/images/practice.png)

## 特徴

- **3 つのモード**
  - なぞる: 色のついた丸から書き順どおりに指を動かす。線から外れるとやり直し。
  - じぶんで かく: お手本の上に自由に書く。線の正確さと書き順で星 1〜3 を採点。
  - おてほんなし: 十字のマス目だけで書く。81 文字のお手本と形を照合し、何の文字に見えるかを判定。合格で金の星。
- **177 の単語、9 カテゴリ**: のりもの・どうぶつ・くだもの・やさい・たべもの・しぜん・からだ・みのまわり・あそび。文字一覧からは 81 文字を 1 文字ずつ練習できる。
- **できた！を楽しむ演出**: 画を書き終えるとキラキラ、文字クリアで紙吹雪と星、単語クリアでイラストが画面を走り抜ける。
- **読み上げ**: 文字の読みと単語の名前を iPadOS の日本語音声で読み上げ。
- **オフライン・広告なし・アカウントなし**: 練習記録は端末内の保存のみ。リセットは保護者向けの足し算ゲートの先にある。

## iPad で使う

1. Safari で公開 URL を開く
2. 共有 → 「ホーム画面に追加」
3. ホーム画面のアイコンから起動し、横向きで使う

更新を公開したあと、iPad 側は 2 回目の起動で新しい版に切り替わる。

## 開発

```bash
pnpm install
pnpm dev      # http://localhost:5173/kakikaki-hiragana/
pnpm test     # 判定・採点・認識・データの単体テスト
pnpm check    # svelte-check
pnpm build    # build/ に静的サイトを出力
```

`main` に push すると GitHub Actions が GitHub Pages にデプロイする。

### 構成

| 場所 | 役割 |
| --- | --- |
| `src/lib/words.ts` | 単語リスト（id・ひらがな・カテゴリ・絵文字） |
| `src/lib/strokes.ts` | 書き順データ（`scripts/fetch-strokes.ts` で KanjiVG から生成） |
| `src/lib/geometry.ts` | SVG path → 点列、再サンプリング |
| `src/lib/judge.ts` | なぞる / じぶんでかく の判定。しきい値は `JUDGE` |
| `src/lib/score.ts` | 線の採点と星 |
| `src/lib/recognize.ts` | 手書き認識（お手本との形比較）。しきい値は `RECOG` |
| `src/lib/progress.svelte.ts` | 練習記録（localStorage） |
| `src/lib/audio.ts` | 効果音（WebAudio）と読み上げ（Web Speech） |
| `src/lib/fx.ts` | パーティクルと紙吹雪 |
| `src/lib/components/Canvas.svelte` | 書き取り面 |
| `src/routes/` | ホーム / 練習 / 文字一覧 / アプリについて |

### 単語を増やす

`src/lib/words.ts` のカテゴリ配列に `['id', 'ひらがな', '絵文字']` を追加して、画像を取得する。

```bash
node scripts/fetch-images.ts   # Twemoji の SVG を static/img/<id>.svg に保存（既存は上書きしない）
pnpm test                      # 全文字に書き順データがあることを確認
```

自前のイラストを使う場合は `static/img/<id>.svg` を置く。画像が無い単語は頭文字のカードで表示される。

### 公開先を変える

`BASE_PATH=/ pnpm build` のように `BASE_PATH` で base を変え、`static/manifest.webmanifest` の `start_url` と `scope` を合わせる。

## クレジット

- 書き順データ: [KanjiVG](https://kanjivg.tagaini.net)（CC BY-SA 3.0）
- イラスト: [Twemoji](https://github.com/jdecked/twemoji)（CC BY 4.0）。乗り物 8 種は自作
