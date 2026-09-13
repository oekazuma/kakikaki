import { describe, it, expect } from 'vitest';
import { BADGES, ROWS, computeStats, earnedBadges } from './badges';
import { CHARS } from './chars';

describe('badges', () => {
	it('id は一意で、行グループは 81 文字を過不足なく分ける', () => {
		expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
		const all = ROWS.flatMap((r) => r.chars).sort();
		expect(all).toEqual([...CHARS].sort());
	});
	it('何もしていなければメダルなし', () => {
		expect(earnedBadges(computeStats(() => false, () => false, 0))).toEqual([]);
	});
	it('あ行を全部クリアすると「はじめの いっぽ」と「あいうえお マスター」', () => {
		const done = new Set('あいうえお');
		const ids = earnedBadges(computeStats((c) => done.has(c), () => false, 1)).map((b) => b.id);
		expect(ids).toEqual(['first-char', 'first-word', 'row-あいうえお']); // 「いえ」があ行だけで書ける
	});
	it('全部クリアで全メダル（日数を除く）', () => {
		const ids = earnedBadges(computeStats(() => true, () => true, 30)).map((b) => b.id);
		expect(ids.length).toBe(BADGES.length);
	});
	it('need は [達成数, 必要数]', () => {
		const s = computeStats((c) => 'あいう'.includes(c), () => false, 2);
		expect(BADGES.find((b) => b.id === 'chars-10')!.need(s)).toEqual([3, 10]);
		expect(BADGES.find((b) => b.id === 'days-3')!.need(s)).toEqual([2, 3]);
	});
});
