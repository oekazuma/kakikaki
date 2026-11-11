import { describe, it, expect } from 'vitest';
import { display, isBirth, kanjiUpTo, schoolGrade } from './grade';

describe('schoolGrade', () => {
  it('4 月 2 日生まれから翌 4 月 1 日生まれまでが同じ学年で、4 月 1 日に上がる', () => {
    expect(schoolGrade('2019-04-02', '2026-03-31')).toBe(0);
    expect(schoolGrade('2019-04-02', '2026-04-01')).toBe(1);
    expect(schoolGrade('2019-04-01', '2025-03-31')).toBe(0);
    expect(schoolGrade('2019-04-01', '2025-04-01')).toBe(1);
    expect(schoolGrade('2019-04-01', '2026-11-11')).toBe(2);
  });
  it('2 月 29 日生まれ・中学生・大人', () => {
    expect(schoolGrade('2020-02-29', '2026-11-11')).toBe(1);
    expect(schoolGrade('2014-01-15', '2026-11-11')).toBe(7);
    expect(schoolGrade('1990-06-01', '2026-11-11')).toBeGreaterThan(7);
  });
});

describe('isBirth', () => {
  it('未来と 100 年より前は使えない', () => {
    expect(isBirth('2019-05-01', '2026-11-11')).toBe(true);
    expect(isBirth('2026-11-11', '2026-11-11')).toBe(true);
    expect(isBirth('2026-11-12', '2026-11-11')).toBe(false);
    expect(isBirth('1926-11-11', '2026-11-11')).toBe(true);
    expect(isBirth('1926-11-10', '2026-11-11')).toBe(false);
  });
  it('形が違う値は使えない', () => {
    for (const v of ['2019-02-30', '2019-5-1', '2019-05-01x', '', null, undefined, 20190501])
      expect(isBirth(v, '2026-11-11')).toBe(false);
  });
});

describe('kanjiUpTo', () => {
  it('1 つ前の学年まで。中学生からは全部', () => {
    expect([null, -1, 0, 1, 2, 6, 7, 30].map(kanjiUpTo)).toEqual([0, 0, 0, 0, 1, 5, 6, 6]);
  });
});

describe('display', () => {
  it('熟語は全部の字が使えるときだけ漢字にする', () => {
    expect(display('{練習|れんしゅう}', 3)).toBe('れんしゅう');
    expect(display('{練習|れんしゅう}', 4)).toBe('練習');
    expect(display('{見|み}る', 1)).toBe('みる');
    expect(display('{見|み}る', 2)).toBe('見る');
    expect(display('{見|み}る', null)).toBe('みる');
  });
  it('隠している字を含む語は読みにする', () => {
    expect(display('お{手本|てほん}なし', 4, ['手'])).toBe('おてほんなし');
    expect(display('お{手本|てほん}なし', 4, ['目'])).toBe('お手本なし');
  });
  it('3 年生から かな・漢字 の間の空白だけを消す', () => {
    expect(display('おてほんなしで {書|か}いてみよう！ {見|み}る', 2)).toBe('おてほんなしで かいてみよう！ 見る');
    expect(display('おてほんなしで {書|か}いてみよう！ もう{一度|いちど}', 3)).toBe(
      'おてほんなしで書いてみよう！ もういちど'
    );
    expect(display('せんの かずは 4 ほんだよ', 3)).toBe('せんのかずは 4 ほんだよ');
    expect(display('1 {日|にち} 1 {回|かい}', 5)).toBe('1 日 1 回');
    expect(display('A を かく', 3)).toBe('A をかく');
    expect(display('ピンボール かいすう', 3)).toBe('ピンボールかいすう');
  });
  it('小学校で習わない字は大人にもひらがな', () => {
    expect(display('{戻|もど}る', 30)).toBe('もどる');
  });
  it('カタカナは 1 年生で習うので、2 年生から書き方どおりカタカナにする', () => {
    expect(display('{メダル|めだる} ゲット！', null)).toBe('めだる ゲット！');
    expect(display('{メダル|めだる} ゲット！', 1)).toBe('めだる ゲット！');
    expect(display('{メダル|めだる} ゲット！', 2)).toBe('メダル ゲット！');
    expect(display('{メダル|めだる} と {記録|きろく}', 3)).toBe('メダルときろく');
    expect(display('{メダル|めだる} と {記録|きろく}', 30)).toBe('メダルと記録');
    expect(display('{メダル|めだる}', 4, ['ダ'])).toBe('めだる');
  });
});
