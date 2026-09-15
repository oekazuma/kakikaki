import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { Audio, interpolate } from 'remotion';
import bgm from './bgm.wav';
import { Complete } from './scenes/Complete';
import { Home } from './scenes/Home';
import { Langs } from './scenes/Langs';
import { Outro } from './scenes/Outro';
import { Profiles } from './scenes/Profiles';
import { Quiz } from './scenes/Quiz';
import { Title } from './scenes/Title';
import { Trace } from './scenes/Trace';
import { Trophies } from './scenes/Trophies';
import { Write } from './scenes/Write';

export const SCENES = [
  ['Title', Title, 110],
  ['Home', Home, 170],
  ['Trace', Trace, 176],
  ['Write', Write, 160],
  ['Complete', Complete, 150],
  ['Langs', Langs, 156],
  ['Quiz', Quiz, 150],
  ['Trophies', Trophies, 150],
  ['Profiles', Profiles, 110],
  ['Outro', Outro, 120]
] as const;
export const FADE = 12;
export const TOTAL = SCENES.reduce((a, [, , d]) => a + d, 0) - FADE * (SCENES.length - 1);

export const Intro = () => (
  <>
    <Audio
      src={bgm}
      volume={(f) =>
        0.28 *
        interpolate(f, [0, 30, TOTAL - 70, TOTAL - 1], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp'
        })
      }
    />
    <TransitionSeries>
      {SCENES.flatMap(([id, S, d], i) => [
        ...(i
          ? [
              <TransitionSeries.Transition
                key={`t${id}`}
                presentation={fade()}
                timing={linearTiming({ durationInFrames: FADE })}
              />
            ]
          : []),
        <TransitionSeries.Sequence key={id} durationInFrames={d} name={id}>
          <S />
        </TransitionSeries.Sequence>
      ])}
    </TransitionSeries>
  </>
);
