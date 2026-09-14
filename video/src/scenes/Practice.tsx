import type { ReactNode } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { C, KYOKASHO, THEME, UI } from '../theme';
import { Card, Icon, Stars, card, type Mode } from '../ui';

// 練習画面（routes/practice）の枠。中央のカードに盤面を置く
export const BOARD = { x: 375, y: 111, size: 650 };
const MODES: { id: Mode; icon: 'trace' | 'pencil' | 'star'; label: string }[] = [
  { id: 'trace', icon: 'trace', label: 'なぞる' },
  { id: 'free', icon: 'pencil', label: 'じぶんで かく' },
  { id: 'test', icon: 'star', label: 'おてほんなし' }
];

export const Practice = ({
  mode,
  title,
  hint,
  chars,
  active,
  done,
  children,
  overlay
}: {
  mode: Mode;
  title: string;
  hint: string;
  chars: string[];
  active: number;
  done: number;
  children: ReactNode;
  overlay?: ReactNode;
}) => {
  const frame = useCurrentFrame();
  const t = THEME.ja;
  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        color: C.ink,
        fontFamily: UI,
        opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' })
      }}
    >
      <div style={{ position: 'absolute', left: 22, top: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ ...card, width: 52, height: 52, display: 'grid', placeContent: 'center', color: t.blue }}>
          <Icon name="back" size={28} />
        </div>
        <b style={{ fontSize: 34 }}>{title}</b>
        <span style={{ fontSize: 20, color: C.sub }}>{hint}</span>
      </div>
      <div style={{ position: 'absolute', left: 22, top: 88, width: 240, display: 'grid', gap: 18 }}>
        <div style={{ position: 'relative' }}>
          <Card id="giraffe" name="きりん" sub={['キリン', 'Giraffe']} size={240} />
          <div
            style={{
              ...card,
              position: 'absolute',
              right: -8,
              bottom: -8,
              width: 46,
              height: 46,
              display: 'grid',
              placeContent: 'center',
              color: t.blue
            }}
          >
            <Icon name="speaker" size={24} />
          </div>
        </div>
        <div style={{ ...card, display: 'flex', padding: 4 }}>
          {MODES.map((m) => (
            <div
              key={m.id}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 16,
                fontWeight: 700,
                fontSize: 11,
                whiteSpace: 'nowrap',
                color: m.id === mode ? '#fff' : C.sub,
                background: m.id === mode ? t.teal : 'transparent',
                display: 'grid',
                justifyItems: 'center',
                gap: 4
              }}
            >
              <Icon name={m.icon} size={20} />
              {m.label}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {chars.map((ch, n) => (
            <div
              key={n}
              style={{
                ...card,
                width: 62,
                height: 68,
                display: 'grid',
                gridTemplateRows: '1fr 16px',
                justifyItems: 'center',
                alignItems: 'center',
                padding: '6px 0 4px',
                fontSize: 30,
                fontWeight: 700,
                border: `3px solid ${n === active ? t.dark : 'transparent'}`,
                background: n === active ? t.blue : n < done ? '#fff8dc' : '#fff',
                color: n === active ? '#fff' : n > done ? '#c3c9cf' : C.ink
              }}
            >
              <span style={{ fontFamily: KYOKASHO }}>{ch}</span>
              <span style={{ color: n === active ? '#fff' : C.star, display: 'grid' }}>
                {n < done ? <Icon name="star" size={14} fill /> : n > done ? <Icon name="lock" size={14} /> : null}
              </span>
            </div>
          ))}
        </div>
        <div style={{ ...card, padding: '10px 14px', display: 'grid', gap: 4, fontSize: 14, fontWeight: 700 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            なぞる <Stars n={2} k={mode === 'trace' ? 0 : 2} size={20} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            じぶんで かく <Stars n={1} k={mode === 'test' ? 1 : 0} size={20} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: C.warn }}>
            おてほんなし <Stars n={1} k={0} size={20} />
          </div>
        </div>
      </div>
      <div style={{ ...card, position: 'absolute', left: 284, top: 88, width: 832, height: 696 }}>
        <div style={{ position: 'absolute', left: BOARD.x - 284, top: BOARD.y - 88 }}>{children}</div>
        {mode !== 'test' && (
          <span
            style={{
              position: 'absolute',
              top: 10,
              left: 14,
              fontSize: 15,
              color: C.sub,
              background: C.pill,
              padding: '4px 12px',
              borderRadius: 12
            }}
          >
            {mode === 'trace' ? '4かく' : '2かく'}
          </span>
        )}
        {mode === 'test' && (
          <div
            style={{
              ...card,
              position: 'absolute',
              top: 10,
              left: 14,
              padding: '4px 14px 8px',
              border: `3px solid ${C.guide}`,
              minWidth: 92,
              display: 'grid',
              justifyItems: 'center'
            }}
          >
            <b style={{ fontFamily: KYOKASHO, fontSize: 60, lineHeight: 1.1, color: C.sub }}>？</b>
            <small style={{ fontSize: 12, fontWeight: 700, color: C.warn }}>2 かく</small>
          </div>
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 1138,
          top: 88,
          width: 120,
          height: 696,
          display: 'grid',
          alignContent: 'center',
          justifyItems: 'center',
          gap: 26,
          fontSize: 13,
          fontWeight: 700,
          color: C.sub
        }}
      >
        <div style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
          <div style={{ ...card, width: 68, height: 68, display: 'grid', placeContent: 'center', color: t.blue }}>
            <Icon name={mode === 'test' ? 'eye' : 'speaker'} size={32} />
          </div>
          {mode === 'test' ? 'みる' : 'きく'}
        </div>
        <div style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
          <div style={{ ...card, width: 68, height: 68, display: 'grid', placeContent: 'center', color: t.blue }}>
            <Icon name="redo" size={32} />
          </div>
          もういちど
        </div>
      </div>
      {overlay}
    </AbsoluteFill>
  );
};
