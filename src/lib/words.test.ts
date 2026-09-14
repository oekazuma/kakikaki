import { describe, it, expect } from 'vitest';
import { WORDS, charWord, wordById } from './words';
import { STROKES } from './strokes';
import { STROKES_EN } from './strokes-en';
import { STROKES_KANA } from './strokes-kana';
import { lettersOf, nameOf, toKatakana } from './lang.svelte';

describe('words', () => {
  it('全単語の全文字に書き順がある（日本語・英語）', () => {
    for (const w of WORDS) {
      for (const c of w.name) expect(STROKES[c], `${w.name}:${c}`).toBeDefined();
      for (const c of lettersOf(w, 'en')) expect(STROKES_EN[c], `${w.en}:${c}`).toBeDefined();
      for (const c of lettersOf(w, 'kana')) expect(STROKES_KANA[c], `${w.name}:${c}`).toBeDefined();
    }
  });
  it('id は一意', () => {
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length);
  });
  it('charWord / wordById', () => {
    expect(charWord('あ')).toEqual({ id: 'char-あ', name: 'あ', en: 'あ', category: 'もじ' });
    expect(wordById('bus')?.name).toBe('ばす');
    expect(wordById('char-ぱ')?.name).toBe('ぱ');
  });
  it('全単語に英語名があり、カタカナ変換できる', () => {
    for (const w of WORDS) expect(w.en, w.name).toMatch(/^[a-z -]+$/);
    expect(toKatakana('ぱとかー')).toBe('パトカー');
    expect(toKatakana('きゅうきゅうしゃ')).toBe('キュウキュウシャ');
  });
  it('英語名は先頭だけ大文字で見せ、全単語の頭文字で A〜Z がそろう。1 文字練習はそのまま', () => {
    expect(nameOf(wordById('dog')!, 'en')).toBe('Dog');
    expect(nameOf(wordById('patocar')!, 'en')).toBe('Police car');
    expect(nameOf(charWord('d'), 'en')).toBe('d');
    const initials = new Set(WORDS.map((w) => nameOf(w, 'en')[0]));
    for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') expect(initials, c).toContain(c);
  });
});
