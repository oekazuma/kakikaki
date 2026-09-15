import { describe, it, expect, beforeEach, vi } from 'vitest';

async function fresh() {
  vi.resetModules();
  return import('./photos.svelte');
}

describe('photos', () => {
  beforeEach(() => localStorage.clear());

  it('先頭に追加し、重複は寄せ、上限を超えたら古いものから消える', async () => {
    const m = await fresh();
    for (let i = 0; i < m.PHOTOS_MAX + 1; i++) m.addPhoto(`data:${i}`);
    expect(m.photos.list.length).toBe(m.PHOTOS_MAX);
    expect(m.photos.list[0]).toBe(`data:${m.PHOTOS_MAX}`);
    expect(m.photos.list).not.toContain('data:0');
    m.addPhoto('data:5');
    expect(m.photos.list[0]).toBe('data:5');
    expect(m.photos.list.filter((p) => p === 'data:5').length).toBe(1);
    m.removePhoto('data:5');
    expect(m.photos.list).not.toContain('data:5');
    expect(JSON.parse(localStorage.getItem('kk:photos')!)).toEqual(m.photos.list);
  });

  it('壊れた保存値は空として読む', async () => {
    localStorage.setItem('kk:photos', '{');
    expect((await fresh()).photos.list).toEqual([]);
  });

  it('容量超過で保存できないときは一覧を据え置く', async () => {
    const m = await fresh();
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    try {
      expect(m.addPhoto('data:x')).toBe(false);
      expect(m.photos.list).toEqual([]);
      expect(m.removePhoto('data:x')).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });
});
