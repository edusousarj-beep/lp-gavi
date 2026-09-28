import {AbsoluteFill} from 'remotion';
import {alpha, TOKENS} from '../brand/tokens';
import {COPY} from '../copy';
import {KineticText} from '../components/KineticText';
import {blurOut, seeded} from '../lib/anim';
import {useSceneFrame} from '../lib/scene';
import {EVENTS, WIDTH} from '../timeline';

/*
 * ATRAIR. "O problema não é falta de inglês. É travar na reunião."
 * Em "travar" a imagem picota e congela (FREEZE, aplicado no Main) e a trilha
 * para junto; "na reunião." volta no tranco.
 */
export const HookScene: React.FC = () => {
  const frame = useSceneFrame('hook');
  const {wordFrames, travar, stutterEnd, slam, exit} = EVENTS.hook;

  const glitching = frame >= travar && frame < stutterEnd;
  const rand = seeded(500 + Math.floor(frame / 2));
  const shakeX = glitching ? (rand() - 0.5) * 16 : 0;
  const shakeY = glitching ? (rand() - 0.5) * 8 : 0;

  // O tranco da volta: um soco curto de escala no quadro do slam.
  const punch = frame >= slam ? 1 + 0.04 * Math.exp(-(frame - slam) / 3) : 1;
  const out = blurOut(frame, exit, 8);

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          transform: `translate(${shakeX}px, ${shakeY - 30}px) scale(${out.scale * punch})`,
          opacity: out.opacity,
          filter: out.blur > 0.05 ? `blur(${out.blur}px)` : undefined,
        }}
      >
        <KineticText
          frame={frame}
          lines={COPY.hook.lines}
          frames={wordFrames}
          fontSize={104}
          glitch={{from: travar, to: stutterEnd}}
          breakBefore={[2]}
        />
      </div>
      {glitching ? <TearLines frame={frame} /> : null}
    </AbsoluteFill>
  );
};

/* Linhas de "rasgo" horizontais, como sinal de vídeo que falhou. */
const TearLines: React.FC<{frame: number}> = ({frame}) => {
  const rand = seeded(700 + Math.floor(frame / 2));
  const bands = Array.from({length: 4}, () => ({
    y: 640 + rand() * 640,
    h: 2 + rand() * 10,
    x: (rand() - 0.5) * 60,
    a: 0.08 + rand() * 0.14,
  }));
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {bands.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: b.x,
            top: b.y,
            width: WIDTH,
            height: b.h,
            background: alpha(TOKENS.text2, b.a),
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
