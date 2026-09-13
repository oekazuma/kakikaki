import { describe, it, expect } from 'vitest';
import { strokeScore, stars } from './score';

const line = Array.from({ length: 21 }, (_, i) => ({ x: i * 5, y: 50 }));

describe('score', () => {
	it('お手本どおりなら 3 つ星', () => {
		expect(stars(strokeScore(line, line))).toBe(3);
	});
	it('大きくずれると 1 つ星', () => {
		const off = line.map((p) => ({ x: p.x, y: p.y + 15 }));
		expect(stars(strokeScore(off, line))).toBe(1);
	});
	it('逆向きは減点', () => {
		const rev = [...line].reverse();
		expect(strokeScore(rev, line)).toBeLessThanOrEqual(0.5);
	});
});
