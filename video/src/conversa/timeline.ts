/*
 * Linha do tempo e geometria da variação "Conversa". Mesma grade das outras
 * peças (100 BPM, 18 quadros por tempo): cada balão chega num tempo da música.
 * Puro TS — a trilha (scripts/compose-variations.ts) lê daqui também.
 */
import {at} from '../timeline';
import {CONVERSA} from './copy';

/* ---------------------------------------------------------------- layout */

export const CARD_W = 960;
export const CENTER_Y = 880; // o card cresce para cima e para baixo a partir daqui
export const HEADER_H = 136;
export const TEXT_SIZE = 40;
export const LH = 54;
export const BUB_PAD_X = 26;
export const BUB_PAD_Y = 16;
export const SIDE = 26; // margem do balão até a borda do card
export const BODY_PAD_TOP = 22;
export const CHIP_H = 46;
export const BODY_PAD_BOTTOM = 22;
export const DOTS_H = 76;
export const DOTS_W = 150;
export const INPUT_BOX = 84; // caixa de texto com uma linha
export const INPUT_LINE = 48; // cada linha a mais na caixa
export const INPUT_PAD = 18;
export const INPUT_AREA = INPUT_BOX + 2 * INPUT_PAD;
export const MAX_CARD_H = 1270;
export const MAX_BODY = MAX_CARD_H - HEADER_H - INPUT_AREA;
const GAP_SAME = 10;
const GAP_SWITCH = 24;
const CHIP_GAP = 22;

export const bubbleH = (lines: number) => 2 * BUB_PAD_Y + lines * LH;

/** Topo e fundo de cada balão dentro do corpo da conversa (px, sem rolagem). */
export const LAYOUT = (() => {
  let y = BODY_PAD_TOP + CHIP_H + CHIP_GAP;
  return CONVERSA.messages.map((m, i) => {
    const prev = CONVERSA.messages[i - 1];
    if (prev) y += prev.from === m.from ? GAP_SAME : GAP_SWITCH;
    const top = y;
    const h = bubbleH(m.lines.length);
    y += h;
    // Primeiro balão de cada sequência do mesmo remetente leva o "rabinho".
    return {id: m.id, top, h, bottom: top + h, tail: !prev || prev.from !== m.from};
  });
})();

export const CHIP_BOTTOM = BODY_PAD_TOP + CHIP_H;

/* ---------------------------------------------------------------- eventos */

type MsgTiming = {arrive: number; dots?: number; typing?: [number, number]};

/** Quando cada balão chega; "dots" = a Bruna começa a digitar; "typing" = a aluna digita na caixa. */
export const TIMING: Record<string, MsgTiming> = {
  m1: {arrive: at(1), typing: [-6, 30]}, // começa antes do 0: o 1º quadro já tem texto
  m2: {arrive: at(1, 2), dots: at(1, 1) + 2},
  m3: {arrive: at(2), dots: at(1, 3) - 6},
  m4: {arrive: at(3), dots: at(2, 3) - 2},
  m5: {arrive: at(3, 2), dots: at(3, 1) + 2},
  m6: {arrive: at(4), dots: at(3, 3) + 2},
  m7: {arrive: at(4, 2), dots: at(4, 1) + 2},
  m8: {arrive: at(5), dots: at(4, 3) + 2},
  m9: {arrive: at(6), typing: [at(5, 2) + 2, at(6) - 6]},
  m10: {arrive: at(7), dots: at(6, 1) + 4},
  m11: {arrive: at(8), dots: at(7, 3) - 2},
};

/** Quadro de cada caractere digitado (grafemas, para o emoji contar como um). */
export function typedFrames(id: string): number[][] {
  const lines = CONVERSA.typed[id];
  const [from, to] = TIMING[id].typing!;
  const total = lines.reduce((n, l) => n + [...l].length, 0);
  let k = 0;
  return lines.map((l) => [...l].map(() => Math.round(from + ((to - from) * k++) / (total - 1))));
}

export const CONVERSA_EVENTS = {
  card: -6,
  strike: at(2, 1), // risco em "volume"
  highlight: at(2, 2), // marca-texto em "frequência"
  letters: [at(3), at(3, 0, 1), at(3, 0, 2), at(3, 0, 3)], // M.O.V.E
  emph: at(4) + 8, // "SUAS"
  underline: at(4, 3), // "garantia de resultado"
  focus: [at(4, 2) + 8, at(5, 1)] as const, // câmera chega perto do contrato
  stampLines: [at(7), at(7, 1), at(7, 2)], // "Não." e as duas linhas seguintes
  drop: at(9), // card recua, pílula "Saiba mais"
  finalHit: at(10),
  punches: [at(1, 2), at(7)], // "Não é você." e "Não."
} as const;

/** Ticks do balão da aluna: enviado → entregue → lido. */
export const ticks = (arrive: number) => ({sent: arrive, delivered: arrive + 8, read: arrive + 18});

/** Balões que crescem linha a linha, no tempo (o "Não." chega sozinho). */
export const LINE_REVEAL: Record<string, readonly number[]> = {m10: CONVERSA_EVENTS.stampLines};

/** Quadro em que a linha `l` do balão aparece. */
export const lineAt = (id: string, l: number) => LINE_REVEAL[id]?.[l] ?? TIMING[id].arrive;

/**
 * Degraus do fundo do conteúdo: cada "digitando…" abre espaço para os três
 * pontinhos; cada balão ocupa o seu. O componente suaviza entre degraus.
 */
export const CONTENT_STEPS: {frame: number; bottom: number}[] = (() => {
  const steps = [{frame: -1000, bottom: CHIP_BOTTOM}];
  CONVERSA.messages.forEach((m, i) => {
    const t = TIMING[m.id];
    if (t.dots !== undefined) steps.push({frame: t.dots, bottom: LAYOUT[i].top + DOTS_H});
    m.lines.forEach((_, l) => {
      if (l === 0 || LINE_REVEAL[m.id]) steps.push({frame: lineAt(m.id, l), bottom: LAYOUT[i].top + bubbleH(LINE_REVEAL[m.id] ? l + 1 : m.lines.length)});
    });
  });
  return steps;
})();

/** A caixa de texto ganha uma linha quando a digitação quebra, e volta no envio. */
export const INPUT_STEPS: {frame: number; lines: number}[] = (() => {
  const steps = [{frame: -1000, lines: 1}];
  for (const id of Object.keys(CONVERSA.typed)) {
    typedFrames(id).forEach((line, l) => {
      if (l > 0) steps.push({frame: line[0], lines: l + 1});
    });
    steps.push({frame: TIMING[id].arrive, lines: 1});
  }
  return steps.sort((a, b) => a.frame - b.frame);
})();

/** "digitando…" no cabeçalho: dos pontinhos até o balão; pausas curtas entre balões não apagam. */
export const TYPING_SPANS: [number, number][] = (() => {
  const spans: [number, number][] = [];
  for (const m of CONVERSA.messages) {
    const t = TIMING[m.id];
    if (t.dots === undefined) continue;
    const last = spans[spans.length - 1];
    if (last && t.dots - last[1] <= 24) last[1] = t.arrive;
    else spans.push([t.dots - 2, t.arrive]);
  }
  return spans;
})();
