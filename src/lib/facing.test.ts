import { describe, it, expect } from 'vitest';
import { LEFT, RIGHT, flipFor } from './facing';
import { WORDS } from './words';

describe('facing', () => {
  it('向きの id は全部 words.ts に実在し、左右に重複が無い', () => {
    const ids = new Set(WORDS.map((w) => w.id));
    for (const id of [...LEFT, ...RIGHT]) expect(ids.has(id), id).toBe(true);
    for (const id of LEFT) expect(RIGHT.has(id), id).toBe(false);
  });
  it('右へ進むとき左向きの絵だけ反転し、正面向きはどちらでもそのまま', () => {
    expect(flipFor('giraffe', 'right')).toBe(true);
    expect(flipFor('giraffe', 'left')).toBe(false);
    expect(flipFor('kangaroo', 'left')).toBe(true);
    expect(flipFor('dog', 'right')).toBe(false);
  });
});
