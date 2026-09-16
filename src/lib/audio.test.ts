import { describe, it, expect } from 'vitest';
import { readingOf, speechOf } from './audio';

describe('readingOf', () => {
  it('長音と小書きは読み方に置き換え、カタカナも同じ読みになる', () => {
    expect(readingOf('ー')).toBe('のばす おと');
    expect(readingOf('っ')).toBe('ちいさい つ');
    expect(readingOf('ァ')).toBe(readingOf('ぁ'));
    expect(readingOf('あ')).toBe('あ');
    expect(readingOf('A')).toBe('A');
  });
});

describe('speechOf', () => {
  it('かんじ は代表の読み、それ以外は文字そのもの（小書き文字は説明）', () => {
    expect(speechOf('花', 'kanji')).toBe('はな');
    expect(speechOf('一', 'kanji')).toBe('いち');
    expect(speechOf('休', 'kanji')).toBe('やすむ');
    expect(speechOf('あ', 'ja')).toBe('あ');
    expect(speechOf('っ', 'ja')).toBe('ちいさい つ');
    expect(speechOf('ア', 'kana')).toBe('ア');
  });
});
