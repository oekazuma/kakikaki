import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exportAll, parseBackup, importAll, summarize, backupFile, type Backup } from './backup';

describe('backup', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

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
    expect(importAll(b)).toBe(true);
    expect(localStorage.getItem('kk:p1:ja:progress')).toBe('{"あ":{"trace":2,"free":1,"test":0}}');
    expect(localStorage.getItem('kk:p9:ja:progress')).toBeNull();
    expect(localStorage.getItem('other')).toBe('keep');
  });

  it('共有シート用の File は日付入りの名前と型を持ち、中身は書き出しと同じ', async () => {
    const f = backupFile('123-abc');
    expect(f.name).toMatch(/^kakikaki-\d{4}-\d{2}-\d{2}\.json$/);
    expect(f.type).toBe('application/json');
    // happy-dom は File.text を持たないため Response 経由で読む
    const text = await new Response(f).text();
    expect(parseBackup(text).version).toBe('123-abc');
  });

  it('形が違うファイルは受け付けない', () => {
    expect(() => parseBackup('{')).toThrow();
    expect(() => parseBackup(JSON.stringify({ app: 'other', data: {} }))).toThrow();
    expect(() => parseBackup(JSON.stringify({ app: 'kakikaki', data: { evil: 'x' } }))).toThrow();
    expect(() => parseBackup(JSON.stringify({ app: 'kakikaki', data: { 'kk:lang': 1 } }))).toThrow();
    expect(parseBackup(JSON.stringify({ app: 'kakikaki', version: 'v', at: 'd', data: {} })).data).toEqual({});
  });

  it('version / at が無いファイルは受け付けない', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'kakikaki', data: {} }))).toThrow();
  });

  it('キー数・総バイト数が常識外のファイルは受け付けない', () => {
    const data: Record<string, string> = {};
    for (let i = 0; i < 401; i++) data[`kk:x${i}`] = 'v';
    expect(() => parseBackup(JSON.stringify({ app: 'kakikaki', version: 'v', at: 'd', data }))).toThrow();
    expect(() => parseBackup('a'.repeat(8 * 1024 * 1024 + 1))).toThrow();
  });

  it('途中で容量超過しても元の記録に戻り false を返す', () => {
    localStorage.setItem('kk:profiles', 'orig-profiles');
    localStorage.setItem('kk:p1:ja:progress', 'orig-progress');
    const b: Backup = {
      app: 'kakikaki',
      version: 'v',
      at: 'd',
      data: { 'kk:profiles': 'new-profiles', 'kk:p9:ja:progress': 'new-progress' }
    };
    // happy-dom では Storage.prototype への spy がインスタンスの呼び出しに効かないため、
    // localStorage インスタンス自身に spy する（instance-level spy）
    const original = localStorage.setItem.bind(localStorage);
    let calls = 0;
    vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      calls++;
      // 2 回目の setItem だけ容量超過にして、書きかけの途中で失敗させる
      if (calls === 2) throw new DOMException('quota', 'QuotaExceededError');
      original(key, value);
    });

    expect(importAll(b)).toBe(false);
    expect(localStorage.getItem('kk:profiles')).toBe('orig-profiles');
    expect(localStorage.getItem('kk:p1:ja:progress')).toBe('orig-progress');
    expect(localStorage.getItem('kk:p9:ja:progress')).toBeNull();
  });
});
