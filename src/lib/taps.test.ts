import { describe, expect, test } from 'vitest';
import { TapCounter } from './taps';

describe('TapCounter', () => {
  test('タップが need 回続くと true になり、その回で数え直す', () => {
    const c = new TapCounter(10, 2000);
    for (let i = 0; i < 9; i++) expect(c.tap(i * 100)).toBe(false);
    expect(c.tap(900)).toBe(true);
  });

  test('true を返したあとは 0 から数え直す', () => {
    const c = new TapCounter(10, 2000);
    for (let i = 0; i < 9; i++) c.tap(i * 100);
    expect(c.tap(900)).toBe(true);
    expect(c.tap(1000)).toBe(false);
    for (let i = 0; i < 8; i++) expect(c.tap(1100 + i * 100)).toBe(false);
    expect(c.tap(1900)).toBe(true);
  });

  test('gap を超えて間が空くと数え直す', () => {
    const c = new TapCounter(10, 2000);
    for (let i = 0; i < 5; i++) c.tap(i * 100);
    expect(c.tap(2600)).toBe(false);
    for (let i = 0; i < 8; i++) expect(c.tap(2700 + i * 100)).toBe(false);
    expect(c.tap(3600)).toBe(true);
  });
});
