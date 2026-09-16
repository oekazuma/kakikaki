import { AbsoluteFill, Img, interpolate, interpolateColors, staticFile, useCurrentFrame } from 'remotion';
import { toKatakana } from '../../../src/lib/chars';
import { STROKES } from '../../../src/lib/strokes';
import { STROKES_EN } from '../../../src/lib/strokes-en';
import { STROKES_KANA } from '../../../src/lib/strokes-kana';
import { STROKES_KANJI } from '../../../src/lib/strokes-kanji';
import { KYOKASHO } from '../theme';
import { C, THEME, UI, type Lang } from '../theme';
import { Board, Card, card } from '../ui';

// ホームのトグルで ひらがな → かたかな → かんじ → えいご と切り替わり、色・単語名・書く文字が変わる。かんじ は単語の代わりに字と読み
const AT = [44, 88, 132];
const LANGS: { id: Lang; glyph: string; short: string; strokes: Record<string, string[]> }[] = [
  { id: 'ja', glyph: 'あ', short: 'ひらがな', strokes: STROKES },
  { id: 'kana', glyph: 'ア', short: 'かたかな', strokes: STROKES_KANA },
  { id: 'kanji', glyph: '漢', short: 'かんじ', strokes: STROKES_KANJI },
  { id: 'en', glyph: 'A', short: 'えいご', strokes: STROKES_EN }
];
const WORDS: [string, string, string][] = [
  ['dog', 'いぬ', 'Dog'],
  ['cat', 'ねこ', 'Cat'],
  ['apple', 'りんご', 'Apple']
];
const KANJI: [string, string][] = [
  ['犬', 'いぬ'],
  ['花', 'はな'],
  ['山', 'やま']
];
const nameOf = (l: Lang, ja: string, en: string) => (l === 'ja' ? ja : l === 'kana' ? toKatakana(ja) : en);
const subOf = (l: Lang, ja: string, en: string) =>
  l === 'ja' ? [toKatakana(ja), en] : l === 'kana' ? [ja, en] : [toKatakana(ja), ja];

export const Langs = () => {
  const frame = useCurrentFrame();
  const li = frame < AT[0] ? 0 : frame < AT[1] ? 1 : frame < AT[2] ? 2 : 3;
  const lang = LANGS[li].id;
  const since = li ? frame - AT[li - 1] : frame;
  const mix = (k: 'blue' | 'teal' | 'dark') =>
    interpolateColors(
      frame,
      [AT[0] - 6, AT[0] + 6, AT[1] - 6, AT[1] + 6, AT[2] - 6, AT[2] + 6],
      [THEME.ja[k], THEME.kana[k], THEME.kana[k], THEME.kanji[k], THEME.kanji[k], THEME.en[k]]
    );
  const knob = interpolate(
    frame,
    [AT[0] - 6, AT[0] + 6, AT[1] - 6, AT[1] + 6, AT[2] - 6, AT[2] + 6],
    [0, 1, 1, 2, 2, 3],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    }
  );
  const swap = interpolate(since, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.ink, fontFamily: UI }}>
      <div style={{ position: 'absolute', left: 40, top: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Img src={staticFile(`logo-mark${lang === 'ja' ? '' : `-${lang}`}.svg`)} style={{ width: 64, height: 64 }} />
        <b style={{ fontSize: 40, color: mix('blue') }}>かきかき</b>
        <b style={{ fontSize: 40, color: mix('teal') }}>{LANGS[li].short}</b>
      </div>
      <div style={{ ...card, position: 'absolute', right: 40, top: 30, display: 'flex', padding: 6, borderRadius: 40 }}>
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 6 + knob * 150,
            width: 150,
            height: 66,
            borderRadius: 33,
            background: mix('blue')
          }}
        />
        {LANGS.map((l, i) => (
          <div
            key={l.id}
            style={{
              position: 'relative',
              width: 150,
              height: 66,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 30,
              fontWeight: 700,
              color: i === li ? '#fff' : C.sub
            }}
          >
            {l.glyph} <small style={{ fontSize: 16 }}>{l.short}</small>
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 120,
          display: 'flex',
          justifyContent: 'center',
          gap: 60
        }}
      >
        {WORDS.map(([id, ja, en], i) => {
          const kanji = lang === 'kanji';
          const name = kanji ? KANJI[i][0] : nameOf(lang, ja, en);
          const strokes = LANGS[li].strokes[name[0]];
          return (
            <div key={id} style={{ display: 'grid', gap: 16, justifyItems: 'center', opacity: 0.5 + swap * 0.5 }}>
              {kanji ? (
                <div
                  style={{
                    ...card,
                    width: 200,
                    height: 156,
                    display: 'grid',
                    placeContent: 'center',
                    gap: 6,
                    textAlign: 'center',
                    fontFamily: KYOKASHO
                  }}
                >
                  <b style={{ fontSize: 76, lineHeight: 1.1 }}>{name}</b>
                  <span style={{ fontSize: 22, color: C.sub, fontFamily: UI }}>{KANJI[i][1]}</span>
                </div>
              ) : (
                <Card id={id} name={name} sub={subOf(lang, ja, en)} size={200} star={i < 2} />
              )}
              <div style={{ ...card, padding: 6 }}>
                <Board
                  strokes={strokes}
                  mode="trace"
                  lang={lang}
                  size={250}
                  ink={interpolate(since, [10 + i * 6, 44 + i * 6], [0, strokes.length], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp'
                  })}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 22,
          textAlign: 'center',
          fontSize: 44,
          fontWeight: 700,
          color: mix('dark')
        }}
      >
        {lang === 'kanji' ? 'かんじは しょうがく 1〜6ねんの 1026じ' : 'おなじ たんごを ひらがな・かたかな・えいごで'}
      </div>
    </AbsoluteFill>
  );
};
