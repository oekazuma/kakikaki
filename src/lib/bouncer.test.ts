import { describe, it, expect } from 'vitest';
import { Bouncer, SIZE, LIFE, GOAL, WRITE, RETURN, PAUSE } from './bouncer.svelte';

// 2 画の簡単な文字（109 マスの座標）
const LETTER = [
  [
    { x: 10, y: 20 },
    { x: 100, y: 20 }
  ],
  [
    { x: 10, y: 80 },
    { x: 100, y: 80 }
  ]
];
const land = (b: Bouncer) => {
  for (let i = 0; i < 40 && b.phase === 'run'; i++) b.tick(0.05);
};

describe('ピンボール', () => {
  it('イラストの位置から跳び出し、着地したら頭文字を書いてカードへ戻る', () => {
    const b = new Bouncer(1000, 700, { x: 140, y: 180 }, () => 0.5, LETTER);
    expect([b.phase, b.x, b.y]).toEqual(['run', 140 - SIZE / 2, 180 - SIZE / 2]);
    b.tick(0.1);
    expect(b.y).toBeLessThan(100); // まず上へ
    land(b);
    expect(b.phase).toBe('write');
    for (let t = 0; t < WRITE + 1 && b.phase === 'write'; t += 0.05) b.tick(0.05);
    expect(b.phase).toBe('home');
    expect(b.trails.length).toBe(2); // 画ごとに跡が残る
    expect(b.trails[0].length).toBeGreaterThan(5);
    // 2 画目の跡は 1 画目より下（文字を画面に拡大した座標）
    expect(b.trails[1][0].y).toBeGreaterThan(b.trails[0][0].y);
    expect(b.right).toBe(false); // 書き終わりは右端なので、左のカードへ向く
    for (let t = 0; t < RETURN + 0.1; t += 0.05) b.tick(0.05);
    expect([b.phase, b.x, b.y, b.rot]).toEqual(['done', 140 - SIZE / 2, 180 - SIZE / 2, 0]);
  });
  it('walk: 右の壁で折り返し、足あとを残して地面を戻り、カードの下でひと呼吸おいて跳び込む', () => {
    const b = new Bouncer(1000, 700, { x: 140, y: 180 }, () => 0.5, LETTER, 'walk');
    for (let i = 0; i < 80 && b.phase === 'run'; i++) b.tick(0.05);
    expect([b.phase, b.x, b.trails]).toEqual(['back', 1000 - SIZE, []]);
    for (let i = 0; i < 80 && b.phase === 'back'; i++) {
      b.tick(0.05);
      expect(b.y).toBe(700 - SIZE - 20);
    }
    expect([b.phase, b.x, b.right]).toEqual(['pause', 140 - SIZE / 2, false]);
    expect(b.steps.length).toBeGreaterThan(5); // 足あとが並ぶ
    expect(b.steps[0].x).toBeGreaterThan(b.steps[1].x); // 右から左へ
    for (let t = 0; t < PAUSE; t += 0.05) b.tick(0.05);
    expect(b.phase).toBe('home');
    for (let t = 0; t < RETURN + 0.1; t += 0.05) b.tick(0.05);
    expect([b.phase, b.x, b.y]).toEqual(['done', 140 - SIZE / 2, 180 - SIZE / 2]);
  });
  it('文字が無ければ着地してすぐ戻る', () => {
    const b = new Bouncer(1000, 700, { x: 140, y: 180 }, () => 0.5);
    land(b);
    expect(b.phase).toBe('home');
  });
  it('弾くと上へ飛び、端で跳ね返り、LIFE 秒で地面を走って帰る。弾くたびに速くなる', () => {
    let r = 0.5; // 0.5 は真上、0.2 は右上へ
    const b = new Bouncer(1000, 700, { x: 140, y: 180 }, () => r, LETTER);
    land(b);
    b.tick(0.3);
    expect(b.trails.length).toBeGreaterThan(0);
    const y0 = b.y;
    b.kick();
    expect([b.phase, b.kicks, b.trails]).toEqual(['pinball', 1, []]); // 書きかけの跡は消える
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
    // 何もしないと LIFE 秒で帰り道に入る。画面内に留まる
    for (let t = 0; t < LIFE + 0.5 && b.phase === 'pinball'; t += 0.05) {
      b.tick(0.05);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x).toBeLessThanOrEqual(1000 - SIZE);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeLessThanOrEqual(700 - SIZE);
    }
    expect(b.phase).toBe('back');
    b.kick(); // 帰り道では弾けない
    expect(b.phase).toBe('back');
    let paused = false;
    for (let t = 0; t < 10 && b.phase !== 'done'; t += 0.05) {
      b.tick(0.05);
      if (b.phase === 'pause') paused = true;
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x).toBeLessThanOrEqual(1000 - SIZE);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeLessThanOrEqual(700 - SIZE);
    }
    expect([paused, b.phase, b.x, b.y]).toEqual([true, 'done', 140 - SIZE / 2, 180 - SIZE / 2]);
    b.kick();
    expect(b.phase).toBe('done');
  });
  it('弾き続ければ壁に当たった回数が GOAL に届く', () => {
    const b = new Bouncer(600, 400, { x: 100, y: 100 }, () => 0.3, LETTER);
    for (let t = 0; t < 120 && b.hits < GOAL; t += 0.05) {
      if (t % 1 < 0.05) b.kick();
      b.tick(0.05);
    }
    expect(b.hits).toBeGreaterThanOrEqual(GOAL);
    expect(b.phase).toBe('pinball');
  });
});
