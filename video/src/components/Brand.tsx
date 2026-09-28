import {useCurrentFrame} from 'remotion';
import {alpha, FONT, mix, TOKENS, WEIGHT} from '../brand/tokens';
import {COPY} from '../copy';
import {blurIn, EASE_IN_OUT, lerp, progress} from '../lib/anim';
import {DURATION, EVENTS, FPS, WIDTH} from '../timeline';

/*
 * Logo de abertura que vira cabeçalho. Um único elemento: nasce no centro,
 * letra a letra, e voa para o canto superior esquerdo, onde fica até o fim —
 * como o "logcomex" do topo da referência, mas sem cortar a continuidade.
 */
const INTRO_SIZE = 104;
const HEADER_SIZE = 34;
const HEADER_X = 60;
const HEADER_Y = 128;
const INTRO_Y = 900;

export const Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const {charsStart, charStagger, underline, toHeader, toHeaderEnd} = EVENTS.logo;

  const fly = progress(frame, toHeader, toHeaderEnd - toHeader, EASE_IN_OUT);
  const scale = lerp(1, HEADER_SIZE / INTRO_SIZE, fly);
  const left = lerp(WIDTH / 2, HEADER_X, fly);
  const top = lerp(INTRO_Y, HEADER_Y, fly);
  const shift = lerp(-50, 0, fly);
  // Do branco da headline ao --text-3 do cabeçalho durante o voo.
  const color = mix(TOKENS.text, TOKENS.text3, fly);

  const underlineIn = progress(frame, underline, 10);
  const underlineOut = progress(frame, toHeader, 8);

  const words = COPY.brand.split(' ');
  const last = words.length - 1;
  let charIndex = 0;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left,
          top,
          transform: `translate(${shift}%, -50%) scale(${scale})`,
          transformOrigin: 'left center',
          fontFamily: FONT,
          fontWeight: WEIGHT.heavy,
          fontSize: INTRO_SIZE,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          whiteSpace: 'pre',
          color,
          opacity: lerp(1, 0.95, fly),
        }}
      >
        {words.map((word, w) => {
          const chars = [...word].map((ch) => {
            const i = charIndex++;
            const a = blurIn(frame, charsStart + i * charStagger, 9, 26, 18);
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity: a.opacity,
                  transform: `translateY(${a.y}px)`,
                  filter: a.blur > 0.05 ? `blur(${a.blur}px)` : undefined,
                }}
              >
                {ch}
              </span>
            );
          });
          charIndex++; // o espaço também conta no stagger
          return (
            <span key={w} style={{position: 'relative', display: 'inline-block'}}>
              {chars}
              {w === last ? (
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -18,
                    height: 12,
                    borderRadius: 6,
                    background: TOKENS.accent,
                    transform: `scaleX(${underlineIn})`,
                    transformOrigin: 'left center',
                    opacity: 1 - underlineOut,
                    boxShadow: `0 0 28px ${alpha(TOKENS.accent, 0.55)}`,
                  }}
                />
              ) : null}
              {w < last ? ' ' : null}
            </span>
          );
        })}
      </div>
      <Countdown />
    </>
  );
};

/* Contagem regressiva do canto, como a da referência: 0:24 → 0:01. */
const Countdown: React.FC = () => {
  const frame = useCurrentFrame();
  const {toHeader, toHeaderEnd} = EVENTS.logo;
  const seconds = Math.ceil((DURATION - frame) / FPS);
  const show = progress(frame, toHeader + 6, toHeaderEnd - toHeader);
  return (
    <div
      style={{
        position: 'absolute',
        right: HEADER_X,
        top: HEADER_Y,
        transform: `translateY(-50%)`,
        fontFamily: FONT,
        fontWeight: WEIGHT.regular,
        fontSize: HEADER_SIZE,
        color: TOKENS.text3,
        fontVariantNumeric: 'tabular-nums',
        opacity: show,
      }}
    >
      0:{String(seconds).padStart(2, '0')}
    </div>
  );
};
