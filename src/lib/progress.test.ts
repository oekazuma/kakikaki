import { describe, it, expect, beforeEach } from 'vitest';
import { get, record, charCleared, charGold, wordStar, wordCrown, reset } from './progress.svelte';

describe('progress', () => {
	beforeEach(() => reset());
	it('なぞる 2 + じぶんでかく 1 でクリア', () => {
		record('あ', 'trace');
		record('あ', 'trace');
		record('あ', 'trace');
		expect(get('あ').trace).toBe(2);
		expect(charCleared('あ')).toBe(false);
		record('あ', 'free');
		expect(charCleared('あ')).toBe(true);
		expect(charGold('あ')).toBe(false);
	});
	it('単語の星と王冠', () => {
		for (const c of 'ばす') {
			record(c, 'trace');
			record(c, 'trace');
			record(c, 'free');
		}
		expect(wordStar('ばす')).toBe(true);
		expect(wordCrown('ばす')).toBe(false);
		for (const c of 'ばす') record(c, 'test');
		expect(wordCrown('ばす')).toBe(true);
	});
});
