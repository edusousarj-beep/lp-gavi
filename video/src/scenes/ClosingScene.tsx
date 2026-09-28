import {AbsoluteFill} from 'remotion';
import {COPY} from '../copy';
import {KineticText} from '../components/KineticText';
import {blurOut} from '../lib/anim';
import {useSceneFrame} from '../lib/scene';
import {EVENTS} from '../timeline';

/* A frase que fecha o arco do gancho: travar → falar. */
export const ClosingScene: React.FC = () => {
  const frame = useSceneFrame('closing');
  const {lineFrames, exit} = EVENTS.closing;
  const out = blurOut(frame, exit, 8);

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          marginTop: -40,
          opacity: out.opacity,
          transform: `scale(${out.scale})`,
          filter: out.blur > 0.05 ? `blur(${out.blur}px)` : undefined,
        }}
      >
        <KineticText frame={frame} lines={COPY.closing.lines} frames={lineFrames} fontSize={98} breakBefore={[2]} />
      </div>
    </AbsoluteFill>
  );
};
