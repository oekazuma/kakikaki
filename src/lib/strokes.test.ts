import { describe, it, expect } from 'vitest';
import { CHARS } from './chars';
import { STROKES } from './strokes';

describe('STROKES', () => {
	it('81 文字すべてに 1 画以上ある', () => {
		expect(CHARS.length).toBe(81);
		for (const c of CHARS) expect(STROKES[c]?.length, c).toBeGreaterThan(0);
	});
	it('画数の例', () => {
		expect(STROKES['あ'].length).toBe(3);
		expect(STROKES['ー'].length).toBe(1);
		expect(STROKES['ぱ'].length).toBe(4);
	});
});
