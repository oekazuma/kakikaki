// 実行: node scripts/fetch-images.ts
// words.ts の emoji から Twemoji (CC BY 4.0) の SVG を static/img/<id>.svg に保存する。既存ファイルは上書きしない。
import { existsSync, writeFileSync } from 'node:fs';
import { WORDS } from '../src/lib/words.ts';

const CDN = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg';
const code = (e: string) =>
  [...e]
    .map((c) => c.codePointAt(0)!)
    .filter((cp) => cp !== 0xfe0f)
    .map((cp) => cp.toString(16))
    .join('-');

let n = 0;
for (const w of WORDS) {
  const out = `static/img/${w.id}.svg`;
  if (!w.emoji || existsSync(out)) continue;
  const res = await fetch(`${CDN}/${code(w.emoji)}.svg`);
  if (!res.ok) throw new Error(`${w.id} ${w.emoji} ${code(w.emoji)} ${res.status}`);
  writeFileSync(out, await res.text());
  n++;
}
console.log(n, 'images fetched');
