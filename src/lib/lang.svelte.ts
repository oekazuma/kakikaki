import { CHARS, ALPHABET, CHARS_EN } from './chars';
import { STROKES } from './strokes';
import { STROKES_EN } from './strokes-en';
import type { Word } from './words';

export type Lang = 'ja' | 'en';
const KEY = 'kk:lang';
const store = () => (typeof localStorage === 'undefined' ? null : localStorage);

// 現在の言語。ホームのトグルで切り替え、全画面が参照する
export const lang = $state<{ v: Lang }>({ v: store()?.getItem(KEY) === 'en' ? 'en' : 'ja' });

export function setLang(v: Lang) {
	lang.v = v;
	store()?.setItem(KEY, v);
}

export const LANG_INFO: Record<Lang, { title: string; short: string; speech: string; strokes: Record<string, string[]>; chars: string[] }> = {
	ja: { title: 'かきかき ひらがな', short: 'ひらがな', speech: 'ja-JP', strokes: STROKES, chars: CHARS },
	en: { title: 'かきかき えいご', short: 'えいご', speech: 'en-US', strokes: STROKES_EN, chars: CHARS_EN }
};

export const info = () => LANG_INFO[lang.v];
export const strokesOf = (l: Lang = lang.v) => LANG_INFO[l].strokes;
export const charsOf = (l: Lang = lang.v) => LANG_INFO[l].chars;

// 表示名。英語は単語そのもの
export const nameOf = (w: Word, l: Lang = lang.v) => (l === 'ja' ? w.name : w.en);
// ひらがな → カタカナ（ー はそのまま）
export const toKatakana = (s: string) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
// 補助行: ひらがな のときは「カタカナ 英語」、えいご のときは「カタカナ」
export const descOf = (w: Word, l: Lang = lang.v) => (w.name === w.en ? undefined : l === 'ja' ? `${toKatakana(w.name)}  ${w.en}` : toKatakana(w.name));

// 書く対象の文字。スペースやハイフンは飛ばす
export const lettersOf = (w: Word, l: Lang = lang.v) => [...nameOf(w, l)].filter((c) => c !== ' ' && c !== '-');

export { ALPHABET };
