// iOS 版（非公開リポジトリ）が取り込むデータ。KK_IOS_EXPORT=1 で書き、普段はコミット済みの中身と同じかを検査する。
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STROKES } from './strokes';
import { STROKES_KANA } from './strokes-kana';
import { STROKES_EN } from './strokes-en';
import { STROKES_KANJI } from './strokes-kanji';

const WRITE = process.env.KK_IOS_EXPORT === '1';
const files = new Map<string, string>();
const emit = (path: string, value: unknown) => files.set(path, JSON.stringify(value) + '\n');

// 並びは Object.keys の順（en は数字が先頭）。Swift 側はこれをテンプレートの順として使う。
const toList = (s: Record<string, string[]>) => Object.entries(s).map(([c, d]) => ({ c, d }));

emit('strokes/ja.json', toList(STROKES));
emit('strokes/kana.json', toList(STROKES_KANA));
emit('strokes/en.json', toList(STROKES_EN));
emit('strokes/kanji.json', toList(STROKES_KANJI));

describe('ios-data', () => {
  it('文字数', () => {
    expect(toList(STROKES)).toHaveLength(81);
    expect(toList(STROKES_KANA)).toHaveLength(81);
    expect(toList(STROKES_EN)).toHaveLength(62);
    expect(toList(STROKES_KANJI)).toHaveLength(1026);
  });

  it('いまのコードから作ったものと同じ（違えば pnpm ios:export）', () => {
    for (const [path, body] of files) {
      const abs = `ios-data/${path}`;
      if (WRITE) {
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(abs, body);
      } else expect(readFileSync(abs, 'utf8'), path).toBe(body);
    }
  });
});
