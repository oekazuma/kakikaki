import { CHARS, ALPHABET, CHARS_EN, CHARS_KANA, toKatakana } from './chars';
import { STROKES } from './strokes';
import { STROKES_EN } from './strokes-en';
import { STROKES_KANA } from './strokes-kana';
import type { Word } from './words';
import { getRaw, setRaw } from './storage';

export type Lang = 'ja' | 'kana' | 'en';
export const LANGS: Lang[] = ['ja', 'kana', 'en'];
const KEY = 'kk:lang';

// 現在の言語。ホームのトグルで切り替え、全画面が参照する
const saved = getRaw(KEY);
export const lang = $state<{ v: Lang }>({ v: saved === 'en' || saved === 'kana' ? saved : 'ja' });

export function setLang(v: Lang) {
  lang.v = v;
  setRaw(KEY, v);
}

export const LANG_INFO: Record<
  Lang,
  { title: string; short: string; speech: string; strokes: Record<string, string[]>; chars: string[] }
> = {
  ja: { title: 'かきかき ひらがな', short: 'ひらがな', speech: 'ja-JP', strokes: STROKES, chars: CHARS },
  kana: { title: 'かきかき かたかな', short: 'かたかな', speech: 'ja-JP', strokes: STROKES_KANA, chars: CHARS_KANA },
  en: { title: 'かきかき えいご', short: 'えいご', speech: 'en-US', strokes: STROKES_EN, chars: CHARS_EN }
};

export const info = (l: Lang = lang.v) => LANG_INFO[l];
export const strokesOf = (l: Lang = lang.v) => LANG_INFO[l].strokes;
export const charsOf = (l: Lang = lang.v) => LANG_INFO[l].chars;

// 表示名。カタカナはひらがな名から変換、英語は単語そのもの
export const nameOf = (w: Word, l: Lang = lang.v) => (l === 'ja' ? w.name : l === 'kana' ? toKatakana(w.name) : w.en);
export { toKatakana };
// 補助行（常に 2 行）: 表示していない残り 2 つの表記
export const subOf = (w: Word, l: Lang = lang.v): string[] =>
  w.name === w.en
    ? []
    : l === 'ja'
      ? [toKatakana(w.name), w.en]
      : l === 'kana'
        ? [w.name, w.en]
        : [toKatakana(w.name), w.name];

// 書く対象の文字。スペースやハイフンは飛ばす
export const lettersOf = (w: Word, l: Lang = lang.v) => [...nameOf(w, l)].filter((c) => c !== ' ' && c !== '-');

export { ALPHABET };
