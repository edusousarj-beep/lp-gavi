import {AbsoluteFill, Img, spring, staticFile} from 'remotion';
import {useTheme} from '../brand/theme';
import {FONT, RADIUS, WEIGHT} from '../brand/tokens';
import {COPY} from '../copy';
import {TargetIcon} from '../components/Icons';
import {blurIn, blurOut, lerp, progress, EASE_IN_OUT} from '../lib/anim';
import {useSceneFrame} from '../lib/scene';
import {EVENTS, FPS, SCENES} from '../timeline';

const CARD_W = 900;
const IMAGE_H = 540;

/*
 * O cenário: card de missão com a imagem editorial. A imagem é PNG (gerada
 * por código); o chip, o título e a descrição são camadas separadas por cima,
 * por isso ficam nítidos em qualquer escala.
 */
export const MissionScene: React.FC = () => {
  const frame = useSceneFrame('mission');
  const t = useTheme();
  const {enter, chip, titleStart, titleCharsPerFrame, description, exit} = EVENTS.mission;

  const pop = spring({frame: frame - enter, fps: FPS, config: {damping: 16, stiffness: 140, mass: 0.9}});
  const blur = (1 - progress(frame, enter, 10)) * 18;
  const out = blurOut(frame, exit, 8);

  const typed = Math.max(0, Math.floor((frame - titleStart) * titleCharsPerFrame));
  const title = COPY.mission.title.slice(0, typed);
  const typing = typed > 0 && typed < COPY.mission.title.length;

  const chipIn = blurIn(frame, chip, 8, 14, 10);
  const descIn = blurIn(frame, description, 10, 18, 12);

  // Paralaxe: a sala (perto) anda mais que a cidade (longe) — perspectiva real.
  const scene = SCENES.mission;
  const drift = progress(frame, scene.from, scene.to - scene.from + 8, EASE_IN_OUT);
  const cityScale = lerp(1.1, 1.06, drift);
  const cityX = lerp(10, -10, drift);
  const roomScale = lerp(1.02, 1.1, drift);
  const roomX = lerp(26, -26, drift);

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', perspective: 1800}}>
      <div
        style={{
          width: CARD_W,
          marginTop: -30,
          borderRadius: RADIUS,
          overflow: 'hidden',
          background: t.card,
          border: `2px solid ${t.cardBorder}`,
          boxShadow: `${t.cardShadow}, 0 0 90px ${t.cardGlow}`,
          transform: `translateY(${lerp(90, 0, pop)}px) rotateX(${lerp(16, 0, pop)}deg) scale(${lerp(0.86, 1, pop) * out.scale})`,
          opacity: Math.min(progress(frame, enter, 6), out.opacity),
          filter: blur + out.blur > 0.05 ? `blur(${blur + out.blur}px)` : undefined,
        }}
      >
        <div style={{position: 'relative', height: IMAGE_H, overflow: 'hidden'}}>
          <Img
            src={staticFile(`editorial/cidade-${t.mood}.png`)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `translateX(${cityX}px) scale(${cityScale})`,
            }}
          />
          <Img
            src={staticFile(`editorial/sala-${t.mood}.png`)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `translateX(${roomX}px) scale(${roomScale})`,
              transformOrigin: '50% 70%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 36,
              top: 36,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 26px',
              borderRadius: 999,
              background: t.imageChipBg,
              border: `2px solid ${t.imageChipBorder}`,
              fontFamily: FONT,
              fontWeight: WEIGHT.heavy,
              fontSize: 30,
              letterSpacing: '0.02em',
              color: t.imageChipText,
              opacity: chipIn.opacity,
              transform: `translateY(${chipIn.y}px)`,
              filter: chipIn.blur > 0.05 ? `blur(${chipIn.blur}px)` : undefined,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: t.imageChipText,
                opacity: 0.55 + 0.45 * Math.abs(Math.sin(frame / 5)),
              }}
            />
            {COPY.mission.chip}
          </div>
        </div>

        <div style={{padding: '46px 52px 54px', display: 'flex', gap: 30, alignItems: 'flex-start'}}>
          <div
            style={{
              width: 92,
              height: 92,
              flex: 'none',
              borderRadius: 26,
              border: `2px solid ${t.iconBoxBorder}`,
              background: t.iconBoxBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TargetIcon size={54} color={t.iconColor} />
          </div>
          <div style={{fontFamily: FONT}}>
            <div style={{fontSize: 56, lineHeight: 1.12, letterSpacing: '-0.02em', minHeight: 63}}>
              <span style={{fontWeight: WEIGHT.regular, color: t.body}}>{COPY.mission.label} </span>
              <span style={{fontWeight: WEIGHT.heavy, color: t.headline}}>{title}</span>
              <Caret color={t.body} visible={typing || (typed === 0 && frame >= titleStart - 4)} />
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 40,
                lineHeight: 1.35,
                fontWeight: WEIGHT.regular,
                color: t.body,
                opacity: descIn.opacity,
                transform: `translateY(${descIn.y}px)`,
                filter: descIn.blur > 0.05 ? `blur(${descIn.blur}px)` : undefined,
              }}
            >
              {COPY.mission.description}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Caret: React.FC<{visible: boolean; color: string}> = ({visible, color}) =>
  visible ? (
    <span
      style={{
        display: 'inline-block',
        width: 4,
        height: '0.9em',
        marginLeft: 4,
        verticalAlign: '-0.1em',
        background: color,
      }}
    />
  ) : null;
