import { describe, it, expect } from 'vitest';
import { WORDS, charWord, wordById } from './words';
import { STROKES } from './strokes';

describe('words', () => {
	it('全単語の全文字に書き順がある', () => {
		for (const w of WORDS) for (const c of w.name) expect(STROKES[c], `${w.name}:${c}`).toBeDefined();
	});
	it('id は一意', () => {
		expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length);
	});
	it('charWord / wordById', () => {
		expect(charWord('あ')).toEqual({ id: 'char-あ', name: 'あ', category: 'もじ' });
		expect(wordById('bus')?.name).toBe('ばす');
		expect(wordById('char-ぱ')?.name).toBe('ぱ');
	});
});

describe('desc', () => {
	it('全単語に説明がある', () => {
		for (const w of WORDS) expect(w.desc, w.name).toBeTruthy();
	});
});
