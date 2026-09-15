import { describe, expect, test } from 'vitest';
import { SplashGate } from './splash-gate';

describe('SplashGate', () => {
  test('準備が揃っていても最短 1.3 秒は待つ', () => {
    const g = new SplashGate(0);
    g.fontsReady();
    expect(g.done(1299)).toBe(false);
    expect(g.done(1300)).toBe(true);
  });

  test('落ち着き待ち中のリサイズは終了を遅らせる', () => {
    const g = new SplashGate(0);
    g.fontsReady();
    g.resize(1200);
    expect(g.done(1399)).toBe(false);
    expect(g.done(1400)).toBe(true);
  });

  test('落ち着かなくても最長 2.5 秒で切り上げる', () => {
    const g = new SplashGate(0);
    for (let t = 100; t <= 2400; t += 100) g.resize(t);
    expect(g.done(2499)).toBe(false);
    expect(g.done(2500)).toBe(true);
  });

  test('フォントが読めるまでは最長 1.5 秒待ち、読めたら反映する', () => {
    const g = new SplashGate(0);
    expect(g.done(1499)).toBe(false);
    expect(g.done(1500)).toBe(true);

    const g2 = new SplashGate(0);
    g2.fontsReady();
    expect(g2.done(1300)).toBe(true);
  });
});
