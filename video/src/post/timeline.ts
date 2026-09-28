/*
 * Linha do tempo e geometria da variação "Post". Mesma grade da peça
 * principal (100 BPM, 18 quadros por tempo): as entradas caem no tempo.
 * Puro TS — a trilha (scripts/compose-variations.ts) lê daqui também.
 */
import {at} from '../timeline';
import {POST} from './copy';

/* ---------------------------------------------------------------- layout */

export const CARD_W = 960;
export const PAD_X = 60;
export const PAD_TOP = 56;
export const PAD_BOTTOM = 60;
export const HEADER_H = 116;
export const TEXT_SIZE = 42;
export const LH = 58; // altura de linha
export const NUM_COL = 78; // coluna do "1 —"
const GAP_AFTER_HEADER = 40;
const GAP_BLOCK = 34;
const GAP_ITEM = 16;

/** Topo e altura de cada bloco dentro do card (px, antes do zoom). */
export const BLOCKS = (() => {
  let y = PAD_TOP + HEADER_H + GAP_AFTER_HEADER;
  return POST.blocks.map((b, i) => {
    const prev = POST.blocks[i - 1];
    if (i > 0) y += prev.num && b.num ? GAP_ITEM : b.id === 'seu' ? GAP_ITEM : GAP_BLOCK;
    const top = y;
    const h = b.lines.length * LH;
    y += h;
    return {id: b.id, top, h, bottom: top + h, center: top + h / 2};
  });
})();

export const CARD_H = BLOCKS[BLOCKS.length - 1].bottom + PAD_BOTTOM;
const block = (id: string) => BLOCKS.find((b) => b.id === id)!;

/* ---------------------------------------------------------------- eventos */

const STARTS: Record<string, number> = {
  lead: at(1),
  i1: at(2),
  i2: at(2, 2),
  i3: at(3),
  i4: at(3, 2),
  sem: at(4, 2),
  seu: at(5, 1),
  cta: at(6),
};

/** Quadro em que cada token aparece: tokens[bloco][linha][token]. */
export const TOKEN_FRAMES: number[][][] = POST.blocks.map((b) => {
  const start = STARTS[b.id];
  if (b.id === 'lead') {
    // "PROPOSTA:" é carimbada no drop; as palavras caem logo depois.
    let k = 0;
    return b.lines.map((line) => line.map((tok) => (tok.kind === 'bold' ? start : start + 4 + 4 * k++)));
  }
  if (b.id === 'sem') {
    // Staccato: um pedaço por tempo.
    const beats = [at(4, 2), at(4, 3), at(5)];
    let k = 0;
    return b.lines.map((line) => line.map(() => beats[k++]));
  }
  const step = b.id === 'seu' || b.id === 'cta' ? 2 : 1.5;
  let k = 0;
  return b.lines.map((line) => line.map(() => Math.round(start + 3 + step * k++)));
});

export const POST_EVENTS = {
  card: -8, // já entrando no quadro 0: a capa nunca fica vazia
  avatar: -2,
  name: 4,
  handle: 12,
  badge: 18,
  stamp: at(1),
  highlight: at(1, 2),
  items: ['i1', 'i2', 'i3', 'i4'].map((id) => STARTS[id]),
  underline: at(3, 1),
  sem: [at(4, 2), at(4, 3), at(5)],
  seu: STARTS.seu,
  cta: STARTS.cta,
  letters: [at(6, 1, 2), at(6, 1, 3), at(6, 2), at(6, 2, 1)],
  overview: at(7),
  // Na visão geral, as três promessas pulsam de novo, uma por tempo.
  recap: {hl: at(7, 1), ul: at(7, 2), move: at(7, 3)},
  lift: at(8),
  pill: at(8, 1),
  drop: at(9),
  finalHit: at(10),
  starts: STARTS,
} as const;

/* ----------------------------------------------------------------- câmera */

export type CamKey = {frame: number; focus: number; zoom: number};

/**
 * Câmera de leitura: a cada bloco novo ela desce, deixando o bloco que entra
 * logo abaixo do centro da tela — nunca mira o que ainda não apareceu.
 */
const FIRST_FOCUS = (PAD_TOP + block('lead').bottom) / 2;
export const CAMERA: CamKey[] = [
  {frame: -8, focus: FIRST_FOCUS, zoom: 1.12},
  ...POST.blocks.slice(1).map((b) => ({
    frame: STARTS[b.id] - 4,
    focus: Math.max(FIRST_FOCUS, block(b.id).bottom - 190),
    zoom: 1.12,
  })),
  {frame: POST_EVENTS.overview, focus: CARD_H / 2, zoom: 0.86},
  {frame: POST_EVENTS.lift, focus: CARD_H / 2 + 280, zoom: 0.8},
];
