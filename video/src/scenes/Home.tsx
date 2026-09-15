import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { CATEGORIES, WORDS } from '../../../src/lib/words';
import { C, THEME, UI } from '../theme';
import { Card, Icon, Pop, card, subs } from '../ui';

// ホーム（routes/+page）。カテゴリの段が右から流れ込み、きりん を指でえらぶ
const TAP = 110;
const rows = CATEGORIES.slice(0, 3).map((c) => ({ c, words: WORDS.filter((w) => w.category === c).slice(0, 7) }));

export const Home = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = THEME.ja;
  const tap = spring({ frame: frame - TAP, fps, config: { damping: 12, stiffness: 180 } });
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.ink, fontFamily: UI, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: 28,
          top: 20,
          right: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          whiteSpace: 'nowrap',
          opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' })
        }}
      >
        <Img src={staticFile('logo-mark.svg')} style={{ width: 52, height: 52 }} />
        <b style={{ fontSize: 28, color: t.blue }}>かきかき</b>
        <b style={{ fontSize: 28, color: t.teal, marginRight: 8 }}>ひらがな</b>
        <div
          style={{
            ...card,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 14px 4px 4px',
            borderRadius: 30
          }}
        >
          <Img src={staticFile('img/person-girl.svg')} style={{ width: 44, height: 44, borderRadius: '50%' }} />
          <b style={{ fontSize: 16 }}>はな</b>
        </div>
        <div
          style={{
            ...card,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '12px 14px',
            fontSize: 15,
            fontWeight: 700,
            color: C.warn
          }}
        >
          <Icon name="trophy" size={22} /> 12 こ
        </div>
        <div
          style={{
            ...card,
            padding: '12px 14px',
            fontWeight: 700,
            color: t.teal,
            display: 'flex',
            gap: 6,
            alignItems: 'center'
          }}
        >
          <Icon name="bulb" size={22} /> クイズ
        </div>
        <div style={{ ...card, padding: '12px 14px', fontWeight: 700, color: t.teal }}>もじから えらぶ</div>
        <div style={{ ...card, padding: 12, color: t.teal }}>
          <Icon name="help" size={22} />
        </div>
        <div style={{ ...card, marginLeft: 'auto', display: 'flex', padding: 4, borderRadius: 30 }}>
          {[
            ['あ', 'ひらがな'],
            ['ア', 'かたかな'],
            ['A', 'えいご']
          ].map(([g, s], i) => (
            <span
              key={g}
              style={{
                width: 88,
                height: 44,
                borderRadius: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                fontSize: 20,
                fontWeight: 700,
                color: i === 0 ? '#fff' : C.sub,
                background: i === 0 ? t.blue : 'transparent'
              }}
            >
              {g} <small style={{ fontSize: 11 }}>{s}</small>
            </span>
          ))}
        </div>
      </div>
      {rows.map(({ c, words }, r) => (
        <div
          key={c}
          style={{
            position: 'absolute',
            left: 28,
            top: 96 + r * 236,
            translate: `${interpolate(frame, [10 + r * 8, 34 + r * 8], [120, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px 0px`,
            opacity: interpolate(frame, [10 + r * 8, 30 + r * 8], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp'
            })
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: C.sub, margin: '0 0 8px' }}>{c}</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {words.map((w, i) => (
              <div key={w.id} style={{ scale: r === 0 && w.id === 'giraffe' ? `${1 - tap * 0.06}` : '1' }}>
                <Card id={w.id} name={w.name} sub={subs(w)} size={162} star={r === 0 && i < 4} />
              </div>
            ))}
          </div>
        </div>
      ))}
      {frame >= TAP - 12 && frame < TAP + 16 && (
        <div
          style={{
            position: 'absolute',
            left: 790,
            top: 226,
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
      <Pop
        at={60}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 28, display: 'grid', justifyItems: 'center' }}
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
          いろいろな たんごを カテゴリから えらぶ
        </span>
      </Pop>
    </AbsoluteFill>
  );
};
