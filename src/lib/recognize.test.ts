import { describe, it, expect } from 'vitest';
import { STROKES } from './strokes';
import { STROKES_EN } from './strokes-en';
import { CHARS, CHARS_EN } from './chars';
import { pathToPoints, translate } from './geometry';
import { recognize, passes, TEMPLATES, makeTemplates } from './recognize';

const drawn = (S: Record<string, string[]>, c: string) => S[c].map((d) => pathToPoints(d, 1.5));
const T_EN = makeTemplates(STROKES_EN);

describe('recognize', () => {
	it('お手本そのものは 81 文字すべて 1 位が自分', () => {
		for (const c of CHARS) expect(recognize(drawn(STROKES, c))[0].char, c).toBe(c);
	});
	it('英語: お手本そのものは 52 文字すべて合格（I と l のように同形の字は 2 位でも可）', () => {
		for (const c of CHARS_EN) expect(passes(c, recognize(drawn(STROKES_EN, c), T_EN)), c).toBe(true);
	});
	it('ずれて・少し震えていても合格', () => {
		let seed = 7;
		const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280 - 0.5) * 4;
		for (const c of ['あ', 'ぱ', 'し', 'ー', 'っ']) {
			const strokes = drawn(STROKES, c).map((s) => translate(s, 6, -4).map((p) => ({ x: p.x + rnd(), y: p.y + rnd() })));
			expect(passes(c, recognize(strokes)), c).toBe(true);
		}
		for (const c of ['A', 'g', 'S', 'w']) {
			const strokes = drawn(STROKES_EN, c).map((s) => translate(s, 6, -4).map((p) => ({ x: p.x + rnd(), y: p.y + rnd() })));
			expect(passes(c, recognize(strokes, T_EN)), c).toBe(true);
		}
	});
	it('画数が違う別の字は不合格', () => {
		expect(passes('あ', recognize(drawn(STROKES, 'ー')))).toBe(false);
	});
	it('TEMPLATES は 81 個', () => expect(TEMPLATES.length).toBe(81));
});
