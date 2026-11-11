import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { display } from './grade';
import { badgesOf } from './badges';
import { missMsg } from './tracer.svelte';

// 保護者向けの画面は漢字で書き、学年での変換をしない
const PARENT = /\/about\/|DeleteConfirm|DangerModal|DangerZone|Shredder|LangPicker|BirthGate|AppStorePopup/;
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
const sources = files('src')
  .filter((f) => /\.(svelte|ts)$/.test(f) && !f.endsWith('.test.ts') && !PARENT.test(f))
  .map((f) => ({ f, s: readFileSync(f, 'utf8') }));
const MARK = /\{([^{}|]+)\|([^{}|]+)\}/g;
const KANJI = /[々一-鿿]/;

// <script> と <style> と <svelte:head>（ホーム画面のアプリでは見えない題名と説明）を除き、
// {…} の式の外に出ている地の文（属性の値を含む）
function templateText(s: string): string {
  const body = s.replace(
    /<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svelte:head>[\s\S]*?<\/svelte:head>|<!--[\s\S]*?-->/g,
    ''
  );
  let depth = 0;
  let out = '';
  for (const c of body) {
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (depth === 0) out += c;
  }
  return out;
}

describe('子ども向けの文の書き方', () => {
  it('書き方の読みは かな だけで、書き方の外に漢字が無い', () => {
    const bad: string[] = [];
    for (const { f, s } of sources) {
      for (const lit of s.match(/'[^'\n]*'|`[^`]*`/g) ?? []) {
        if (!lit.match(MARK)) continue;
        for (const [, , yomi] of lit.matchAll(MARK)) if (!/^[ぁ-ゟ゠-ヿ]+$/.test(yomi)) bad.push(`${f}: ${lit}`);
        if (KANJI.test(display(lit, 1))) bad.push(`${f}: ${lit}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('子ども向けの .svelte の地の文に、言葉の間を空けた かな が残っていない（t() を通す）', () => {
    const bad = sources
      .filter(({ f }) => f.endsWith('.svelte'))
      .flatMap(({ f, s }) =>
        (templateText(s).match(/[ぁ-ゟ゠-ヿ一-鿿] [ぁ-ゟ゠-ヿ一-鿿]/g) ?? []).map((m) => `${f}: ${m}`)
      );
    expect(bad).toEqual([]);
  });

  it('書き方つきの値を持つ変数と、書き方つきの名前を返す関数は、t() を通して出す', () => {
    const bad: string[] = [];
    for (const { f, s } of sources.filter(({ f }) => f.endsWith('.svelte'))) {
      const script = s.match(/<script[\s\S]*?<\/script>/)?.[0] ?? '';
      const markup = s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
      const vars = script
        .split(/;\n/)
        .flatMap((st) => (MARK.test(st) ? [...st.matchAll(/(?:const|let)\s+(\w+)\s*=/g)].map((m) => m[1]) : []));
      MARK.lastIndex = 0;
      for (const v of vars) if (new RegExp(`\\{\\s*${v}\\s*\\}`).test(markup)) bad.push(`${f}: {${v}}`);
      for (const m of markup.matchAll(/(?<!\$)\{\s*(levelName|gradeLabel|rowLabel)\(/g)) bad.push(`${f}: ${m[0]}`);
    }
    expect(bad).toEqual([]);
  });

  it('保護者向けの画面で使うカレンダーは、学年で変えない', () => {
    const progress = readFileSync('src/routes/about/progress/+page.svelte', 'utf8');
    expect(progress).toMatch(/<Calendar[^>]*\bparent\b/);
  });

  it('1 年生の見た目は書き方を付ける前の文と同じ', () => {
    const ja = Object.fromEntries(badgesOf('ja').map((b) => [b.id, [display(b.name, 1), display(b.desc, 1)]]));
    expect(ja['first-gold']).toEqual(['はじめての きんのほし', 'おてほんなしで はじめて ごうかく']);
    expect(ja['chars-10']).toEqual(['もじ 10', 'もじを 10こ クリア']);
    expect(ja['cat-どうぶつ']).toEqual(['どうぶつ はかせ', 'どうぶつの たんごに ぜんぶ ほし']);
    expect(ja['read-all']).toEqual(['よみクイズ マスター', 'よみクイズの ぜんぶの きゅうで 10もん せいかい']);
    expect(ja['egg-jump']).toEqual(['とびだした！', 'たんごカードの えを 10かい タップして とびださせた']);
    const kanji = Object.fromEntries(badgesOf('kanji').map((b) => [b.id, [display(b.name, 1), display(b.desc, 1)]]));
    expect(kanji['row-1ねんせい']).toEqual(['1ねんせい マスター', '1ねんせいの かんじを ぜんぶ クリア']);
    expect(kanji['read-6']).toEqual(['よみクイズ 6ねんせい', 'よみクイズの 6ねんせいで 10もん せいかい']);
    const r = { mode: 'test' as const, score: 0, ok: false };
    expect(display(missMsg({ ...r, top: '', want: 4 }), 1)).toBe('おしい！ せんの かずは 4 ほんだよ。もういちど！');
    expect(display(missMsg({ ...r, top: 'ほ' }), 1)).toBe('おしい！ 「ほ」に みえるよ。もういちど！');
    expect(display(missMsg({ ...r, top: '' }), 1)).toBe('おしい！ かたちを たしかめて もういちど！');
  });
});
