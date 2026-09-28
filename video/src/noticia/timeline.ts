/*
 * Linha do tempo da variação "Notícia", na grade de 100 BPM da peça.
 * A trilha (scripts/compose-variations.ts) lê daqui.
 */
import {at} from '../timeline';

export const NOTICIA_EVENTS = {
  brand: -6, // o quadro 0 já mostra a marca
  divider: 2,
  partner: 4,
  unroll: 4,
  // O caminho já digita enquanto o card desenrola: nada de papel em branco.
  crumbs: 14,
  rule: 26,
  // Manchete batendo no tempo: uma palavra por colcheia; "90" conta até 90.
  headline: [
    [at(1, 1), at(1, 1, 2)],
    [at(1, 2), at(1, 2, 2)],
    [at(1, 3), at(2)],
  ],
  counterEnd: at(2) - 2,
  quote: at(2, 1),
  underlines: [at(2, 1) + 26, at(3)],
  author: at(3, 1),
  tag: at(3, 2),
  scroll: at(4, 2),
  more: at(4, 2) + 12,
  yours: at(5, 1),
  pill: at(6),
  letters: [at(6, 1, 2), at(6, 1, 3), at(6, 2), at(6, 2, 1)],
  fingerIn: at(6, 3),
  tap: at(7),
  caption: at(7, 2),
  drop: at(9),
  finalHit: at(10),
} as const;

export const SCROLL_BY = 450; // quanto o artigo rola para mostrar a continuação
