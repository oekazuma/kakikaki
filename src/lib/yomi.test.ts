import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function fresh() {
  vi.resetModules();
  const [profiles, yomi] = await Promise.all([import('./profiles.svelte'), import('./yomi.svelte')]);
  return { ...profiles, ...yomi };
}

describe('yomi', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11));
  });
  afterEach(() => vi.useRealTimers());

  it('いまの人の学年で変換し、隠している字は読みにする', async () => {
    const m = await fresh();
    expect(m.t('{見|み}る ことば')).toBe('みる ことば');
    m.updateProfile(m.current().id, { birth: '2017-05-01' });
    expect(m.gradeNow()).toBe(3);
    expect(m.t('{見|み}る ことば')).toBe('見ることば');
    m.hide.v = ['見'];
    expect(m.t('{見|み}る ことば')).toBe('みることば');
  });

  it('差し込む値は変換せず、となりの空白は値の端の字で決める', async () => {
    const m = await fresh();
    m.updateProfile(m.current().id, { birth: '2017-05-01' });
    expect(m.t`${'ひらがな'} の {記録|きろく}`).toBe('ひらがなのきろく');
    expect(m.t`${'た ろう'} の え`).toBe('た ろうのえ');
    expect(m.t`${4} ほん`).toBe('4 ほん');
    expect(m.t`${'{見|み}'} る`).toBe('{見|み} る');
  });

  it('生年月日が無い・未来・形が違う人を聞き直す', async () => {
    const m = await fresh();
    const a = m.addProfile('a', 'cat', 'ja', '2030-01-01')!;
    const b = m.addProfile('b', 'cat', 'ja', 'abc')!;
    const c = m.addProfile('c', 'cat', 'ja', '2019-05-01')!;
    expect(m.missingBirth().map((p) => p.id)).toEqual([m.profiles.list[0].id, a.id, b.id]);
    expect(m.missingBirth().some((p) => p.id === c.id)).toBe(false);
  });
});
