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
    // ことばを選んでリセット: 他のことばと他の人は残る
    m.setLang('ja');
    m.record('あ', 'trace');
    m.setLang('en');
    m.record('a', 'trace');
    const secret = await import('./secret');
    const balloon = await import('./balloon.svelte');
    secret.recordPinball('p1', 30);
    balloon.saveScore('p1', 80, '2026-09-15');
    m.resetRecords('p1', ['ja']);
    expect([m.get('a').trace, localStorage.getItem('kk:p1:ja:progress')]).toEqual([1, null]);
    expect(secret.secretOf('p1').pinball).toBe(30); // 1 ことば だけのリセットでは残る
    m.setLang('ja');
    expect(m.get('あ').trace).toBe(0);
    m.resetRecords('p1', [...m.LANGS]);
    expect(secret.secretOf('p1').pinball).toBe(0);
    expect(balloon.loadBests().p1).toBeUndefined();
    expect(m.updateProfile('p1', { name: 'たろう', avatar: 'bear' })).toBe(true);
    expect(m.current()).toMatchObject({ name: 'たろう', avatar: 'bear' });
  });

  it('壊れた kk:profiles は作り直し、cur が一覧に無ければ先頭の人にする', async () => {
    localStorage.setItem('kk:profiles', JSON.stringify({ list: 'nope', cur: 'p1' }));
    expect((await fresh()).profiles.list.map((p) => p.id)).toEqual(['p1']);
    localStorage.setItem(
      'kk:profiles',
      JSON.stringify({ list: [{ id: 'p3', name: 'A', avatar: 'cat', lang: 'ja' }, { id: 'x' }], cur: 'p9' })
    );
    const m = await fresh();
    expect([m.profiles.cur, m.profiles.list.length]).toEqual(['p3', 1]);
    m.record('あ', 'trace');
    expect(localStorage.getItem('kk:p3:ja:progress')).toContain('"trace":1');
  });

  it('人を消すと ふうせん ぽん の自己ベストも消え、同じ id の新しい人に引き継がれない', async () => {
    const m = await fresh();
    const b = await import('./balloon.svelte');
    const p2 = m.addProfile('はな')!;
    b.saveScore(p2.id, 120, '2026-09-14');
    b.saveScore('p1', 50, '2026-09-14');
    m.deleteProfile(p2.id);
    expect(b.loadBests()[p2.id]).toBeUndefined();
    expect(b.loadBests().p1.score).toBe(50);
    const p2b = m.addProfile('たろう')!;
    expect(p2b.id).toBe(p2.id); // id は再利用される
    expect(b.ranking(m.profiles.list).map((r) => r.id)).toEqual(['p1']);
  });

  it('容量超過で保存できないときは追加・更新を巻き戻す', async () => {
    const m = await fresh();
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    try {
      expect(m.addProfile('はな')).toBeNull();
      expect(m.profiles.list.length).toBe(1);
      expect(m.updateProfile('p1', { name: 'たろう' })).toBe(false);
      expect(m.current().name).toBe('わたし');
    } finally {
      spy.mockRestore();
    }
  });
});
