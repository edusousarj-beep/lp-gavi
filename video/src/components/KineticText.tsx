import {useTheme, type Theme} from '../brand/theme';
import {FONT, WEIGHT} from '../brand/tokens';
import type {Tone, Word} from '../copy';
import {blurIn, seeded} from '../lib/anim';

const toneColor = (t: Theme, tone: Tone): string =>
  tone === 'accent' ? t.accent : tone === 'strong' ? t.headline : t.body;

export type Glitch = {from: number; to: number};

/**
 * Texto que entra palavra a palavra, com o layout final fixo desde o
 * primeiro quadro (as palavras aparecem no lugar, como na referência).
 */
export const KineticText: React.FC<{
  frame: number;
  lines: readonly (readonly Word[])[];
  frames: readonly (readonly number[])[];
  fontSize: number;
  glitch?: Glitch;
  lineHeight?: number;
  /** Índices de linha que abrem uma frase nova: ganham respiro acima. */
  breakBefore?: readonly number[];
}> = ({frame, lines, frames, fontSize, glitch, lineHeight = 1.06, breakBefore = []}) => {
  const t = useTheme();
  return (
    <div
      style={{
        fontFamily: FONT,
        fontWeight: WEIGHT.heavy,
        fontSize,
        lineHeight,
        letterSpacing: '-0.03em',
        textAlign: 'center',
      }}
    >
      {lines.map((line, l) => (
        <div
          key={l}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.24em',
            whiteSpace: 'nowrap',
            marginTop: breakBefore.includes(l) ? '0.32em' : 0,
          }}
        >
          {line.map((word, w) => {
            const appear = frames[l][w];
            const a = blurIn(frame, appear, 10, 34, 18);
            const glitching = glitch && word.tone === 'accent' && frame >= glitch.from && frame < glitch.to;
            return (
              <span
                key={w}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  color: toneColor(t, word.tone),
                  opacity: a.opacity,
                  transform: `translateY(${a.y}px) scale(${a.scale})`,
                  filter: a.blur > 0.05 ? `blur(${a.blur}px)` : undefined,
                  textShadow: word.tone === 'accent' && t.accentTextGlow !== 'none' ? t.accentTextGlow : undefined,
                }}
              >
                {glitching ? <GlitchWord text={word.text} frame={frame} /> : word.text}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/*
 * "Travar" trava: fatias horizontais deslocadas e fantasmas no teal e no
 * vermelho — o quadro de uma call que congelou. Muda a cada 2 quadros.
 */
const GlitchWord: React.FC<{text: string; frame: number}> = ({text, frame}) => {
  const t = useTheme();
  const rand = seeded(9000 + Math.floor(frame / 2));
  const slices = [
    [0, 64],
    [36, 38],
    [62, 18],
    [82, 0],
  ];
  const skew = (rand() - 0.5) * 10;
  return (
    <span style={{position: 'relative', display: 'inline-block', transform: `skewX(${skew}deg)`}}>
      <span style={{visibility: 'hidden'}}>{text}</span>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          color: t.glitchGhost,
          opacity: 0.55,
          transform: `translateX(${-10 - rand() * 12}px)`,
          mixBlendMode: t.glitchBlend,
        }}
      >
        {text}
      </span>
      {slices.map(([top, bottom], i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: `inset(${top}% 0 ${bottom}% 0)`,
            transform: `translateX(${(rand() - 0.5) * 56}px)`,
          }}
        >
          {text}
        </span>
      ))}
    </span>
  );
};
