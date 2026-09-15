import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Hold } from './hold';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('長押し検知', () => {
  it('長押しして離すと、その離した瞬間だけ無視する', () => {
    const hold = new Hold();
    hold.down(() => {});
    vi.advanceTimersByTime(600);
    expect(hold.up()).toBe(true);
    expect(hold.up()).toBe(false); // 2 回目は消費済みなので無視しない
  });

  it('長押し発火後に cancel されても、次のタップは無視しない', () => {
    const hold = new Hold();
    hold.down(() => {});
    vi.advanceTimersByTime(600);
    hold.cancel(); // pointercancel / pointerleave で pointerup が来なかった場合
    hold.down(() => {}); // 次の押下
    expect(hold.up()).toBe(false); // 短いタップ
  });

  it('短いタップは無視しない', () => {
    const hold = new Hold();
    hold.down(() => {});
    vi.advanceTimersByTime(300); // 600ms 未満で離す
    expect(hold.up()).toBe(false);
  });
});
