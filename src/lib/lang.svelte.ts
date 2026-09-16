import { CHARS, CHARS_EN, CHARS_KANA, toKatakana } from './chars';
import { KANJI_ALL } from './kanji';
import { STROKES } from './strokes';
import { STROKES_EN } from './strokes-en';
import { STROKES_KANA } from './strokes-kana';
import { STROKES_KANJI } from './strokes-kanji';
import { isCharWord, type Word } from './words';
import { getRaw, setRaw } from './storage';

export type Lang = 'ja' | 'kana' | 'kanji' | 'en';
export const LANGS: Lang[] = ['ja', 'kana', 'kanji', 'en'];
const KEY = 'kk:lang';

// 現在の言語。ホームのトグルで切り替え、全画面が参照する
const saved = getRaw(KEY);
export const lang = $state<{ v: Lang }>({ v: LANGS.find((l) => l === saved) ?? 'ja' });

export function setLang(v: Lang) {
  lang.v = v;
  setRaw(KEY, v);
}

const LANG_INFO: Record<
  Lang,
  { title: string; short: string; glyph: string; speech: string; strokes: Record<string, string[]>; chars: string[] }
> = {
  ja: { title: 'かきかき ひらがな', short: 'ひらがな', glyph: 'あ', speech: 'ja-JP', strokes: STROKES, chars: CHARS },
  kana: {
    title: 'かきかき かたかな',
    short: 'かたかな',
    glyph: 'ア',
    speech: 'ja-JP',
    strokes: STROKES_KANA,
    chars: CHARS_KANA
  },
  kanji: {
    title: 'かきかき かんじ',
    short: 'かんじ',
    glyph: '漢',
    speech: 'ja-JP',
    strokes: STROKES_KANJI,
    chars: KANJI_ALL
  },
  en: { title: 'かきかき えいご', short: 'えいご', glyph: 'A', speech: 'en-US', strokes: STROKES_EN, chars: CHARS_EN }
};

export const info = (l: Lang = lang.v) => LANG_INFO[l];
export const strokesOf = (l: Lang = lang.v) => LANG_INFO[l].strokes;
export const charsOf = (l: Lang = lang.v) => LANG_INFO[l].chars;

// 英語名は Dog のように先頭だけ大文字で見せる（大文字が単語の 1 文字目として練習に入る。1 文字練習はそのまま）
const enName = (w: Word) => (isCharWord(w) ? w.en : w.en.charAt(0).toUpperCase() + w.en.slice(1));
// 表示名。カタカナはひらがな名から変換、英語は先頭だけ大文字。かんじ の単語は 1 文字なのでそのまま
export const nameOf = (w: Word, l: Lang = lang.v) =>
  l === 'kana' ? toKatakana(w.name) : l === 'en' ? enName(w) : w.name;
// 補助行（常に 2 行）: 表示していない残り 2 つの表記
export const subOf = (w: Word, l: Lang = lang.v): string[] =>
  w.name === w.en
    ? []
    : l === 'ja'
      ? [toKatakana(w.name), enName(w)]
      : l === 'kana'
        ? [w.name, enName(w)]
        : [toKatakana(w.name), w.name];

// 書く対象の文字。スペースやハイフンは飛ばす
export const lettersOf = (w: Word, l: Lang = lang.v) => [...nameOf(w, l)].filter((c) => c !== ' ' && c !== '-');
