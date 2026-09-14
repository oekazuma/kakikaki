import { describe, it, expect } from 'vitest';
import { badgesOf, ROWS, computeStats, earnedBadges } from './badges';
import { CHARS, CHARS_EN, CHARS_KANA } from './chars';

describe('badges', () => {
  it('id は一意で、行グループは全文字を過不足なく分ける', () => {
    for (const l of ['ja', 'kana', 'en'] as const) {
      const B = badgesOf(l);
      expect(new Set(B.map((b) => b.id)).size).toBe(B.length);
      const all = l === 'ja' ? CHARS : l === 'kana' ? CHARS_KANA : CHARS_EN;
      expect(ROWS[l].flatMap((r) => r.chars).sort()).toEqual([...all].sort());
    }
  });
  it('何もしていなければメダルなし', () => {
    expect(
      earnedBadges(
        'ja',
        computeStats(
          'ja',
          () => false,
          () => false,
          0
        )
      )
    ).toEqual([]);
  });
  it('あ行を全部クリアすると「はじめの いっぽ」と「あいうえお マスター」', () => {
    const done = new Set('あいうえお');
    const ids = earnedBadges(
      'ja',
      computeStats(
        'ja',
        (c) => done.has(c),
        () => false,
        1
      )
    ).map((b) => b.id);
    expect(ids).toEqual(['first-char', 'first-word', 'row-あいうえお']); // 「いえ」があ行だけで書ける
  });
  it('英語: A〜G と小文字を全部クリア', () => {
    const done = new Set('ABCDEFGabcdefghijklmnopqrstuvwxyz');
    const ids = earnedBadges(
      'en',
      computeStats(
        'en',
        (c) => done.has(c),
        () => false,
        1
      )
    ).map((b) => b.id);
    expect(ids).toContain('row-ABCDEFG');
    expect(ids).toContain('row-abcdefg');
    expect(ids).toContain('words-100'); // 小文字だけで書ける単語が 100 以上
  });
  it('全部クリアで全メダル', () => {
    for (const l of ['ja', 'kana', 'en'] as const) {
      const quiz = { read1: 10, read2: 10, read3: 10, write1: 10, write2: 10, write3: 10 };
      const ids = earnedBadges(
        l,
        computeStats(
          l,
          () => true,
          () => true,
          30,
          quiz
        )
      ).map((b) => b.id);
      expect(ids.length).toBe(badgesOf(l).length);
    }
  });
  it('need は [達成数, 必要数]', () => {
    const s = computeStats(
      'ja',
      (c) => 'あいう'.includes(c),
      () => false,
      2
    );
    expect(
      badgesOf('ja')
        .find((b) => b.id === 'chars-10')!
        .need(s)
    ).toEqual([3, 10]);
    expect(
      badgesOf('ja')
        .find((b) => b.id === 'days-3')!
        .need(s)
    ).toEqual([2, 3]);
  });
});
