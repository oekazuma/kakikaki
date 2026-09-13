import { describe, it, expect } from 'vitest';
import { levelOf, wordsOf, makeReadQuiz, makeWriteQuiz, pickChoices } from './quiz';
import { WORDS, wordById } from './words';
import { lettersOf } from './lang.svelte';

// 決定的な乱数
const seeded = (s = 1) => () => ((s = (s * 9301 + 49297) % 233280) / 233280);

describe('quiz', () => {
	it('級ごとに 50 語以上あり、全単語がどれかの級に入る', () => {
		for (const l of ['ja', 'en'] as const) {
			const sizes = [1, 2, 3].map((lv) => wordsOf(l, lv as 1 | 2 | 3).length);
			expect(sizes.reduce((a, b) => a + b, 0)).toBe(WORDS.length);
			for (const s of sizes) expect(s).toBeGreaterThanOrEqual(50);
		}
		expect(levelOf(wordById('bus')!, 'ja')).toBe(1);
		expect(levelOf(wordById('ship')!, 'en')).toBe(1);
		expect(levelOf(wordById('shinkansen')!, 'ja')).toBe(3);
	});
	it('よみクイズは 10 問、3 択で正解を含み、重複なし', () => {
		const qs = makeReadQuiz('ja', 2, 10, seeded());
		expect(qs.length).toBe(10);
		expect(new Set(qs.map((q) => q.answer.id)).size).toBe(10);
		for (const q of qs) {
			expect(q.choices.length).toBe(3);
			expect(q.choices.some((c) => c.id === q.answer.id)).toBe(true);
			expect(new Set(q.choices.map((c) => c.id)).size).toBe(3);
			for (const c of q.choices) expect(levelOf(c, 'ja')).toBe(2);
		}
		expect(qs.map((q) => q.kind)).toEqual(['word', 'picture', 'word', 'picture', 'word', 'picture', 'word', 'picture', 'word', 'picture']);
	});
	it('上級の選択肢は同じカテゴリ・同じ文字数が優先される', () => {
		const answer = wordById('shinkansen')!; // しんかんせん 6 文字
		const ch = pickChoices(answer, wordsOf('ja', 3), 'ja', 3, seeded(3)).filter((c) => c.id !== answer.id);
		for (const c of ch) expect(c.category).toBe('のりもの');
		// のりもの の 6 文字は他に無いので文字数一致は保証されないが、カテゴリは揃う
		expect(ch.length).toBe(2);
	});
	it('かきクイズは 5 問、英語は文字が分かれている', () => {
		const ws = makeWriteQuiz('en', 1, 5, seeded(2));
		expect(ws.length).toBe(5);
		for (const w of ws) expect(lettersOf(w, 'en').length).toBeLessThanOrEqual(4);
	});
});
