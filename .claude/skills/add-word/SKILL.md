---
name: add-word
description: 練習する単語を src/lib/words.ts に追加するときの手順。単語・語彙・イラスト（Twemoji）の追加や差し替えを頼まれたら使う。
---

# 単語を増やす

`src/lib/words.ts` のカテゴリ配列に `['id', 'ひらがな', '絵文字', 'english']` を追加し（カードの補助行のカタカナはひらがなから自動変換。英語名は小文字で書き、表示で先頭だけ大文字になる）、`node scripts/fetch-images.ts` で Twemoji の SVG を `static/img/<id>.svg` に取得する。自前のイラストを使うときは同じパスに置く（画像が無い単語は頭文字のカードで表示される）。ひらがな・カタカナ・英語名の全文字が `strokes.ts` / `strokes-kana.ts` / `strokes-en.ts` に存在する必要があり、`words.test.ts` がそれを検証する。
