/*
 * Camada da frente da imagem editorial: a sala de reunião vista da cabeceira.
 * Fundo transparente — o vidro deixa ver a camada da cidade. Separar as duas
 * camadas é o que permite a paralaxe no vídeo (a sala anda mais que a cidade).
 */
import {AbsoluteFill} from 'remotion';
import {alpha, DERIVED, mix, TOKENS} from '../brand/tokens';
import {EDITORIAL_H, EDITORIAL_W} from './EditorialCity';

const TABLE_TOP = 905;
const FRAME = DERIVED.night;
const RIM = alpha(TOKENS.text2, 0.22);

/* Tela do notebook: quadrilátero em perspectiva. */
const SCREEN = {tl: [1236, 918], tr: [1596, 902], bl: [1248, 1104], w: 360, h: 190};
const screenMatrix = (() => {
  const {tl, tr, bl, w, h} = SCREEN;
  const a = (tr[0] - tl[0]) / w;
  const b = (tr[1] - tl[1]) / w;
  const c = (bl[0] - tl[0]) / h;
  const d = (bl[1] - tl[1]) / h;
  return `matrix(${a} ${b} ${c} ${d} ${tl[0]} ${tl[1]})`;
})();

const Chair: React.FC<{x: number; w: number; h: number}> = ({x, w, h}) => {
  const top = TABLE_TOP - h + 30;
  return (
    <g>
      <rect x={x - w / 2} y={top} width={w} height={h} rx={w * 0.28} fill={FRAME} />
      <path
        d={`M${x - w / 2 + 14},${top + 22} Q${x},${top - 4} ${x + w / 2 - 14},${top + 22}`}
        stroke={RIM}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
};

export const EditorialRoom: React.FC = () => {
  return (
    <AbsoluteFill>
      <svg width={EDITORIAL_W} height={EDITORIAL_H} viewBox={`0 0 ${EDITORIAL_W} ${EDITORIAL_H}`}>
        <defs>
          <linearGradient id="glare" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={TOKENS.text} stopOpacity={0} />
            <stop offset="0.5" stopColor={TOKENS.text} stopOpacity={0.07} />
            <stop offset="1" stopColor={TOKENS.text} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="table" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mix(DERIVED.night, TOKENS.bg, 0.55)} />
            <stop offset="0.35" stopColor={DERIVED.night} />
            <stop offset="1" stopColor={mix(DERIVED.night, DERIVED.shadow, 0.5)} />
          </linearGradient>
          <radialGradient id="tableShine" cx={1180} cy={960} r={560} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={TOKENS.text2} stopOpacity={0.2} />
            <stop offset="1" stopColor={TOKENS.text2} stopOpacity={0} />
          </radialGradient>
          {/* A janela refletida na mesa, mais forte junto à borda de lá. */}
          <linearGradient id="windowOnTable" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={TOKENS.text2} stopOpacity={0.18} />
            <stop offset="1" stopColor={TOKENS.text2} stopOpacity={0} />
          </linearGradient>
          <radialGradient id="vignette" cx="50%" cy="48%" r="75%">
            <stop offset="0.55" stopColor={DERIVED.night} stopOpacity={0} />
            <stop offset="1" stopColor={DERIVED.night} stopOpacity={0.7} />
          </radialGradient>
          <filter id="screenGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="28" />
          </filter>
        </defs>

        {/* Reflexos diagonais no vidro. */}
        <polygon points="260,0 520,0 150,860 -110,860" fill="url(#glare)" />
        <polygon points="1500,0 1640,0 1330,860 1190,860" fill="url(#glare)" opacity={0.7} />

        {/* Caixilho: moldura, travessa e montantes. */}
        <rect x={0} y={0} width={EDITORIAL_W} height={44} fill={FRAME} />
        <rect x={0} y={150} width={EDITORIAL_W} height={26} fill={FRAME} />
        <rect x={0} y={0} width={46} height={EDITORIAL_H} fill={FRAME} />
        <rect x={EDITORIAL_W - 46} y={0} width={46} height={EDITORIAL_H} fill={FRAME} />
        <rect x={650} y={0} width={34} height={TABLE_TOP} fill={FRAME} />
        <rect x={1316} y={0} width={34} height={TABLE_TOP} fill={FRAME} />
        <rect x={684} y={176} width={2} height={TABLE_TOP - 176} fill={RIM} />
        <rect x={1350} y={176} width={2} height={TABLE_TOP - 176} fill={RIM} />
        <rect x={0} y={872} width={EDITORIAL_W} height={40} fill={FRAME} />
        {/* Parede sob o peitoril: a cidade só aparece através do vidro. */}
        <rect x={0} y={900} width={EDITORIAL_W} height={EDITORIAL_H - 900} fill={mix(DERIVED.night, TOKENS.bg, 0.25)} />

        {/* Cadeiras do outro lado da mesa, contra a luz. */}
        <Chair x={560} w={150} h={230} />
        <Chair x={820} w={160} h={250} />
        <Chair x={1100} w={160} h={250} />
        <Chair x={1440} w={150} h={230} />

        {/* Mesa em perspectiva, com o reflexo do céu. */}
        <polygon points={`420,${TABLE_TOP} 1580,${TABLE_TOP} 2300,${EDITORIAL_H} -300,${EDITORIAL_H}`} fill="url(#table)" />
        <polygon points={`420,${TABLE_TOP} 1580,${TABLE_TOP} 2300,${EDITORIAL_H} -300,${EDITORIAL_H}`} fill="url(#tableShine)" />
        <polygon points={`420,${TABLE_TOP} 1580,${TABLE_TOP} 1700,1010 300,1010`} fill="url(#windowOnTable)" />
        <line x1={420} y1={TABLE_TOP} x2={1580} y2={TABLE_TOP} stroke={alpha(TOKENS.text2, 0.4)} strokeWidth={3} />

        {/* Xícara. */}
        <g>
          <ellipse cx={600} cy={1080} rx={62} ry={14} fill={alpha(DERIVED.shadow, 0.5)} />
          <path d="M548,985 L556,1072 Q600,1090 644,1072 L652,985 Z" fill={FRAME} />
          <ellipse cx={600} cy={985} rx={52} ry={12} fill={mix(DERIVED.night, TOKENS.bg, 0.6)} />
          <path d="M652,1004 Q690,1010 682,1040 Q676,1060 648,1056" stroke={FRAME} strokeWidth={12} fill="none" />
          <path d="M556,990 L562,1060" stroke={RIM} strokeWidth={3} />
        </g>

        {/* Notebook aberto na call: a tela é a única fonte de luz da mesa. */}
        <polygon
          points={`${SCREEN.tl.join(',')} ${SCREEN.tr.join(',')} 1606,1090 ${SCREEN.bl.join(',')}`}
          fill={alpha(TOKENS.surface, 0.8)}
          filter="url(#screenGlow)"
        />
        <g transform={screenMatrix}>
          <rect x={-8} y={-8} width={SCREEN.w + 16} height={SCREEN.h + 16} rx={10} fill={FRAME} />
          <rect x={0} y={0} width={SCREEN.w} height={SCREEN.h} rx={4} fill={mix(TOKENS.bg, TOKENS.surface, 0.35)} />
          {[0, 1].map((row) =>
            [0, 1].map((col) => {
              const x = 10 + col * 175;
              const y = 10 + row * 88;
              const speaking = row === 0 && col === 1;
              return (
                <g key={`${row}-${col}`}>
                  <rect
                    x={x}
                    y={y}
                    width={165}
                    height={80}
                    rx={6}
                    fill={mix(TOKENS.bg, TOKENS.surface, 0.62)}
                    stroke={speaking ? TOKENS.text2 : 'none'}
                    strokeWidth={3}
                  />
                  <circle cx={x + 82} cy={y + 34} r={15} fill={alpha(TOKENS.text2, 0.55)} />
                  <path d={`M${x + 58},${y + 72} Q${x + 82},${y + 44} ${x + 106},${y + 72} Z`} fill={alpha(TOKENS.text2, 0.55)} />
                </g>
              );
            }),
          )}
        </g>
        <polygon points={`${SCREEN.bl.join(',')} 1606,1090 1720,1172 1150,1196`} fill={mix(DERIVED.night, TOKENS.bg, 0.4)} />
        <line x1={SCREEN.bl[0]} y1={SCREEN.bl[1]} x2={1606} y2={1090} stroke={RIM} strokeWidth={3} />

        <rect width={EDITORIAL_W} height={EDITORIAL_H} fill="url(#vignette)" />
      </svg>
    </AbsoluteFill>
  );
};
