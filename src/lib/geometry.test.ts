import { describe, it, expect } from 'vitest';
import { pathToPoints, resampleN, length, nearestDist, centroid, dist } from './geometry';

describe('geometry', () => {
  it('直線 path を等間隔に分割する', () => {
    const pts = pathToPoints('M0,0 L30,0', 10);
    expect(pts.map((p) => Math.round(p.x))).toEqual([0, 10, 20, 30]);
  });
  it('相対コマンドと曲線を扱う', () => {
    const pts = pathToPoints('M10,10c10,0,10,10,20,10s10,10,0,20', 1);
    expect(pts[0]).toEqual({ x: 10, y: 10 });
    expect(dist(pts.at(-1)!, { x: 30, y: 40 })).toBeLessThan(0.01);
    expect(length(pts)).toBeGreaterThan(40);
  });
  it('resampleN はちょうど n 点', () => {
    const pts = resampleN(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 }
      ],
      5
    );
    expect(pts.map((p) => Math.round(p.x))).toEqual([0, 25, 50, 75, 100]);
  });
  it('nearestDist / centroid', () => {
    const line = [
      { x: 0, y: 0 },
      { x: 10, y: 0 }
    ];
    expect(nearestDist({ x: 5, y: 3 }, line)).toBeCloseTo(Math.hypot(5, 3));
    expect(centroid(line)).toEqual({ x: 5, y: 0 });
  });
});
