import { describe, it, expect, beforeEach } from 'vitest';
import { secretOf, recordBalloon, recordEgg, recordPinball, removeSecret } from './secret';

describe('かくし要素の記録', () => {
  beforeEach(() => localStorage.clear());
  it('人ごとに数え、ピンボールは最高回数だけ残す', () => {
    expect(secretOf('p1')).toEqual({ balloons: 0, eggs: 0, pinball: 0 });
    recordBalloon('p1');
    recordEgg('p1');
    recordEgg('p1');
    recordPinball('p1', 12);
    recordPinball('p1', 8);
    expect(secretOf('p1')).toEqual({ balloons: 1, eggs: 2, pinball: 12 });
    expect(secretOf('p2').eggs).toBe(0);
    removeSecret('p1');
    expect(secretOf('p1').eggs).toBe(0);
  });
});
