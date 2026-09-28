import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useTheme} from '../brand/theme';
import {TOKENS} from '../brand/tokens';
import {DURATION, HEIGHT, WIDTH} from '../timeline';

/*
 * Fundo contínuo da peça: petróleo, luz ambiente no teal (nunca no acento —
 * mesma decisão do .hero__glow da LP), grade de pontos, vinheta e grão.
 */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const t = frame / DURATION;

  // A luz deriva devagar: o fundo nunca fica parado, mas não chama atenção.
  const glowX = 420 - t * 220;
  const glowY = -560 + Math.sin(t * Math.PI) * 90;

  return (
    <AbsoluteFill style={{background: theme.bg, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${theme.band} 0%, transparent 26%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: glowX,
          top: glowY,
          width: 1500,
          height: 1500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.glowA} 0%, ${theme.glowB} 34%, transparent 68%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -700 + t * 160,
          top: 1180,
          width: 1400,
          height: 1400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.glow2} 0%, transparent 65%)`,
        }}
      />

      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="dots" width={60} height={60} patternUnits="userSpaceOnUse">
            <circle cx={30} cy={30} r={2.4} fill={theme.dot} />
          </pattern>
          <radialGradient id="dotsFade" cx="50%" cy="46%" r="62%">
            <stop offset="0" stopColor={TOKENS.text} stopOpacity={1} />
            <stop offset="0.7" stopColor={TOKENS.text} stopOpacity={0.55} />
            <stop offset="1" stopColor={TOKENS.text} stopOpacity={0} />
          </radialGradient>
          <mask id="dotsMask">
            <rect width={WIDTH} height={HEIGHT} fill="url(#dotsFade)" />
          </mask>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill="url(#dots)" mask="url(#dotsMask)" />
      </svg>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 46%, transparent 55%, ${theme.vignette} 100%)`,
        }}
      />
      <Grain opacity={theme.grainOpacity} />
    </AbsoluteFill>
  );
};

/* Grão de filme que muda a cada 2 quadros. Evita banding no degradê escuro. */
const Grain: React.FC<{opacity: number}> = ({opacity}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2);
  return (
    <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity}}>
      <filter id={`grain-${seed}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 0.16" />
        </feComponentTransfer>
      </filter>
      <rect width={WIDTH} height={HEIGHT} filter={`url(#grain-${seed})`} />
    </svg>
  );
};
