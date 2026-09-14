import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, THEME, UI } from '../theme';
import { Confetti, Pop } from '../ui';

export const Outro = () => {
  const frame = useCurrentFrame();
  const fade = (from: number) =>
    interpolate(frame, [from, from + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.ink, fontFamily: UI, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 34, marginTop: 100 }}>
        {(['', '-kana', '-en'] as const).map((s, i) => (
          <Pop key={s} at={4 + i * 6}>
            <Img src={staticFile(`logo-mark${s}.svg`)} style={{ width: 150, height: 150 }} />
          </Pop>
        ))}
      </div>
      <div style={{ marginTop: 20, fontSize: 120, fontWeight: 700, color: THEME.ja.blue, opacity: fade(16) }}>
        かきかき
      </div>
      <div style={{ fontSize: 48, fontWeight: 700, color: THEME.ja.teal, opacity: fade(24) }}>
        オフラインで つかえる・こうこく なし・むりょう
      </div>
      <div style={{ marginTop: 40, fontSize: 40, fontWeight: 700, color: C.sub, opacity: fade(36) }}>
        タブレットを よこにして あそんでね
      </div>
      <div
        style={{
          marginTop: 22,
          fontSize: 46,
          fontWeight: 700,
          color: THEME.ja.dark,
          background: '#fff',
          padding: '10px 36px',
          borderRadius: 30,
          opacity: fade(44)
        }}
      >
        oekazuma.github.io/kakikaki
      </div>
      <Confetti at={8} n={30} />
    </AbsoluteFill>
  );
};
