// 実行: node scripts/fetch-strokes.ts
import { writeFileSync } from 'node:fs';
import { CHARS } from '../src/lib/chars.ts';

const out: Record<string, string[]> = {};
for (const c of CHARS) {
	const cp = c.codePointAt(0)!.toString(16).padStart(5, '0');
	const res = await fetch(`https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${cp}.svg`);
	if (!res.ok) throw new Error(`${c} ${cp} ${res.status}`);
	const svg = await res.text();
	const ds = [...svg.matchAll(/<path id="kvg:[0-9a-f]+-s\d+" d="([^"]+)"/g)].map((m) => m[1]);
	if (ds.length === 0) throw new Error(`no strokes for ${c}`);
	for (const d of ds) {
		const bad = d.replace(/[MmLlCcSsHhVvZz0-9.,\- ]/g, '');
		if (bad) throw new Error(`unsupported path command in ${c}: ${bad}`);
	}
	out[c] = ds;
}
writeFileSync(
	'src/lib/strokes.ts',
	`// KanjiVG (https://kanjivg.tagaini.net) の書き順データ。CC BY-SA 3.0。scripts/fetch-strokes.ts で生成。\nexport const STROKES: Record<string, string[]> = ${JSON.stringify(out, null, '\t')};\n`
);
console.log(Object.keys(out).length, 'chars');
