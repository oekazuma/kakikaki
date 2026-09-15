import { describe, it, expect } from 'vitest';
import { Bouncer, SIZE, LIFE, GOAL, RETURN } from './bouncer.svelte';

describe('ピンボール', () => {
  it('イラストの位置から跳び出し、着地して右の壁まで走ると、山なりにカードへ戻る', () => {
    const b = new Bouncer(1000, 700, { x: 140, y: 180 }, () => 0.5);
    expect([b.phase, b.x, b.y]).toEqual(['run', 140 - SIZE / 2, 180 - SIZE / 2]);
    b.tick(0.1);
    expect(b.y).toBeLessThan(100); // まず上へ
    expect(b.x).toBeGreaterThan(60);
    for (let i = 0; i < 40 && b.y < 700 - SIZE - 20; i++) b.tick(0.05);
    expect(b.y).toBe(700 - SIZE - 20); // 着地
    for (let i = 0; i < 60 && b.phase === 'run'; i++) b.tick(0.05);
    expect([b.phase, b.x, b.right]).toEqual(['home', 1000 - SIZE, false]); // 壁で止まり、左のカードを向く
    let top = b.y;
    for (let t = 0; t < RETURN + 0.1; t += 0.05) {
      b.tick(0.05);
      top = Math.min(top, b.y);
    }
    expect(top).toBeLessThan(180 - SIZE / 2); // カードより高く山なりに跳ぶ
    expect([b.phase, b.x, b.y, b.rot]).toEqual(['done', 140 - SIZE / 2, 180 - SIZE / 2, 0]);
  });
  it('弾くと上へ飛び、端で跳ね返り、LIFE 秒で消える。弾くたびに速くなる', () => {
    let r = 0.5; // 0.5 は真上、0.2 は右上へ
    const b = new Bouncer(1000, 700, { x: 140, y: 180 }, () => r);
    for (let i = 0; i < 40 && b.y < 700 - SIZE - 20; i++) b.tick(0.05);
    const y0 = b.y;
    b.kick();
    expect([b.phase, b.kicks]).toEqual(['pinball', 1]);
    b.tick(0.1);
    expect(b.y).toBeLessThan(y0);
    // 上端まで飛ばして跳ね返る
    for (let i = 0; i < 20 && b.y > 0; i++) b.tick(0.05);
    expect([b.y, b.hits]).toEqual([0, 1]);
    b.tick(0.1);
    expect(b.y).toBeGreaterThan(0);
    const x1 = b.x;
    r = 0.2;
    b.kick();
    b.tick(0.1);
    expect(b.kicks).toBe(2);
    expect(b.x).toBeGreaterThan(x1);
    // 何もしないと LIFE 秒で終わる。画面内に留まる
    for (let t = 0; t < LIFE + 0.5; t += 0.05) {
      b.tick(0.05);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x).toBeLessThanOrEqual(1000 - SIZE);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeLessThanOrEqual(700 - SIZE);
    }
    expect(b.phase).toBe('home'); // 時間切れでもカードへ戻る
    b.kick(); // 戻っている間は弾けない
    expect(b.phase).toBe('home');
    for (let t = 0; t < RETURN + 0.1; t += 0.05) b.tick(0.05);
    expect([b.phase, b.x, b.y]).toEqual(['done', 140 - SIZE / 2, 180 - SIZE / 2]);
    b.kick();
    expect(b.phase).toBe('done');
  });
  it('弾き続ければ壁に当たった回数が GOAL に届く', () => {
    const b = new Bouncer(600, 400, { x: 100, y: 100 }, () => 0.3);
    for (let t = 0; t < 120 && b.hits < GOAL; t += 0.05) {
      if (t % 1 < 0.05) b.kick();
      b.tick(0.05);
    }
    expect(b.hits).toBeGreaterThanOrEqual(GOAL);
    expect(b.phase).toBe('pinball');
  });
});
