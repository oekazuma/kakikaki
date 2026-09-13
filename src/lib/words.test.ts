import { describe, it, expect } from 'vitest';
import { WORDS, charWord, wordById } from './words';
import { STROKES } from './strokes';
import { STROKES_EN } from './strokes-en';
import { lettersOf } from './lang.svelte';

describe('words', () => {
	it('全単語の全文字に書き順がある（日本語・英語）', () => {
		for (const w of WORDS) {
			for (const c of w.name) expect(STROKES[c], `${w.name}:${c}`).toBeDefined();
			for (const c of lettersOf(w, 'en')) expect(STROKES_EN[c], `${w.en}:${c}`).toBeDefined();
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
	it('全単語に説明と英語名がある', () => {
		for (const w of WORDS) {
			expect(w.desc, w.name).toBeTruthy();
			expect(w.en, w.name).toMatch(/^[a-z ]+$/);
		}
	});
});
