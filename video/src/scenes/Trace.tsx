import { interpolate, useCurrentFrame } from 'remotion';
import { pathToPoints } from '../../../src/lib/geometry';
import { STROKES } from '../../../src/lib/strokes';
import { Board, Burst } from '../ui';
import { BOARD, Practice } from './Practice';

const strokes = STROKES['き'];
// 見本（黄色）を 1 画目だけ見せてから、1 画ずつ 30 フレームでなぞる（画の間に 6 フレームの間）
const SEG = 30;
const START = 52;
const ends = strokes.map((d) => pathToPoints(d).at(-1)!);

export const Trace = () => {
  const frame = useCurrentFrame();
  const keys = strokes.flatMap((_, i) => [START + i * SEG, START + i * SEG + SEG - 6]);
  const vals = strokes.flatMap((_, i) => [i, i + 1]);
  return (
    <Practice
      mode="trace"
      title="なぞって みよう！"
      hint="1 の まるから みちに そって ゆっくり"
      chars={['き', 'り', 'ん']}
      active={0}
      done={0}
      overlay={ends.map((p, i) => (
        <Burst
          key={i}
          at={START + i * SEG + SEG - 6}
          x={BOARD.x + (p.x / 109) * BOARD.size}
          y={BOARD.y + (p.y / 109) * BOARD.size}
        />
      ))}
    >
      <Board
        strokes={strokes}
        mode="trace"
        size={BOARD.size}
        demo={
          frame < START
            ? interpolate(frame, [18, 46], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            : 0
        }
        ink={interpolate(frame, keys, vals, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
      />
    </Practice>
  );
};
