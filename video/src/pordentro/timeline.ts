/*
 * Linha do tempo da peça "Por dentro". Grade própria, na duração da
 * referência (~15 s): 120 BPM a 30 fps = 15 quadros por tempo, 60 por
 * compasso; cada bloco dura 2 compassos (4 s), como os blocos da referência.
 * Puro TS — a trilha (scripts/compose-variations.ts) lê daqui também.
 *
 *   compasso 1  (0–60)     A entra; música só com pad, como a referência
 *   compasso 2  (60)       drop
 *   compasso 3  (120)      rolagem para B
 *   compasso 5  (240)      B desliza para o lado, entra C
 *   compasso 7  (360)      rolagem para o cartão final D
 *   compasso 8  (420)      acorde final
 */
export const PD_DURATION = 480;
export const PD_BPM = 120;
export const PD_BEAT = 15;
export const PD_BAR = 60;
export const PD_GRID = {bpm: PD_BPM, pickup: 0, frames: PD_DURATION};

/** Quadro de uma posição musical: compasso a partir de 1; tempo e semicolcheia a partir de 0. */
export const pat = (bar: number, beat = 0, step = 0): number => Math.round((bar - 1) * PD_BAR + beat * PD_BEAT + step * (PD_BEAT / 4));

/** Transições: [início, duração]. Terminam logo depois do tempo forte do bloco novo. */
export const MOVES = {
  scroll1: [pat(3) - 12, 14], // A sobe, B entra por baixo
  slide2: [pat(5) - 14, 16], // B vai para a esquerda, C entra pela direita
  scroll3: [pat(7) - 14, 16], // C sobe, D entra por baixo
} as const;

export const PD = {
  // A
  aRise: 0,
  aEyebrow: 2,
  aLines: [4, 8, 12],
  aSub: 18,
  drop: pat(2),
  tag: pat(2) + 4,
  // B
  bEyebrow: pat(3) + 2,
  bLines: [pat(3) + 4, pat(3) + 7, pat(3) + 10],
  items: [pat(3, 1), pat(3, 2), pat(3, 3)],
  card: pat(4),
  // C
  cBig: [pat(5) + 4, pat(5) + 8],
  cBox: pat(5, 1),
  bars: [pat(5, 1), pat(5, 1, 1), pat(5, 1, 2), pat(5, 1, 3), pat(5, 2)],
  cSub: pat(5, 3),
  cCaption: pat(6),
  // D
  dCascade: [pat(7) - 2, pat(7) + 2, pat(7) + 6, pat(7) + 12, pat(7) + 18, pat(7) + 24, pat(7) + 30],
  finalHit: pat(8),
} as const;
