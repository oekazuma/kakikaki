import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, KYOKASHO, THEME, UI } from '../theme';
import { Burst, Confetti, Icon, Pop, Stars, card } from '../ui';
import { Card } from '../ui';

// よみクイズ（もじ → イラスト）に正解して、めだるのトーストが出る
const TAP = 38;
const TOAST = 80;
const CHOICES: [string, string][] = [
  ['cat', 'ねこ'],
  ['dog', 'いぬ'],
  ['rabbit', 'うさぎ']
];

export const Quiz = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = THEME.ja;
  const tap = spring({ frame: frame - TAP, fps, config: { damping: 10, stiffness: 200 } });
  const toast = spring({ frame: frame - TOAST, fps, config: { damping: 14, stiffness: 120 } });
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.ink, fontFamily: UI }}>
      <div style={{ position: 'absolute', left: 22, top: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ ...card, width: 52, height: 52, display: 'grid', placeContent: 'center', color: t.blue }}>
          <Icon name="back" size={28} />
        </div>
        <b style={{ fontSize: 34, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="bulb" size={32} /> よみクイズ
        </b>
        <span style={{ fontSize: 22, color: C.sub, background: C.pill, padding: '4px 14px', borderRadius: 14 }}>
          かんたん 3 / 10
        </span>
        <Stars n={3} k={2} size={26} />
      </div>
      <div
        style={{
          ...card,
          position: 'absolute',
          left: 40,
          top: 110,
          width: 420,
          height: 560,
          display: 'grid',
          placeContent: 'center',
          justifyItems: 'center',
          gap: 10
        }}
      >
        <div
          style={{
            ...card,
            background: C.pill,
            width: 56,
            height: 56,
            display: 'grid',
            placeContent: 'center',
            color: t.blue
          }}
        >
          <Icon name="speaker" size={28} />
        </div>
        <b style={{ fontFamily: KYOKASHO, fontSize: 140, lineHeight: 1.1 }}>いぬ</b>
        <span style={{ fontSize: 32, color: C.sub }}>は どれ？</span>
      </div>
      <div
        style={{ position: 'absolute', left: 500, top: 110, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}
      >
        {CHOICES.map(([id, name], i) => (
          <div
            key={id}
            style={{
              scale: i === 1 ? `${1 + tap * 0.06}` : '1',
              borderRadius: 24,
              border: `4px solid ${i === 1 && frame >= TAP ? C.star : 'transparent'}`,
              background: i === 1 && frame >= TAP ? '#fff8dc' : 'transparent',
              opacity: i !== 1 && frame >= TAP ? 0.45 : 1
            }}
          >
            <Card id={id} name={name} size={340} style={{ background: 'transparent', boxShadow: 'none' }} />
          </div>
        ))}
        <div
          style={{
            display: 'grid',
            placeContent: 'center',
            fontSize: 26,
            color: C.sub,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.5
          }}
        >
          みて・きいて・
          <br />
          あなうめも
        </div>
      </div>
      {frame >= TAP - 10 && frame < TAP + 14 && (
        <div
          style={{
            position: 'absolute',
            left: 1040,
            top: 300,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(79,124,174,.35)',
            border: '3px solid #fff',
            scale: `${interpolate(frame, [TAP - 10, TAP, TAP + 14], [1.6, 0.9, 1.3], { extrapolateRight: 'clamp' })}`,
            opacity: frame >= TAP ? interpolate(frame, [TAP, TAP + 14], [1, 0]) : 1
          }}
        />
      )}
      <Burst at={TAP} x={1070} y={330} n={20} />
      <Pop at={TAP + 2} style={{ position: 'absolute', left: 40, top: 700, width: 420, textAlign: 'center' }}>
        <b style={{ fontSize: 56, color: t.blue }}>せいかい！</b>
      </Pop>
      <div
        style={{
          ...card,
          position: 'absolute',
          left: 340,
          top: 24,
          width: 600,
          translate: `0px ${(toast - 1) * 140}px`,
          opacity: frame < TOAST ? 0 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '16px 30px',
          background: '#fffae6',
          boxShadow: '0 8px 24px rgba(0,0,0,.15)'
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: C.star,
            color: '#fff',
            display: 'grid',
            placeContent: 'center'
          }}
        >
          <Icon name="trophy" size={38} />
        </div>
        <div>
          <small style={{ display: 'block', color: C.warn, fontWeight: 700, fontSize: 18 }}>めだる ゲット！</small>
          <b style={{ fontSize: 34 }}>どうぶつ はかせ</b>
        </div>
      </div>
      <Confetti at={TOAST} />
    </AbsoluteFill>
  );
};
