import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, THEME, UI } from '../theme';
import { Card, Pop } from '../ui';

const ROW: [string, string, string[]][] = [
  ['dog', 'いぬ', ['イヌ', 'Dog']],
  ['cat', 'ねこ', ['ネコ', 'Cat']],
  ['apple', 'りんご', ['リンゴ', 'Apple']],
  ['bus', 'ばす', ['バス', 'Bus']],
  ['giraffe', 'きりん', ['キリン', 'Giraffe']],
  ['strawberry', 'いちご', ['イチゴ', 'Strawberry']],
  ['penguin', 'ぺんぎん', ['ペンギン', 'Penguin']]
];

export const Title = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.ink, fontFamily: UI, alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 120 }}>
        <Pop at={4}>
          <Img src={staticFile('logo-mark.svg')} style={{ width: 200, height: 200 }} />
        </Pop>
        <div
          style={{
            opacity: interpolate(frame, [12, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            translate: `${interpolate(frame, [12, 30], [-30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px 0px`
          }}
        >
          <div style={{ fontSize: 130, fontWeight: 700, color: THEME.ja.blue, lineHeight: 1.1 }}>かきかき</div>
          <div style={{ fontSize: 44, fontWeight: 700, color: THEME.ja.teal, letterSpacing: 2 }}>
            ひらがな・かたかな・えいご
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 36,
          fontSize: 44,
          fontWeight: 700,
          color: C.sub,
          opacity: interpolate(frame, [30, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        }}
      >
        すきな たんごを えらんで、なぞって、かいて、あそぼう
      </div>
      <div style={{ position: 'absolute', bottom: 24, display: 'flex', gap: 18 }}>
        {ROW.map(([id, name, sub], i) => (
          <Pop key={id} at={40 + i * 4} from={120}>
            <Card id={id} name={name} sub={sub} size={160} star={i % 3 === 0} />
          </Pop>
        ))}
      </div>
    </AbsoluteFill>
  );
};
