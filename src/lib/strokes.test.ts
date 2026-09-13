import { describe, it, expect } from 'vitest';
import { CHARS, CHARS_EN } from './chars';
import { STROKES } from './strokes';
import { STROKES_EN } from './strokes-en';
import { pathToPoints, length } from './geometry';

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
	it('英語 52 文字は 109 マスに収まり、各画に長さがある', () => {
		expect(CHARS_EN.length).toBe(52);
		for (const c of CHARS_EN) {
			for (const d of STROKES_EN[c]) {
				const pts = pathToPoints(d);
				expect(length(pts), c).toBeGreaterThan(3);
				for (const p of pts) expect(p.x >= 0 && p.x <= 109 && p.y >= 0 && p.y <= 109, `${c} ${p.x},${p.y}`).toBe(true);
			}
		}
	});
});
