import {AbsoluteFill, spring} from 'remotion';
import {alpha, FONT, TOKENS, WEIGHT} from '../brand/tokens';
import {COPY} from '../copy';
import {ClickRipple, Cursor} from '../components/Cursor';
import {WhatsAppIcon} from '../components/Icons';
import {blurIn, lerp, progress} from '../lib/anim';
import {useSceneFrame} from '../lib/scene';
import {EVENTS, FPS} from '../timeline';

const BUTTON_TOP = 930;
const BUTTON_H = 150;
// Clique na folga à direita do texto: o cursor não cobre o CTA.
const CLICK_AT = {x: 866, y: BUTTON_TOP + BUTTON_H / 2 + 8};

/*
 * VENDER. Um CTA só, com o mesmo texto e destino do botão da LP. O vermelho
 * deste quadro é exclusivo do botão.
 */
export const EndCardScene: React.FC = () => {
  const frame = useSceneFrame('endCard');
  const {kicker, wordmark, button, micro, cursorIn, cursorArrive, click} = EVENTS.endCard;

  const kickerIn = blurIn(frame, kicker, 10, 18, 12);
  const microIn = blurIn(frame, micro, 10, 14, 10);
  const pop = spring({frame: frame - button, fps: FPS, config: {damping: 13, stiffness: 160, mass: 0.8}});
  const pressed = frame >= click && frame < click + 4;
  const shine = progress(frame, click + 2, 16);

  const fade = (a: {opacity: number; y: number; blur: number}) => ({
    opacity: a.opacity,
    transform: `translateY(${a.y}px)`,
    filter: a.blur > 0.05 ? `blur(${a.blur}px)` : undefined,
  });

  let charIndex = 0;

  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div style={{position: 'absolute', left: 60, right: 60, top: 694, textAlign: 'center', fontSize: 36, color: TOKENS.text2, ...fade(kickerIn)}}>
        {COPY.endCard.kicker}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 772,
          textAlign: 'center',
          fontSize: 104,
          fontWeight: WEIGHT.heavy,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          color: TOKENS.text,
          whiteSpace: 'pre',
        }}
      >
        {[...COPY.brand].map((ch) => {
          const a = blurIn(frame, wordmark + charIndex++, 9, 24, 16);
          return (
            <span key={charIndex} style={{display: 'inline-block', ...fade(a)}}>
              {ch}
            </span>
          );
        })}
      </div>

      <div style={{position: 'absolute', left: 0, right: 0, top: BUTTON_TOP, display: 'flex', justifyContent: 'center'}}>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            height: BUTTON_H,
            padding: '0 80px',
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            background: pressed ? TOKENS.accentDim : TOKENS.accent,
            color: TOKENS.text,
            fontSize: 50,
            fontWeight: WEIGHT.heavy,
            letterSpacing: '-0.01em',
            // Mesmo glow da LP (0 0 40px -8px), na escala do quadro.
            boxShadow: `0 0 100px -20px ${TOKENS.accent}`,
            transform: `scale(${lerp(0.6, 1, pop) * (pressed ? 0.96 : 1)})`,
            opacity: progress(frame, button, 4),
          }}
        >
          <WhatsAppIcon size={58} color={TOKENS.text} />
          {COPY.endCard.cta}
          {frame >= click + 2 ? (
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 160,
                left: `${lerp(-20, 110, shine)}%`,
                background: `linear-gradient(90deg, ${alpha(TOKENS.text, 0)}, ${alpha(TOKENS.text, 0.28)}, ${alpha(TOKENS.text, 0)})`,
                transform: 'skewX(-18deg)',
              }}
            />
          ) : null}
        </div>
      </div>

      <div style={{position: 'absolute', left: 60, right: 60, top: BUTTON_TOP + BUTTON_H + 44, textAlign: 'center', fontSize: 31, color: TOKENS.text3, ...fade(microIn)}}>
        {COPY.endCard.micro}
      </div>

      <ClickRipple frame={frame} click={click} x={CLICK_AT.x} y={CLICK_AT.y} color={alpha(TOKENS.text, 0.55)} />
      <Cursor frame={frame} from={{x: 1150, y: 1640}} to={CLICK_AT} start={cursorIn} arrive={cursorArrive} click={click} />
    </AbsoluteFill>
  );
};
