/*
 * Tokens da marca — os mesmos de assets/css/style.css da LP.
 * Nenhuma cor literal existe fora deste arquivo.
 */
export const TOKENS = {
  bg: '#062D33', // petróleo escuro — fundo base
  surface: '#1B6070', // teal claro — cards de verdade, nunca chip
  border: '#0E404A', // derivado
  accent: '#E32443', // ÚNICO acento
  accentDim: '#C00E2B', // estado pressionado
  accentSoft: '#FFA8B7', // tinta do vermelho, uso restrito
  text: '#FEFEFE', // headline
  text2: '#B5D4D7', // corpo
  text3: '#729599', // labels — só sobre --bg
} as const;

/*
 * Derivados para o vídeo. Todos saem dos tokens acima por mistura, nunca
 * "no olho": sombra e profundidade são o --bg escurecido; o papel do dossiê
 * é o --text.
 */
export const DERIVED = {
  night: mix(TOKENS.bg, '#000000', 0.45), // sombra e vinheta
  shadow: mix(TOKENS.bg, '#000000', 0.7), // sombra projetada
  deep: mix(TOKENS.bg, '#000000', 0.22), // silhuetas próximas
  raised: mix(TOKENS.bg, TOKENS.surface, 0.28), // card escuro elevado
  raisedHi: mix(TOKENS.bg, TOKENS.surface, 0.42), // hover/realce do card escuro
  paper: mix(TOKENS.text, TOKENS.text2, 0.1), // folha do dossiê: branco levemente frio, sem estourar no escuro
  ink: TOKENS.bg, // texto sobre o papel
} as const;

/*
 * Regra de acento do vídeo: no máximo UM elemento vermelho por quadro.
 * Na LP o vermelho é exclusivo do CTA; no vídeo ele marca o único foco de
 * cada cena (a palavra "travar", o botão de enviar, o CTA final).
 */

/* Escala da LP (px de celular de ~432px) para o quadro de 1080px. */
export const SCALE = 2.5;

/* Escala de espaçamento da LP (8/16/24/40/64/96/144) convertida. Nada fora dela. */
export const SPACE = {
  s1: 8 * SCALE,
  s2: 16 * SCALE,
  s3: 24 * SCALE,
  s4: 40 * SCALE,
  s5: 64 * SCALE,
  s6: 96 * SCALE,
  s7: 144 * SCALE,
} as const;

export const RADIUS = 16 * SCALE;
export const RADIUS_PILL = 999;

export const FONT = '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif';

/* Dois pesos apenas, como na LP. */
export const WEIGHT = {regular: 400, heavy: 800} as const;

export function alpha(hex: string, a: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function mix(a: string, b: string, t: number): string {
  const ca = rgb(a);
  const cb = rgb(b);
  const out = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
