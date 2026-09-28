/*
 * Camada de fundo da imagem editorial: céu e cidade, de manhã ou à noite
 * conforme a paleta (palette.ts).
 * Renderizada uma vez como PNG (npm run editorial) e usada no vídeo como
 * imagem — textos e interface entram por cima, em camadas próprias.
 */
import {AbsoluteFill} from 'remotion';
import type {Mood} from '../brand/theme';
import {alpha, TOKENS} from '../brand/tokens';
import {CITY} from './palette';
import {buildingPath, skyline} from './skyline';

export const EDITORIAL_W = 2000;
export const EDITORIAL_H = 1200;

const SUN = {x: 1330, y: 690, r: 118};
const HORIZON = 860;

const far = skyline({
  seed: 11,
  x0: -40,
  x1: EDITORIAL_W + 40,
  baseY: HORIZON + 10,
  minH: 50,
  maxH: 230,
  minW: 40,
  maxW: 120,
  maxGap: 6,
  litProbability: 0,
  windowAlpha: [0, 0],
  window: {w: 6, h: 9, pitchX: 16, pitchY: 22},
});

const mid = skyline({
  seed: 23,
  x0: -60,
  x1: EDITORIAL_W + 60,
  baseY: HORIZON + 40,
  minH: 110,
  maxH: 400,
  minW: 70,
  maxW: 170,
  maxGap: 18,
  litProbability: 0.2,
  windowAlpha: [0.25, 0.75],
  window: {w: 7, h: 10, pitchX: 17, pitchY: 24},
  beacons: 2,
});

const near = skyline({
  seed: 37,
  x0: -80,
  x1: EDITORIAL_W + 80,
  baseY: HORIZON + 90,
  minH: 60,
  maxH: 250,
  minW: 120,
  maxW: 260,
  maxGap: 40,
  litProbability: 0.14,
  windowAlpha: [0.3, 0.8],
  window: {w: 9, h: 12, pitchX: 22, pitchY: 30},
});

export const EditorialCity: React.FC<{mood: Mood}> = ({mood}) => {
  const c = CITY[mood];
  return (
    <AbsoluteFill style={{background: c.background}}>
      <svg width={EDITORIAL_W} height={EDITORIAL_H} viewBox={`0 0 ${EDITORIAL_W} ${EDITORIAL_H}`}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            {c.sky.map(([offset, color]) => (
              <stop key={offset} offset={offset} stopColor={color} />
            ))}
          </linearGradient>
          <radialGradient id="sunGlow" cx={SUN.x} cy={SUN.y} r={620} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={c.sunGlow} stopOpacity={c.sunGlowOpacity} />
            <stop offset="0.25" stopColor={c.sunGlow} stopOpacity={c.sunGlowOpacity * 0.33} />
            <stop offset="1" stopColor={c.sunGlow} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="farFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.far[0]} />
            <stop offset="1" stopColor={c.far[1]} />
          </linearGradient>
          <linearGradient id="midFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.mid[0]} />
            <stop offset="1" stopColor={c.mid[1]} />
          </linearGradient>
          <linearGradient id="nearFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.near[0]} />
            <stop offset="1" stopColor={c.near[1]} />
          </linearGradient>
          <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.haze} stopOpacity={0} />
            <stop offset="0.6" stopColor={c.haze} stopOpacity={c.hazeOpacity} />
            <stop offset="1" stopColor={c.haze} stopOpacity={0} />
          </linearGradient>
          <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          <filter id="cloud" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="26" />
          </filter>
          <filter id="glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          {/* Grão de filme: evita banding no gradiente escuro e tira o ar de vetor. */}
          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues={`0 ${c.grain}`} />
            </feComponentTransfer>
          </filter>
        </defs>

        <rect width={EDITORIAL_W} height={EDITORIAL_H} fill="url(#sky)" />

        {/* Nuvens altas, finas, pegando a última luz. */}
        <g filter="url(#cloud)" opacity={0.9}>
          <ellipse cx={520} cy={420} rx={520} ry={34} fill={alpha(c.cloud, c.cloudAlpha[0])} />
          <ellipse cx={1500} cy={330} rx={620} ry={28} fill={alpha(c.cloud, c.cloudAlpha[1])} />
          <ellipse cx={1100} cy={560} rx={760} ry={40} fill={alpha(c.cloud, c.cloudAlpha[2])} />
          <ellipse cx={300} cy={640} rx={420} ry={30} fill={alpha(c.cloud, c.cloudAlpha[3])} />
        </g>

        {/* Sol baixo, no teal/branco da marca — o vermelho fica para o foco de cada cena. */}
        <rect width={EDITORIAL_W} height={EDITORIAL_H} fill="url(#sunGlow)" />
        <circle cx={SUN.x} cy={SUN.y} r={SUN.r} fill={c.sunCore} />

        <g filter="url(#soft)" opacity={c.farOpacity}>
          {far.map((b, i) => (
            <path key={i} d={buildingPath(b)} fill="url(#farFill)" />
          ))}
        </g>

        <rect x={0} y={HORIZON - 140} width={EDITORIAL_W} height={220} fill="url(#haze)" />

        <g>
          {mid.map((b, i) => (
            <g key={i}>
              <path d={buildingPath(b)} fill="url(#midFill)" />
              {b.windows.map((w, j) => (
                <rect key={j} x={w.x} y={w.y} width={w.w} height={w.h} fill={alpha(c.midWindow, w.a * c.midWindowScale)} />
              ))}
            </g>
          ))}
        </g>

        {/* Balizamento: pontos mínimos, a única tinta quente da imagem. */}
        {(c.beacons ? mid : [])
          .filter((b) => b.beacon)
          .map((b, i) => (
            <g key={i}>
              <circle cx={b.beacon!.x} cy={b.beacon!.y} r={16} fill={alpha(TOKENS.accentSoft, 0.35)} filter="url(#glow)" />
              <circle cx={b.beacon!.x} cy={b.beacon!.y} r={4.5} fill={TOKENS.accentSoft} />
            </g>
          ))}

        <g>
          {near.map((b, i) => (
            <g key={i}>
              <path d={buildingPath(b)} fill="url(#nearFill)" />
              {b.windows.map((w, j) => (
                <rect key={j} x={w.x} y={w.y} width={w.w} height={w.h} fill={alpha(c.nearWindow, w.a * c.nearWindowScale)} />
              ))}
            </g>
          ))}
        </g>

        <rect y={HORIZON + 90} width={EDITORIAL_W} height={EDITORIAL_H - HORIZON - 90} fill={c.ground} />

        <rect width={EDITORIAL_W} height={EDITORIAL_H} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
