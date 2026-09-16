import { CHARS, CHARS_EN, CHARS_KANA, toKatakana } from './chars';
import { KANJI_ALL } from './kanji';
import { STROKES } from './strokes';
import { STROKES_EN } from './strokes-en';
import { STROKES_KANA } from './strokes-kana';
import { isCharWord, type Word } from './words';
import { getRaw, setRaw } from './storage';
import { TOL, type Tolerance } from './judge';

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

// trace: なぞる の緩さ。かんじ は画が細かく、少しはみ出す・少し足りないが起きやすいので線から 15、画の 2 割手前で可
const LANG_INFO: Record<
  Lang,
  { title: string; short: string; glyph: string; speech: string; chars: string[]; trace: Tolerance }
> = {
  ja: { title: 'かきかき ひらがな', short: 'ひらがな', glyph: 'あ', speech: 'ja-JP', chars: CHARS, trace: TOL },
  kana: {
    title: 'かきかき かたかな',
    short: 'かたかな',
    glyph: 'ア',
    speech: 'ja-JP',
    chars: CHARS_KANA,
    trace: TOL
  },
  kanji: {
    title: 'かきかき かんじ',
    short: 'かんじ',
    glyph: '漢',
    speech: 'ja-JP',
    chars: KANJI_ALL,
    trace: { r: 15, end: 0.2 }
  },
  en: { title: 'かきかき えいご', short: 'えいご', glyph: 'A', speech: 'en-US', chars: CHARS_EN, trace: TOL }
};

export const info = (l: Lang = lang.v) => LANG_INFO[l];

// 書き順。かんじ（1026 字、gzip で約 330KB）は起動時の JS に入れず、書く画面が必要になってから読む（+layout が loadStrokes を呼ぶ）。
// 読み込み前は空なので、書く画面は strokesReady で盤面を出し分ける
const STROKE_TABLES: Partial<Record<Lang, Record<string, string[]>>> = {
  ja: STROKES,
  kana: STROKES_KANA,
  en: STROKES_EN
};
const loaded = $state({ kanji: false });
export const strokesOf = (l: Lang = lang.v) => (void loaded.kanji, STROKE_TABLES[l] ?? {});
export const strokesReady = (l: Lang = lang.v) => (void loaded.kanji, l in STROKE_TABLES);
export async function loadStrokes(l: Lang = lang.v) {
  if (l in STROKE_TABLES) return;
  STROKE_TABLES[l] = (await import('./strokes-kanji')).STROKES_KANJI;
  loaded.kanji = true;
}
// その ことば で書ける字（書き順を持つ字。えいご は数字も含む）。かんじ は読み込み前でも判定できるよう字の一覧で持つ
const WRITABLE: Record<Lang, Set<string>> = {
  ja: new Set(Object.keys(STROKES)),
  kana: new Set(Object.keys(STROKES_KANA)),
  kanji: new Set(KANJI_ALL),
  en: new Set(Object.keys(STROKES_EN))
};
export const canWrite = (c: string, l: Lang = lang.v) => WRITABLE[l].has(c);
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
