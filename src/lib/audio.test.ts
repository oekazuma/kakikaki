import { describe, it, expect } from 'vitest';
import { readingOf } from './audio';

describe('readingOf', () => {
  it('長音と小書きは読み方に置き換え、カタカナも同じ読みになる', () => {
    expect(readingOf('ー')).toBe('のばす おと');
    expect(readingOf('っ')).toBe('ちいさい つ');
    expect(readingOf('ァ')).toBe(readingOf('ぁ'));
    expect(readingOf('あ')).toBe('あ');
    expect(readingOf('A')).toBe('A');
  });
});
