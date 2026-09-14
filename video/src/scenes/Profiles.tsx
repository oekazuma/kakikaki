import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, THEME, UI } from '../theme';
import { Icon, Pop, card } from '../ui';

// つかう人（routes/profiles）: きょうだいも おとなも 10 人まで。指で たろう に切り替える
const PEOPLE: [string, string, string][] = [
  ['person-girl', 'はな', 'ひらがな'],
  ['person-boy', 'たろう', 'かたかな'],
  ['person-woman', 'まま', 'えいご'],
  ['person-man', 'ぱぱ', 'ひらがな'],
  ['person-grandma', 'ばあば', 'ひらがな'],
  ['panda', 'ゆう', 'ひらがな']
];
const TAP = 56;

export const Profiles = () => {
  const frame = useCurrentFrame();
  const t = THEME.ja;
  const sel = frame < TAP ? 0 : 1;
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.ink, fontFamily: UI }}>
      <div style={{ position: 'absolute', left: 28, top: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ ...card, width: 52, height: 52, display: 'grid', placeContent: 'center', color: t.blue }}>
          <Icon name="back" size={28} />
        </div>
        <b style={{ fontSize: 34 }}>だれが つかう？</b>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 110,
          width: 1160,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24
        }}
      >
        {PEOPLE.map(([img, name, l], i) => (
          <Pop key={name} at={6 + i * 5} from={30}>
            <div
              style={{
                ...card,
                height: 230,
                display: 'grid',
                justifyItems: 'center',
                alignContent: 'center',
                gap: 8,
                border: `4px solid ${i === sel ? t.blue : 'transparent'}`,
                background: i === sel ? '#eef3f8' : '#fff',
                scale: i === 1 && frame >= TAP && frame < TAP + 8 ? '0.96' : '1'
              }}
            >
              <Img
                src={staticFile(`img/${img}.svg`)}
                style={{ width: 110, height: 110, borderRadius: '50%', background: '#f4f5f0' }}
              />
              <b style={{ fontSize: 26 }}>{name}</b>
              <small style={{ fontSize: 14, color: C.sub, background: C.pill, padding: '2px 12px', borderRadius: 10 }}>
                {l}
              </small>
            </div>
          </Pop>
        ))}
        <Pop at={38} from={30}>
          <div
            style={{
              ...card,
              height: 230,
              display: 'grid',
              justifyItems: 'center',
              alignContent: 'center',
              gap: 8,
              color: t.teal,
              fontWeight: 700,
              fontSize: 22,
              border: `3px dashed ${C.guide}`,
              background: 'transparent',
              boxShadow: 'none'
            }}
          >
            <Icon name="plus" size={48} />
            ふやす
          </div>
        </Pop>
      </div>
      {frame >= TAP - 12 && frame < TAP + 16 && (
        <div
          style={{
            position: 'absolute',
            left: 560,
            top: 200,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(79,124,174,.35)',
            border: '3px solid #fff',
            scale: `${interpolate(frame, [TAP - 12, TAP, TAP + 16], [1.6, 0.9, 1.3], { extrapolateRight: 'clamp' })}`,
            opacity: frame >= TAP ? interpolate(frame, [TAP, TAP + 16], [1, 0]) : 1
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 60,
          textAlign: 'center',
          fontSize: 44,
          fontWeight: 700,
          color: t.dark,
          opacity: interpolate(frame, [30, 44], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        }}
      >
        きょうだいも おとなも 10 にんまで。きろくは ひとりずつ
      </div>
    </AbsoluteFill>
  );
};
