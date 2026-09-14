import { Composition, Folder } from 'remotion';
import { Intro, SCENES, TOTAL } from './Intro';

export const RemotionRoot = () => (
  <>
    <Composition id="Intro" component={Intro} durationInFrames={TOTAL} fps={30} width={1280} height={800} />
    <Folder name="Scenes">
      {SCENES.map(([id, S, d]) => (
        <Composition key={id} id={id} component={S} durationInFrames={d} fps={30} width={1280} height={800} />
      ))}
    </Folder>
  </>
);
