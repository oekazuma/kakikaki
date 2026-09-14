import { AbsoluteFill, interpolate, random, useCurrentFrame } from 'remotion';
import { C, THEME, UI } from '../theme';
import { Burst, Pop } from '../ui';

// かくしゲーム「ふうせん ぽん」: 風船が上がってきて、指でわるとコンボ
const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff8fd8', '#ffa94d'];
const N = 12;
// 画面下に並んで待つ風船が上がってくる。0・2・4 番目を、画面の真ん中あたりに来たときに割る
const balloon = (i: number) => {
  const speed = 6 + random(`bv${i}`) * 3;
  const y0 = 880 + i * 75;
  return {
    x: 120 + random(`bx${i}`) * 1040,
    size: 70 + random(`bs${i}`) * 40,
    speed,
    y0,
    color: COLORS[i % COLORS.length]
  };
};
const POPS: [number, number][] = [0, 2, 4].map((i) => {
  const b = balloon(i);
  return [i, Math.round((b.y0 - 380) / b.speed)];
});

export const Balloon = () => {
  const frame = useCurrentFrame();
  const t = THEME.ja;
  const popped = POPS.filter(([, at]) => frame >= at).length;
  return (
    <AbsoluteFill
      style={{ background: 'linear-gradient(#e8f4ff, #f4f5f0)', color: C.ink, fontFamily: UI, overflow: 'hidden' }}
    >
      {Array.from({ length: N }, (_, i) => {
        const b = balloon(i);
        const pop = POPS.find(([k]) => k === i);
        if (pop && frame >= pop[1]) return null;
        const y = b.y0 - frame * b.speed;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.x,
              top: y,
              width: b.size,
              translate: '-50% 0',
              rotate: `${Math.sin(frame * 0.12 + i) * 6}deg`,
              display: 'grid',
              justifyItems: 'center'
            }}
          >
            <span
              style={{
                width: b.size,
                height: b.size * 1.18,
                background: `radial-gradient(circle at 32% 28%, #fff9 0 14%, transparent 15%), ${b.color}`,
                borderRadius: '50% 50% 50% 50% / 42% 42% 58% 58%'
              }}
            />
            <span
              style={{
                width: 0,
                height: 0,
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderBottom: `10px solid ${b.color}`,
                marginTop: -4
              }}
            />
            <span style={{ width: 2, height: b.size * 0.35, background: '#9e9e9e' }} />
          </div>
        );
      })}
      {POPS.map(([i, at], k) => {
        const b = balloon(i);
        const y = b.y0 - at * b.speed + b.size * 0.6;
        return (
          <div key={i}>
            {frame >= at - 10 && frame < at + 12 && (
              <div
                style={{
                  position: 'absolute',
                  left: b.x - 28,
                  top: y - 28,
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(79,124,174,.35)',
                  border: '3px solid #fff',
                  scale: `${interpolate(frame, [at - 10, at, at + 12], [1.6, 0.9, 1.3], { extrapolateRight: 'clamp' })}`,
                  opacity: frame >= at ? interpolate(frame, [at, at + 12], [1, 0]) : 1
                }}
              />
            )}
            <Burst at={at} x={b.x} y={y} n={16} />
            {frame >= at && frame < at + 30 && (
              <b
                style={{
                  position: 'absolute',
                  left: b.x - 60,
                  top: y - 60 - (frame - at) * 2,
                  width: 120,
                  textAlign: 'center',
                  fontSize: 40,
                  color: t.dark,
                  opacity: interpolate(frame, [at + 16, at + 30], [1, 0], { extrapolateLeft: 'clamp' })
                }}
              >
                +{10 + k * 5}
              </b>
            )}
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 28,
          display: 'flex',
          gap: 14,
          fontSize: 30,
          fontWeight: 700
        }}
      >
        <span style={{ background: '#fff', padding: '8px 22px', borderRadius: 24 }}>
          てんすう {[0, 10, 25, 45][popped]}
        </span>
        {popped > 1 && (
          <span style={{ background: C.star, color: '#fff', padding: '8px 22px', borderRadius: 24 }}>
            コンボ {popped}
          </span>
        )}
      </div>
      <Pop
        at={6}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 40, display: 'grid', justifyItems: 'center' }}
      >
        <span
          style={{
            background: t.blue,
            color: '#fff',
            fontSize: 40,
            fontWeight: 700,
            padding: '12px 40px',
            borderRadius: 40,
            boxShadow: '0 8px 24px rgba(0,0,0,.15)'
          }}
        >
          どこかに かくれた ふうせんを みつけたら、かくしゲーム
        </span>
      </Pop>
    </AbsoluteFill>
  );
};
