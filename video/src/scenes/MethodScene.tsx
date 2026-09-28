import {AbsoluteFill} from 'remotion';
import {useTheme} from '../brand/theme';
import {FONT, WEIGHT} from '../brand/tokens';
import {COPY} from '../copy';
import {blurIn, blurOut, EASE_OUT, lerp, progress} from '../lib/anim';
import {useSceneFrame} from '../lib/scene';
import {EVENTS} from '../timeline';

const CX = 540;
const CY = 920;
const R = 460;

/*
 * O método tem nome — e só o nome (regra 1 da skill: nomeie, não ensine).
 * Círculo tracejado girando, como o "Vira rotina" da referência; cada letra
 * acende um ponto do círculo, no tempo da trilha.
 */
export const MethodScene: React.FC = () => {
  const frame = useSceneFrame('method');
  const t = useTheme();
  const {circle, kicker, letters, exit} = EVENTS.method;

  const ring = progress(frame, circle, 14, EASE_OUT);
  const out = blurOut(frame, exit, 8);
  const outRing = progress(frame, exit, 8);
  const spin = frame * 0.7;
  const kickerIn = blurIn(frame, kicker, 10, 20, 12);

  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <g
          transform={`translate(${CX} ${CY}) scale(${lerp(0.72, 1, ring) * lerp(1, 1.28, outRing)}) rotate(${spin})`}
          opacity={ring * (1 - outRing)}
        >
          <circle r={R} fill="none" stroke={t.ring} strokeWidth={3} strokeDasharray="18 22" />
          <circle r={R - 90} fill="none" stroke={t.ringInner} strokeWidth={2} />
          {letters.map((at, i) => {
            const lit = progress(frame, at, 6);
            const angle = (-90 + i * 90) * (Math.PI / 180);
            return (
              <g key={i} transform={`translate(${Math.cos(angle) * R} ${Math.sin(angle) * R})`}>
                <circle r={34} fill={t.nodeLit} opacity={0.18 * lit} />
                <circle r={16} fill={lit > 0 ? t.nodeLit : t.nodeOff} stroke={t.nodeStroke} strokeWidth={3} opacity={0.4 + 0.6 * lit} />
              </g>
            );
          })}
        </g>
      </svg>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: CY - 150,
          textAlign: 'center',
          opacity: out.opacity,
          transform: `scale(${out.scale})`,
          filter: out.blur > 0.05 ? `blur(${out.blur}px)` : undefined,
        }}
      >
        <div
          style={{
            fontSize: 44,
            color: t.body,
            opacity: kickerIn.opacity,
            transform: `translateY(${kickerIn.y}px)`,
            filter: kickerIn.blur > 0.05 ? `blur(${kickerIn.blur}px)` : undefined,
          }}
        >
          {COPY.method.kicker}
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 170,
            fontWeight: WEIGHT.heavy,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            color: t.headline,
          }}
        >
          {COPY.method.letters.map((letter, i) => {
            const p = progress(frame, letters[i], 8, EASE_OUT);
            return (
              <span
                key={letter}
                style={{
                  display: 'inline-block',
                  opacity: p,
                  transform: `scale(${lerp(1.45, 1, p)})`,
                  filter: p < 1 ? `blur(${(1 - p) * 16}px)` : undefined,
                }}
              >
                {letter}
                <span style={{color: t.letterDot}}>.</span>
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
