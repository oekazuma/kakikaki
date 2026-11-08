# 書き順データのライセンス

`strokes/ja.json`（ひらがな）、`strokes/kana.json`（カタカナ）、`strokes/kanji.json`（漢字）は、KanjiVG（https://kanjivg.tagaini.net 、Ulrich Apel）の SVG から path の `d` 属性だけを抜き出して JSON に変換したものです。取得元は KanjiVG のコミット `422b5538595676da918c288a4230cb5e22a1ee7e` です。KanjiVG の各ファイルの著作権表示は次のとおりです。

> Copyright (C) 2009/2010/2011 Ulrich Apel.
> This work is distributed under the conditions of the Creative Commons Attribution-Share Alike 3.0 Licence.

元のデータと同じ Creative Commons Attribution-Share Alike 3.0 Unported（https://creativecommons.org/licenses/by-sa/3.0/ ）で配ります。

`strokes/en.json`（アルファベットと数字）は、このリポジトリの `scripts/make-strokes-en.ts` で作ったもので、リポジトリと同じ MIT ライセンスです。

`parity/` は Web 版の判定・認識の入出力を記録した検査用のデータです。KanjiVG 由来の点列を含むので、KanjiVG のデータと同じ CC BY-SA 3.0 で配ります。
