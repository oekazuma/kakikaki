// 実行: node scripts/make-icon.ts [文字] [地の色] [影の色] [出力名]
// 例(えいご版): node scripts/make-icon.ts A "#e8734a" "#b8502c"
// 例(かたかな版): node scripts/make-icon.ts ア "#3a9d5d" "#2b7a46"
// 例(かんじ版): node scripts/make-icon.ts 漢 "#c2495f" "#962e44" logo-mark-kanji
// 文字がひらがなのときは KanjiVG の書き順、それ以外は下の GLYPHS から太線を描く。
import { writeFileSync } from 'node:fs';
import { STROKES } from '../src/lib/strokes.ts';
import { STROKES_KANA } from '../src/lib/strokes-kana.ts';
import { STROKES_KANJI } from '../src/lib/strokes-kanji.ts';

const [glyph = 'あ', main = '#4f7cae', dark = '#2f5b8a', out = 'logo-mark'] = process.argv.slice(2);
const GLYPHS: Record<string, string[]> = { A: ['M18 92 L54.5 14 L91 92', 'M31 66 H78'] };
const ds = STROKES[glyph] ?? STROKES_KANA[glyph] ?? STROKES_KANJI[glyph] ?? GLYPHS[glyph];
if (!ds) throw new Error(`no strokes for ${glyph}`);
// 画数の多い漢字は線を細くしないと潰れる
const sw = ds.length > 8 ? 7 : 15;
const paths = ds.map((d) => `<path d="${d}"/>`).join('\n      ');
const star = (cx: number, cy: number, r: number, fill: string, extra = '') => {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r,
      t = -Math.PI / 2 + (i * Math.PI) / 5;
    p.push(`${(cx + rr * Math.cos(t)).toFixed(1)},${(cy + rr * Math.sin(t)).toFixed(1)}`);
  }
  return `<polygon points="${p.join(' ')}" fill="${fill}"${extra}/>`;
};
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${main}"/>
  <g stroke="#dfe9f5" stroke-width="3" stroke-dasharray="10 10" opacity=".45"><line x1="256" y1="70" x2="256" y2="442"/><line x1="70" y1="256" x2="442" y2="256"/></g>
  <g transform="translate(78 84) scale(3.3)" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <g stroke="${dark}" stroke-width="${sw}" transform="translate(2.5 3)">
      ${paths}
    </g>
    <g stroke="#fff" stroke-width="${sw}">
      ${paths}
    </g>
  </g>
  ${star(410, 104, 46, '#f5b400')}
  ${star(410, 104, 46, '#ffd766', ' transform="translate(-4 -4) scale(.82)" transform-origin="410 104"')}
</svg>
`;
if (glyph === 'あ') writeFileSync('static/icon.svg', icon);
writeFileSync(
  `static/${out}.svg`,
  icon.replace('<rect width="512" height="512" fill=', '<rect width="512" height="512" rx="112" fill=')
);
console.log(
  `static/${out}.svg を書き出した${glyph === 'あ' ? '（static/icon.svg も）' : ''}。PNG 化: qlmanage -t -s 512 -o static static/icon.svg && mv static/icon.svg.png static/icon-512.png && sips -z 180 180 static/icon-512.png --out static/icon-180.png`
);
