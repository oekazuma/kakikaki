import { describe, it, expect } from 'vitest';
import { STROKES } from './strokes';
import { CHARS } from './chars';
import { pathToPoints, translate } from './geometry';
import { recognize, passes, TEMPLATES } from './recognize';

const drawn = (c: string) => STROKES[c].map((d) => pathToPoints(d, 1.5));

describe('recognize', () => {
	it('お手本そのものは 81 文字すべて 1 位が自分', () => {
		for (const c of CHARS) expect(recognize(drawn(c))[0].char, c).toBe(c);
	});
	it('ずれて・少し震えていても合格', () => {
		let seed = 7;
		const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280 - 0.5) * 4;
		for (const c of ['あ', 'ぱ', 'し', 'ー', 'っ']) {
			const strokes = drawn(c).map((s) => translate(s, 6, -4).map((p) => ({ x: p.x + rnd(), y: p.y + rnd() })));
			expect(passes(c, recognize(strokes)), c).toBe(true);
		}
	});
	it('画数が違う別の字は不合格', () => {
		expect(passes('あ', recognize(drawn('ー')))).toBe(false);
	});
	it('TEMPLATES は 81 個', () => expect(TEMPLATES.length).toBe(81));
});
