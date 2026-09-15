import { describe, it, expect } from 'vitest';
import { badgesOf, ROWS, computeStats, earnedBadges, nextBadge, BADGE_GROUPS } from './badges';
import { CHARS, CHARS_EN, CHARS_KANA } from './chars';
import { wordById } from './words';
import { lettersOf, type Lang } from './lang.svelte';

// テストでは「全文字クリア = 単語も練習済み」とみなす
const byChars = (l: Lang, cleared: (c: string) => boolean) => (id: string) =>
  lettersOf(wordById(id)!, l).every(cleared);

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
          byChars('ja', () => false),
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
        byChars('ja', (c) => done.has(c)),
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
        byChars('en', (c) => done.has(c)),
        1
      )
    ).map((b) => b.id);
    expect(ids).toContain('row-ABCDEFG');
    expect(ids).toContain('row-abcdefg');
    expect(ids).toContain('words-10'); // A〜G で始まる単語（Dog, Cat, …）に星がつく
    expect(ids).not.toContain('row-HIJKLM');
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
          byChars(l, () => true),
          30,
          quiz,
          7,
          { balloons: 1, balloon: 300, eggs: 1, pinball: 200 }
        )
      ).map((b) => b.id);
      expect(ids.length).toBe(badgesOf(l).length);
      expect(badgesOf(l).length).toBe(l === 'en' ? 56 : 60);
    }
  });
  it('need は [達成数, 必要数]', () => {
    const s = computeStats(
      'ja',
      (c) => 'あいう'.includes(c),
      () => false,
      byChars('ja', (c) => 'あいう'.includes(c)),
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

  it('メダルは全部どこかのグループに入り、つぎのメダルは達成率が最も高い未獲得', () => {
    const badges = badgesOf('ja');
    for (const b of badges) expect(BADGE_GROUPS).toContain(b.group);
    const s = computeStats(
      'ja',
      (c) => 'あいうえおかきくけ'.includes(c),
      () => false,
      byChars('ja', (c) => 'あいうえおかきくけ'.includes(c)),
      2,
      {}
    );
    const got = { 'first-char': '2026-01-01' };
    const next = nextBadge(badges, s, got)!;
    const ratio = (b: (typeof badges)[number]) => b.need(s)[0] / b.need(s)[1];
    expect(got).not.toHaveProperty(next.id);
    for (const b of badges) if (!(b.id in got)) expect(ratio(next)).toBeGreaterThanOrEqual(ratio(b));
    expect(nextBadge(badges, s, Object.fromEntries(badges.map((b) => [b.id, 'x'])))).toBeUndefined();
  });

  it('かくしメダル: ことばをまたいだ記録で解放され、取るまで つぎの めだる には出ない', () => {
    const no = computeStats(
      'ja',
      () => false,
      () => false,
      byChars('ja', () => false),
      0,
      {},
      0
    );
    expect(earnedBadges('ja', no).map((b) => b.id)).toEqual([]);
    const s = computeStats(
      'ja',
      () => false,
      () => false,
      byChars('ja', () => false),
      0,
      {},
      0,
      { balloons: 1, balloon: 120, eggs: 1, pinball: 120 }
    );
    expect(earnedBadges('ja', s).map((b) => b.id)).toEqual(['balloon-found', 'balloon-100', 'egg-jump', 'pinball-100']);
    expect(nextBadge(badgesOf('ja'), no, {})?.secret).toBeFalsy();
    expect(badgesOf('ja').filter((b) => b.secret).length).toBe(6);
  });
});
