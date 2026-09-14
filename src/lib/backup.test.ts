import { describe, it, expect, beforeEach } from 'vitest';
import { exportAll, parseBackup, importAll, summarize } from './backup';

describe('backup', () => {
  beforeEach(() => localStorage.clear());

  it('書き出し → 消去 → 読み込みで kk: のキーだけが元に戻る', () => {
    localStorage.setItem('kk:profiles', JSON.stringify({ list: [{ id: 'p1' }, { id: 'p2' }], cur: 'p1' }));
    localStorage.setItem('kk:p1:ja:progress', '{"あ":{"trace":2,"free":1,"test":0}}');
    localStorage.setItem('other', 'keep');
    const text = exportAll('123-abc');
    const b = parseBackup(text);
    expect(b.version).toBe('123-abc');
    expect(summarize(b)).toMatchObject({ people: 2, keys: 2 });
    localStorage.clear();
    localStorage.setItem('kk:p9:ja:progress', 'stale');
    localStorage.setItem('other', 'keep');
    importAll(b);
    expect(localStorage.getItem('kk:p1:ja:progress')).toBe('{"あ":{"trace":2,"free":1,"test":0}}');
    expect(localStorage.getItem('kk:p9:ja:progress')).toBeNull();
    expect(localStorage.getItem('other')).toBe('keep');
  });

  it('形が違うファイルは受け付けない', () => {
    expect(() => parseBackup('{')).toThrow();
    expect(() => parseBackup(JSON.stringify({ app: 'other', data: {} }))).toThrow();
    expect(() => parseBackup(JSON.stringify({ app: 'kakikaki', data: { evil: 'x' } }))).toThrow();
    expect(() => parseBackup(JSON.stringify({ app: 'kakikaki', data: { 'kk:lang': 1 } }))).toThrow();
    expect(parseBackup(JSON.stringify({ app: 'kakikaki', version: 'v', at: 'd', data: {} })).data).toEqual({});
  });
});
