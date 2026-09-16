import { interpolate, useCurrentFrame } from 'remotion';
import { STROKES } from '../../../src/lib/strokes';
import { C, KYOKASHO, THEME, UI } from '../theme';
import { Board, Burst, Pop, card } from '../ui';
import { BOARD, Practice } from './Practice';

const strokes = STROKES['り'];
// 前半は じぶんで かく（薄いお手本の上を塗る）、後半は おてほんなし（マス目だけ）
const SWITCH = 78;

export const Write = () => {
  const frame = useCurrentFrame();
  const test = frame >= SWITCH;
  const cx = BOARD.x + BOARD.size / 2;
  const cy = BOARD.y + BOARD.size / 2;
  return (
    <Practice
      mode={test ? 'test' : 'free'}
      title={test ? 'おてほんなしで かいてみよう！' : 'じぶんで かいてみよう！'}
      hint={test ? 'おもいだして かいてみよう' : 'おてほんを ぬろう'}
      chars={['き', 'り', 'ん']}
      active={1}
      done={1}
      overlay={
        <>
          <Burst at={40} x={cx} y={cy} n={18} />
          <Burst at={64} x={cx} y={cy} n={18} />
          <Burst at={132} x={cx} y={cy} n={24} />
          <Pop
            at={66}
            style={{
              ...card,
              position: 'absolute',
              left: cx - 190,
              top: cy - 70,
              width: 380,
              padding: '18px 0',
              display: 'grid',
              justifyItems: 'center',
              gap: 4,
              fontFamily: UI,
              opacity: frame < 66 || frame >= SWITCH ? 0 : 1,
              boxShadow: '0 12px 40px rgba(0,0,0,.2)'
            }}
          >
            <span style={{ fontSize: 56, color: C.star, letterSpacing: 4 }}>★★★</span>
            <b style={{ fontSize: 30, color: THEME.ja.blue }}>ほし 3つ！</b>
          </Pop>
          <Pop
            at={134}
            style={{
              ...card,
              position: 'absolute',
              left: cx - 190,
              top: cy - 70,
              width: 380,
              padding: '18px 0',
              display: 'grid',
              justifyItems: 'center',
              gap: 4,
              fontFamily: UI,
              background: '#fffae6',
              boxShadow: '0 12px 40px rgba(0,0,0,.2)'
            }}
          >
            <span style={{ fontFamily: KYOKASHO, fontSize: 56, color: C.ink, lineHeight: 1 }}>り</span>
            <b style={{ fontSize: 30, color: C.warn }}>★ きんの ほし！</b>
          </Pop>
        </>
      }
    >
      <Board
        strokes={strokes}
        mode={test ? 'test' : 'free'}
        size={BOARD.size}
        ink={
          test
            ? interpolate(frame, [92, 110, 116, 132], [0, 1, 1, 2], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp'
              })
            : interpolate(frame, [18, 40, 46, 64], [0, 1, 1, 2], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp'
              })
        }
      />
    </Practice>
  );
};
