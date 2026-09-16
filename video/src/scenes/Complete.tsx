import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { STROKES } from '../../../src/lib/strokes';
import { C, KYOKASHO, THEME, UI } from '../theme';
import { Board, Burst, Confetti, Icon, Pop, card } from '../ui';
import { BOARD, Practice } from './Practice';

// さいごの ん を書き終えると、きりん が画面を走り抜けて「ぜんぶ できた！」
const strokes = STROKES['ん'];
const DRIVE = 46;
const MODAL = 96;

export const Complete = () => {
  const frame = useCurrentFrame();
  return (
    <Practice
      mode="trace"
      title="なぞって みよう！"
      hint="1 の まるから せんに そって ゆっくり"
      chars={['き', 'り', 'ん']}
      active={2}
      done={2}
      overlay={
        <>
          <Burst at={40} x={BOARD.x + BOARD.size * 0.62} y={BOARD.y + BOARD.size * 0.7} n={24} />
          <Img
            src={staticFile('img/giraffe.svg')}
            style={{
              position: 'absolute',
              bottom: 20,
              height: 200,
              left: interpolate(frame, [DRIVE, DRIVE + 60], [-300, 1400], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)
              }),
              rotate: `${Math.sin(frame * 0.6) * 4}deg`,
              opacity: frame >= DRIVE && frame < DRIVE + 60 ? 1 : 0
            }}
          />
          <Pop
            at={MODAL}
            from={40}
            style={{
              ...card,
              position: 'absolute',
              left: 380,
              top: 200,
              width: 520,
              height: 450,
              display: 'grid',
              justifyItems: 'center',
              alignContent: 'center',
              gap: 8,
              fontFamily: UI,
              boxShadow: '0 12px 40px rgba(0,0,0,.2)'
            }}
          >
            <Img src={staticFile('img/giraffe.svg')} style={{ height: 120 }} />
            <b style={{ fontFamily: KYOKASHO, fontSize: 26 }}>きりん</b>
            <span style={{ fontSize: 30, fontWeight: 700, color: THEME.ja.blue }}>ぜんぶ できた！</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.star, fontWeight: 700 }}>
              <Icon name="star" size={22} fill /> ほし ゲット
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 10,
                padding: '12px 24px',
                borderRadius: 16,
                background: C.warn,
                color: '#fff',
                fontSize: 18,
                fontWeight: 700
              }}
            >
              <Icon name="star" size={22} fill /> おてほんなしに ちょうせん
            </span>
            <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 17, fontWeight: 700 }}>
              <span style={{ padding: '12px 20px', borderRadius: 16, background: THEME.ja.blue, color: '#fff' }}>
                つぎの たんご
              </span>
              <span style={{ padding: '12px 20px', borderRadius: 16, background: C.pill }}>ホームへ</span>
              <span style={{ padding: '12px 20px', borderRadius: 16, background: C.pill }}>もういちど</span>
            </div>
          </Pop>
          <Confetti at={MODAL} n={40} />
        </>
      }
    >
      <Board
        strokes={strokes}
        mode="trace"
        size={BOARD.size}
        ink={interpolate(frame, [8, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
      />
    </Practice>
  );
};
