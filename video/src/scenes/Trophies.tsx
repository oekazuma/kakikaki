import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, THEME, UI } from '../theme';
import { Icon, Pop, card } from '../ui';

// 実績画面（routes/trophies）: だれの記録か・めだるの輪・カレンダー・めだるの段
const BADGES: [string, string, string, number][] = [
  ['sunflower', 'はじめの いっぽ', 'もじを 1つ クリア', 1],
  ['balloon', 'はじめての たんご', 'たんごに はじめて ほし', 1],
  ['star', 'きんのほし 10', 'おてほんなしで 10もじ', 1],
  ['apple', 'くだもの はかせ', 'くだものに ぜんぶ ほし', 1],
  ['dog', 'どうぶつ はかせ', 'どうぶつに ぜんぶ ほし', 0.8],
  ['bus', 'のりもの はかせ', 'のりものに ぜんぶ ほし', 0.5],
  ['rocket', 'たんご 100', '100この たんごに ほし', 0.28],
  ['cake', '30にち れんしゅう', '30にち れんしゅうした', 0.4]
];
const DAYS = new Set([1, 2, 4, 5, 8, 9, 10, 11, 12, 13, 14]);

export const Trophies = () => {
  const frame = useCurrentFrame();
  const t = THEME.ja;
  const ring = interpolate(frame, [10, 50], [0, 0.22], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const R = 52;
  const L = 2 * Math.PI * R;
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.ink, fontFamily: UI }}>
      <div style={{ position: 'absolute', left: 28, top: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ ...card, width: 52, height: 52, display: 'grid', placeContent: 'center', color: t.blue }}>
          <Icon name="back" size={28} />
        </div>
        <b style={{ fontSize: 34, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="trophy" size={32} /> めだる と きろく
        </b>
      </div>
      <div
        style={{
          ...card,
          position: 'absolute',
          left: 28,
          top: 88,
          width: 1224,
          height: 150,
          display: 'grid',
          gridTemplateColumns: '300px 190px 1fr',
          gap: 20,
          alignItems: 'center',
          padding: '0 26px',
          background: 'linear-gradient(120deg, #fff 55%, #fff6d6)',
          opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' })
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Img
            src={staticFile('img/person-girl.svg')}
            style={{ width: 84, height: 84, borderRadius: '50%', background: '#eef3f8' }}
          />
          <div style={{ display: 'grid' }}>
            <b style={{ fontSize: 30 }}>はな</b>
            <small style={{ fontSize: 16, color: C.sub }}>ひらがな の きろく</small>
          </div>
        </div>
        <div style={{ position: 'relative', width: 130, height: 130, display: 'grid', placeContent: 'center' }}>
          <svg viewBox="0 0 120 120" width={130} height={130} style={{ position: 'absolute', inset: 0 }}>
            <circle cx="60" cy="60" r={R} fill="none" stroke="#e6e9ed" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={C.star}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={L}
              strokeDashoffset={L * (1 - ring)}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div style={{ textAlign: 'center', lineHeight: 1 }}>
            <b style={{ fontSize: 34 }}>{Math.round(ring * 100)}%</b>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>めだる</div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          <small style={{ fontSize: 14, color: C.sub }}>つぎの めだる</small>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Img src={staticFile('img/dog.svg')} style={{ width: 56, height: 56 }} />
            <div style={{ display: 'grid', gap: 4, width: 520 }}>
              <b style={{ fontSize: 22 }}>どうぶつ はかせ</b>
              <span style={{ fontSize: 14, color: C.sub }}>どうぶつの たんごに ぜんぶ ほし</span>
              <span style={{ height: 8, borderRadius: 4, background: '#e6e9ed' }}>
                <span
                  style={{
                    display: 'block',
                    height: 8,
                    borderRadius: 4,
                    background: t.teal,
                    width: `${interpolate(frame, [20, 60], [0, 80], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}%`
                  }}
                />
              </span>
              <span style={{ fontSize: 14, color: C.warn, fontWeight: 700 }}>あと 3</span>
            </div>
          </div>
        </div>
      </div>
      <Pop
        at={14}
        from={30}
        style={{ ...card, position: 'absolute', left: 28, top: 262, width: 360, padding: '16px 20px' }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, fontSize: 20, fontWeight: 700 }}
        >
          9 がつ
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              borderRadius: 14,
              background: '#fff3c4',
              color: C.warn,
              fontSize: 16
            }}
          >
            <Icon name="star" size={16} fill /> つづけて 7 にち
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px 4px',
            textAlign: 'center',
            fontSize: 15
          }}
        >
          {['にち', 'げつ', 'か', 'すい', 'もく', 'きん', 'ど'].map((w) => (
            <span key={w} style={{ color: C.sub, fontSize: 12 }}>
              {w}
            </span>
          ))}
          {Array.from({ length: 2 }, (_, i) => (
            <span key={`e${i}`} />
          ))}
          {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
            <span key={d} style={{ display: 'grid', placeContent: 'center' }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'grid',
                  placeContent: 'center',
                  fontWeight: 700,
                  background: DAYS.has(d) && frame > 30 + d * 2 ? C.star : 'transparent',
                  color: DAYS.has(d) && frame > 30 + d * 2 ? '#fff' : d > 14 ? '#c3c9cf' : C.ink,
                  border: d === 14 ? `3px solid ${t.blue}` : '3px solid transparent'
                }}
              >
                {d}
              </span>
            </span>
          ))}
        </div>
      </Pop>
      <div
        style={{
          position: 'absolute',
          left: 412,
          top: 262,
          width: 840,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14
        }}
      >
        {BADGES.map(([img, name, desc, p], i) => (
          <Pop key={name} at={24 + i * 5} from={30}>
            <div
              style={{
                ...card,
                position: 'relative',
                height: 244,
                padding: '14px 10px',
                display: 'grid',
                justifyItems: 'center',
                alignContent: 'start',
                textAlign: 'center',
                gap: 6,
                background: p >= 1 ? 'linear-gradient(160deg, #fffbe6, #fff1b8)' : '#f7f8f5',
                border: p >= 1 ? `2px solid ${C.star}` : '2px solid transparent'
              }}
            >
              {i === 3 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -6,
                    background: '#e53935',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    padding: '2px 10px',
                    borderRadius: 10,
                    rotate: '8deg'
                  }}
                >
                  NEW!
                </span>
              )}
              <Img
                src={staticFile(`img/${img}.svg`)}
                style={{ width: 72, height: 72, filter: p >= 1 ? 'none' : 'grayscale(1)', opacity: p >= 1 ? 1 : 0.45 }}
              />
              <b style={{ fontSize: 18 }}>{name}</b>
              <small style={{ fontSize: 13, color: C.sub }}>{desc}</small>
              {p >= 1 ? (
                <span style={{ fontSize: 13, color: C.warn, fontWeight: 700 }}>2026/09/14 ゲット！</span>
              ) : (
                <>
                  <span style={{ width: '80%', height: 6, borderRadius: 3, background: '#e6e9ed', marginTop: 4 }}>
                    <span
                      style={{ display: 'block', height: 6, borderRadius: 3, background: t.teal, width: `${p * 100}%` }}
                    />
                  </span>
                  <span style={{ fontSize: 13, color: C.sub }}>あと {Math.round((1 - p) * 10)}</span>
                </>
              )}
            </div>
          </Pop>
        ))}
      </div>
    </AbsoluteFill>
  );
};
