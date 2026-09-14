// 実行: node scripts/fetch-strokes.ts
import { writeFileSync } from 'node:fs';
import { CHARS, CHARS_KANA } from '../src/lib/chars.ts';

// 取得元のコミット。上げるときは pnpm strokes を回して差分を確認する（上流の修正で座標が変わると判定の手触りも変わる）
const KANJIVG = '422b5538595676da918c288a4230cb5e22a1ee7e';

for (const [chars, file, name] of [
  [CHARS, 'src/lib/strokes.ts', 'STROKES'],
  [CHARS_KANA, 'src/lib/strokes-kana.ts', 'STROKES_KANA']
] as const) {
  const out: Record<string, string[]> = {};
  for (const c of chars) {
    const cp = c.codePointAt(0)!.toString(16).padStart(5, '0');
    const res = await fetch(`https://raw.githubusercontent.com/KanjiVG/kanjivg/${KANJIVG}/kanji/${cp}.svg`);
    if (!res.ok) throw new Error(`${c} ${cp} ${res.status}`);
    const svg = await res.text();
    const ds = [...svg.matchAll(/<path id="kvg:[0-9a-f]+-s\d+"[^>]*? d="([^"]+)"/g)].map((m) => m[1]);
    if (ds.length === 0) throw new Error(`no strokes for ${c}`);
    for (const d of ds) {
      const bad = d.replace(/[MmLlCcSsHhVvZz0-9.,\- ]/g, '');
      if (bad) throw new Error(`unsupported path command in ${c}: ${bad}`);
    }
    out[c] = ds;
  }
  writeFileSync(
    file,
    `// KanjiVG (https://kanjivg.tagaini.net) の書き順データ。CC BY-SA 3.0。scripts/fetch-strokes.ts で生成（KanjiVG ${KANJIVG.slice(0, 7)}）。\nexport const ${name}: Record<string, string[]> = ${JSON.stringify(out, null, '\t')};\n`
  );
  console.log(file, Object.keys(out).length, 'chars');
}
