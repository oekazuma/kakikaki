import { describe, it, expect, beforeEach } from 'vitest';
import { BalloonGame, points, saveScore, ranking, loadBests, levelOf, MISS_MAX } from './balloon.svelte';
import type { Profile } from './profiles.svelte';

describe('ふうせん ぽん', () => {
  beforeEach(() => localStorage.clear());

  it('風船が上がって、割ると コンボで得点が増え、見逃すとコンボが切れる', () => {
    const g = new BalloonGame(() => 0.5);
    g.start();
    g.tick(0.3);
    expect(g.balloons.length).toBe(1);
    const y0 = g.balloons[0].y;
    g.tick(0.5);
    expect(g.balloons[0].y).toBeLessThan(y0);
    expect(g.pop(g.balloons[0].id)).toBe(points(1));
    expect([g.score, g.combo, g.popped]).toEqual([10, 1, 1]);
    // 2 つ目・3 つ目を続けて割るとコンボ 2, 3 → 15, 20 点
    g.tick(2);
    for (const b of [...g.balloons]) g.pop(b.id);
    expect(g.combo).toBeGreaterThanOrEqual(3);
    expect(g.score).toBe(
      10 + 15 + 20 + (g.combo > 3 ? [...Array(g.combo - 3)].reduce((a, _, i) => a + points(4 + i), 0) : 0)
    );
    expect(g.pop(999)).toBe(0);
    // 見逃す: 何も割らずに待つ（風船が上端を越える）
    for (let i = 0; i < 60 && g.misses === 0; i++) g.tick(0.1);
    expect(g.combo).toBe(0);
    expect(g.misses).toBeGreaterThan(0);
  });

  it(`${MISS_MAX} 回見逃すと終了して風船が消える`, () => {
    const g = new BalloonGame(() => 0.5);
    g.start();
    for (let i = 0; i < 400 && !g.over; i++) g.tick(0.1);
    expect([g.over, g.misses, g.balloons.length]).toEqual([true, MISS_MAX, 0]);
    g.tick(1);
    expect(g.balloons.length).toBe(0);
    g.start();
    expect([g.over, g.score, g.misses]).toEqual([false, 0, 0]);
  });

  it('コンボが 5 つづくごとにレベルが上がり、風船が速く小さくなる', () => {
    expect([levelOf(0), levelOf(4), levelOf(5), levelOf(12), levelOf(99)]).toEqual([0, 0, 1, 2, 5]);
    const g = new BalloonGame(() => 0.5);
    g.start();
    g.tick(0.3);
    const slow = g.balloons[0];
    // 10 コンボぶん割る（風船を出しては割る）
    for (let n = 0; n < 10; n++) {
      while (g.balloons.length === 0) g.tick(0.1);
      g.pop(g.balloons[0].id);
    }
    expect(g.level).toBe(2);
    while (g.balloons.length === 0) g.tick(0.1);
    const fast = g.balloons[0];
    expect(fast.vy).toBeGreaterThan(slow.vy * 1.1);
    expect(fast.size).toBeLessThan(slow.size);
  });

  it('得点は 10 から 5 ずつ増えて 60 で止まる', () => {
    expect([points(1), points(2), points(11), points(30)]).toEqual([10, 15, 60, 60]);
  });

  it('自己ベストは人ごとに保存し、ランキングは高い順', () => {
    const ps: Profile[] = [
      { id: 'p1', name: 'A', avatar: 'cat', lang: 'ja' },
      { id: 'p2', name: 'B', avatar: 'dog', lang: 'ja' },
      { id: 'p3', name: 'C', avatar: 'bear', lang: 'ja' }
    ];
    expect(saveScore('p1', 100, '2026-09-14')).toBe(true);
    expect(saveScore('p1', 80, '2026-09-15')).toBe(false);
    expect(saveScore('p2', 150, '2026-09-14')).toBe(true);
    expect(ranking(ps).map((r) => [r.id, r.score])).toEqual([
      ['p2', 150],
      ['p1', 100]
    ]);
    expect(loadBests().p1.date).toBe('2026-09-14');
  });
});
