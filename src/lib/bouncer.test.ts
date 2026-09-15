import { describe, it, expect } from 'vitest';
import { Bouncer, SIZE, LIFE } from './bouncer.svelte';

describe('ピンボール', () => {
  it('左から走って右へ抜けると終わる', () => {
    const b = new Bouncer(1000, 700, () => 0.5);
    expect([b.phase, b.x, b.y]).toEqual(['run', -SIZE, 700 - SIZE - 20]);
    b.tick(1);
    expect(b.x).toBeGreaterThan(0);
    b.tick(3);
    expect(b.phase).toBe('done');
  });
  it('弾くと上へ飛び、端で跳ね返り、LIFE 秒で消える。弾くたびに速くなる', () => {
    const b = new Bouncer(1000, 700, () => 0.5);
    b.tick(1);
    const y0 = b.y;
    b.kick();
    expect([b.phase, b.kicks]).toEqual(['pinball', 1]);
    b.tick(0.1);
    expect(b.y).toBeLessThan(y0);
    // 上端まで飛ばして跳ね返る
    for (let i = 0; i < 20 && b.y > 0; i++) b.tick(0.05);
    expect(b.y).toBe(0);
    b.tick(0.1);
    expect(b.y).toBeGreaterThan(0);
    const x1 = b.x;
    b.kick();
    b.tick(0.1);
    const d1 = Math.hypot(b.x - x1, 0);
    expect(b.kicks).toBe(2);
    expect(d1).toBeGreaterThan(0);
    // 何もしないと LIFE 秒で終わる。画面内に留まる
    for (let t = 0; t < LIFE + 0.5; t += 0.05) {
      b.tick(0.05);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x).toBeLessThanOrEqual(1000 - SIZE);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeLessThanOrEqual(700 - SIZE);
    }
    expect(b.phase).toBe('done');
    b.kick();
    expect(b.phase).toBe('done');
  });
});
