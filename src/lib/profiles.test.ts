import { describe, it, expect, beforeEach, vi } from 'vitest';

// モジュール読み込み時に移行が走るので、毎回読み直す
async function fresh() {
  vi.resetModules();
  const [profiles, progress, lang] = await Promise.all([
    import('./profiles.svelte'),
    import('./progress.svelte'),
    import('./lang.svelte')
  ]);
  return { ...profiles, ...progress, ...lang };
}

describe('profiles', () => {
  beforeEach(() => localStorage.clear());

  it('初回は p1 を作り、旧キー（kk:progress / kk:<lang>:*）の記録を引き継ぐ', async () => {
    localStorage.setItem('kk:progress', JSON.stringify({ あ: { trace: 2, free: 1, test: 0 } }));
    localStorage.setItem('kk:en:earned', JSON.stringify({ 'first-char': '2026-01-01' }));
    localStorage.setItem('kk:lang', 'en');
    const m = await fresh();
    expect(m.profiles.list.map((p) => p.id)).toEqual(['p1']);
    expect(m.current().lang).toBe('en');
    expect(localStorage.getItem('kk:progress')).toBeNull();
    expect(localStorage.getItem('kk:ja:progress')).toBeNull();
    expect(JSON.parse(localStorage.getItem('kk:p1:ja:progress')!).あ.trace).toBe(2);
    expect(JSON.parse(localStorage.getItem('kk:p1:en:earned')!)['first-char']).toBe('2026-01-01');
    m.setLang('ja');
    expect(m.get('あ')).toEqual({ trace: 2, free: 1, test: 0 });
  });

  it('人ごとに記録が分かれ、切り替えで言語と記録が戻る', async () => {
    const m = await fresh();
    m.setLang('ja');
    m.record('あ', 'trace');
    const b = m.addProfile('  はなこ  ', 'dog', 'en')!;
    expect(b.name).toBe('はなこ');
    m.switchProfile(b.id);
    expect([m.lang.v, m.get('あ').trace]).toEqual(['en', 0]);
    m.setLang('ja');
    m.rememberLang('ja');
    m.record('あ', 'trace');
    m.record('あ', 'trace');
    expect(localStorage.getItem(`kk:${b.id}:ja:progress`)).toContain('"trace":2');
    m.switchProfile('p1');
    expect(m.get('あ').trace).toBe(1);
    m.switchProfile(b.id);
    expect([m.lang.v, m.get('あ').trace]).toEqual(['ja', 2]);
  });

  it('上限 10 人、最後の 1 人は消せない、削除で記録も消えて使用中なら先頭へ', async () => {
    const m = await fresh();
    for (let i = 0; i < 9; i++) expect(m.addProfile(`p${i}`)).not.toBeNull();
    expect(m.addProfile('11人目')).toBeNull();
    const last = m.profiles.list[9];
    m.switchProfile(last.id);
    m.record('か', 'free');
    m.deleteProfile(last.id);
    expect([m.profiles.cur, m.profiles.list.length]).toEqual(['p1', 9]);
    expect(localStorage.getItem(`kk:${last.id}:ja:progress`)).toBeNull();
    expect(m.get('か').free).toBe(0);
    for (const p of [...m.profiles.list].slice(1)) m.deleteProfile(p.id);
    expect(m.removeProfile('p1')).toBe(false);
    expect(m.updateProfile('p1', { name: 'たろう', avatar: 'bear' })).toBe(true);
    expect(m.current()).toMatchObject({ name: 'たろう', avatar: 'bear' });
  });
});
