import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// 書く対象の文字だけ教科書体（PWA と同じ static/fonts の Klee One）。UI は Mac の丸ゴシック
loadFont({ family: 'Klee One', url: staticFile('fonts/KleeOne-Regular.woff2'), weight: '400' });
loadFont({ family: 'Klee One', url: staticFile('fonts/KleeOne-SemiBold.woff2'), weight: '700' });
loadFont({
  family: 'Klee One',
  url: staticFile('fonts/KleeOne-Regular-kanji.woff2'),
  weight: '400',
  unicodeRange: 'U+4E00-9FFF'
});
loadFont({
  family: 'Klee One',
  url: staticFile('fonts/KleeOne-SemiBold-kanji.woff2'),
  weight: '700',
  unicodeRange: 'U+4E00-9FFF'
});

export const UI = "'Hiragino Maru Gothic ProN', 'Rounded Mplus 1c', 'Hiragino Sans', sans-serif";
export const KYOKASHO = `'Klee One', ${UI}`;

// static/app.css の CSS 変数と同じ値
export const C = {
  bg: '#f4f5f0',
  ink: '#1f2933',
  sub: '#6b7280',
  guide: '#d9dfe4',
  grid: '#e1e5ea',
  star: '#f5b400',
  warn: '#e08a00',
  pill: '#eef1f4'
};
export type Lang = 'ja' | 'kana' | 'kanji' | 'en';
export const THEME: Record<Lang, { blue: string; teal: string; dark: string }> = {
  ja: { blue: '#4f7cae', teal: '#13786f', dark: '#2f5b8a' },
  kana: { blue: '#3a9d5d', teal: '#2f8a6a', dark: '#2b7a46' },
  kanji: { blue: '#c2495f', teal: '#a63b4f', dark: '#962e44' },
  en: { blue: '#e8734a', teal: '#c95f2e', dark: '#b8502c' }
};
export const CONFETTI = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff8fd8'];
export const SPARK = ['#f5b400', '#ffd766', '#7fd8ff', '#fff'];
