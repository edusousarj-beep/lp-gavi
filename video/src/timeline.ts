/*
 * Linha do tempo única do vídeo. As cenas (React) e a trilha (scripts/audio)
 * leem daqui, então todo evento visual tem o som no mesmo quadro.
 *
 * Grade: 100 BPM a 30 fps = 18 quadros por tempo, 72 por compasso.
 * 24 s = 720 quadros = 2 tempos de vinheta + 9,5 compassos.
 */
import {COPY} from './copy';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 720;

export const BPM = 100;
export const BEAT = (FPS * 60) / BPM; // 18
export const BAR = BEAT * 4; // 72
export const PICKUP = 2 * BEAT; // 36 — vinheta do logo, antes do compasso 1

/** Quadro de uma posição musical: compasso a partir de 1; tempo e semicolcheia a partir de 0. */
export const at = (bar: number, beat = 0, step = 0): number =>
  Math.round(PICKUP + (bar - 1) * BAR + beat * BEAT + step * (BEAT / 4));

export type Range = {from: number; to: number};

/* Atrair: logo + gancho. Converter: missão → pedido → abrindo → dossiê → método.
   Vender: fechamento + CTA. */
export const SCENES = {
  logo: {from: 0, to: at(1)},
  hook: {from: at(1), to: at(3)},
  mission: {from: at(3), to: at(4)},
  prompt: {from: at(4), to: at(5)},
  processing: {from: at(5), to: at(5, 2)},
  dossier: {from: at(5, 2), to: at(7)},
  method: {from: at(7), to: at(8)},
  closing: {from: at(8), to: at(9)},
  endCard: {from: at(9), to: DURATION},
} satisfies Record<string, Range>;

export type SceneName = keyof typeof SCENES;

/* ---------------------------------------------------------------- gancho */

const hookStart = SCENES.hook.from;
const travarFrame = at(2, 0, 1);
const slamFrame = at(2, 1, 2);

/** Quadro em que cada palavra do gancho aparece, na ordem de COPY.hook.lines. */
const hookWordFrames: number[][] = (() => {
  const [l1, l2] = COPY.hook.lines;
  const line1 = l1.map((_, i) => hookStart + i * 4);
  const line2 = l2.map((_, i) => hookStart + (l1.length + i) * 4);
  const line3 = [at(2), travarFrame];
  const line4 = COPY.hook.lines[3].map((_, i) => slamFrame + i * 3);
  return [line1, line2, line3, line4];
})();

/* --------------------------------------------------------------- digitação */

/**
 * Ritmo de digitação determinístico: espaço segura um pouco mais, o resto
 * varia ±30%. Devolve um quadro inteiro por caractere, estritamente crescente —
 * o mesmo quadro em que a tecla soa na trilha.
 */
export function typingFrames(text: string, start: number, end: number, seed: number): number[] {
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const weights = [...text].map((ch) => (ch === ' ' ? 1.7 : 0.7 + rand() * 0.6));
  const total = weights.reduce((a, b) => a + b, 0);
  const span = end - start;
  const frames: number[] = [];
  let acc = 0;
  for (const w of weights) {
    frames.push(start + Math.round((acc / total) * span));
    acc += w;
  }
  for (let i = 1; i < frames.length; i++) {
    if (frames[i] <= frames[i - 1]) frames[i] = frames[i - 1] + 1;
  }
  return frames;
}

const promptTypingStart = SCENES.prompt.from + 10;
const promptTypingEnd = at(4, 2, 2);

/* ------------------------------------------------------------------ eventos */

/*
 * Toda entrada começa LEAD quadros antes do corte: no quadro do corte a cena
 * nova já está ~30% visível e nunca sobra um quadro vazio entre duas cenas.
 * Os sons continuam no tempo da música (SCENES.*.from).
 */
export const LEAD = 3;

export const EVENTS = {
  logo: {
    charsStart: -4, // o quadro 0 já mostra a marca (capa do vídeo)
    charStagger: 1,
    underline: 16,
    toHeader: 26, // o logo voa para o cabeçalho e fica lá
    toHeaderEnd: 46,
  },
  hook: {
    wordFrames: hookWordFrames,
    travar: travarFrame,
    stutterEnd: at(2, 1), // picote termina no 2º tempo
    tapeStopEnd: at(2, 1, 1) - 1, // desacelera até parar
    slam: slamFrame, // "na reunião." volta com tudo
    exit: SCENES.hook.to - 8,
  },
  mission: {
    enter: SCENES.mission.from - LEAD,
    chip: SCENES.mission.from + 8,
    titleStart: SCENES.mission.from + 6,
    titleCharsPerFrame: 1.5,
    description: SCENES.mission.from + 20,
    exit: SCENES.mission.to - 8,
  },
  prompt: {
    enter: SCENES.prompt.from - LEAD,
    keys: typingFrames(COPY.prompt.text, promptTypingStart, promptTypingEnd, 7),
    zoomOut: promptTypingEnd,
    zoomOutEnd: promptTypingEnd + 12,
    cursorIn: promptTypingEnd - 2,
    click: at(4, 3, 2),
    exit: SCENES.prompt.to - 6,
  },
  processing: {
    enter: SCENES.processing.from - LEAD,
    step2: SCENES.processing.from + 18,
    progressStart: SCENES.processing.from + 2,
    progressEnd: SCENES.processing.to - 4,
    exit: SCENES.processing.to - 8,
  },
  dossier: {
    bubble: SCENES.dossier.from - LEAD,
    // A folha clara entra gradualmente (não no LEAD): num vídeo escuro, uma
    // folha branca inteira de uma vez é um clarão. O balão cobre o corte.
    doc: SCENES.dossier.from,
    header: SCENES.dossier.from,
    sections: COPY.dossier.sections.map((_, i) => SCENES.dossier.from + 6 + i * 8),
    footer: SCENES.dossier.from + 6 + COPY.dossier.sections.length * 8,
    // Saída mais longa que as outras: folha clara sumindo rápido também pisca.
    exit: SCENES.dossier.to - 12,
  },
  method: {
    circle: SCENES.method.from - LEAD,
    kicker: SCENES.method.from - LEAD,
    letters: [at(7, 0, 2), at(7, 0, 3), at(7, 1, 0), at(7, 1, 1)],
    exit: SCENES.method.to - 8,
  },
  closing: {
    lineFrames: (() => {
      let f = SCENES.closing.from - LEAD;
      return COPY.closing.lines.map((line) => {
        const frames = line.map((_, i) => f + i * 4);
        f = frames[frames.length - 1] + 8;
        return frames;
      });
    })(),
    exit: SCENES.closing.to - 8,
  },
  endCard: {
    impact: SCENES.endCard.from,
    kicker: SCENES.endCard.from - LEAD,
    wordmark: SCENES.endCard.from + 6,
    button: SCENES.endCard.from + 14,
    micro: SCENES.endCard.from + 24,
    cursorIn: SCENES.endCard.from + 32,
    cursorArrive: at(9, 3) - 4,
    click: at(9, 3),
    finalHit: at(10),
  },
} as const;

/** Quadros em que a imagem inteira congela: a palavra "travar" trava o vídeo. */
export const FREEZE: Range = {from: EVENTS.hook.stutterEnd, to: EVENTS.hook.slam};
