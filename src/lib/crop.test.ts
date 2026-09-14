import { describe, it, expect } from 'vitest';
import { clampOffset, zoomAt, cropRect } from './crop';

// 1000×500 の写真、窓 280px → 短辺が窓にぴったりで base 0.56、表示は 560×280
const g = { W: 560, H: 280, V: 280, zoomMax: 4 };

describe('crop', () => {
  it('画像は窓からはみ出さない範囲に収まる', () => {
    expect(clampOffset(10, 560, 280)).toBe(0);
    expect(clampOffset(-1000, 560, 280)).toBe(-280);
    expect(clampOffset(-100, 560, 280)).toBe(-100);
  });
  it('拡大しても指の下にあった画像の点は動かない', () => {
    const s = { ox: -140, oy: 0, zoom: 1 };
    const c = { x: 100, y: 200 };
    const before = { x: (c.x - s.ox) / s.zoom, y: (c.y - s.oy) / s.zoom };
    const t = zoomAt(s, 2, c, c, g);
    expect(t.zoom).toBe(2);
    expect((c.x - t.ox) / t.zoom).toBeCloseTo(before.x);
    expect((c.y - t.oy) / t.zoom).toBeCloseTo(before.y);
    // 倍率は 1〜zoomMax に収まり、はみ出しは補正される
    const o = { x: 0, y: 0 };
    expect(zoomAt(s, 9, o, o, g).zoom).toBe(4);
    expect(zoomAt(s, 0.5, o, o, g)).toEqual({ ox: -140, oy: 0, zoom: 1 });
  });
  it('ピンチで指の中点が動いた分だけ画像もついてくる', () => {
    const s = { ox: -140, oy: 0, zoom: 1 };
    const t = zoomAt(s, 1, { x: 100, y: 100 }, { x: 120, y: 100 }, g); // 倍率そのまま、中点が右へ 20
    expect([t.ox, t.oy]).toEqual([-120, 0]);
  });
  it('窓の正方形を元画像の座標に戻す', () => {
    const a = cropRect({ ox: -140, oy: 0, zoom: 1 }, 0.56, 280);
    expect([a.sx, a.sy, a.size].map((v) => Math.round(v) + 0)).toEqual([250, 0, 500]);
    const r = cropRect({ ox: -280, oy: -140, zoom: 2 }, 0.56, 280);
    expect([r.sx, r.sy, r.size].map((v) => Math.round(v))).toEqual([250, 125, 250]);
  });
});
