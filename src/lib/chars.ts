// 五十音表。各配列は縦 1 列（あ段〜お段）。ん は わ・を の列に入れる
export const SEION: string[][] = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', '', 'ゆ', '', 'よ'],
  ['ら', 'り', 'る', 'れ', 'ろ'],
  ['わ', '', 'を', '', 'ん']
];
export const DAKUON: string[][] = [
  ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
  ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
  ['だ', 'ぢ', 'づ', 'で', 'ど'],
  ['ば', 'び', 'ぶ', 'べ', 'ぼ']
];
export const HANDAKUON: string[][] = [['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ']];
export const KOGAKI: string[][] = [
  ['ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ'],
  ['ゃ', 'ゅ', 'ょ', 'っ', '']
];
export const CHOON: string[][] = [['ー']];
export const GROUPS: { name: string; cols: string[][] }[] = [
  { name: 'だくおん', cols: DAKUON },
  { name: 'はんだくおん', cols: HANDAKUON },
  { name: 'ちいさいもじ', cols: KOGAKI },
  { name: 'のばすおと', cols: CHOON }
];
export const GOJUON = [...SEION, ...DAKUON, ...HANDAKUON, ...KOGAKI, ...CHOON];
export const CHARS = GOJUON.flat().filter(Boolean);

const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const ALPHABET: string[][] = [
  [...AZ.slice(0, 13)],
  [...AZ.slice(13)],
  [...AZ.toLowerCase().slice(0, 13)],
  [...AZ.toLowerCase().slice(13)]
];
export const CHARS_EN = ALPHABET.flat();
