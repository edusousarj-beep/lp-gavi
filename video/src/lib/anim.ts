import {Easing, interpolate} from 'remotion';

/* Curvas da peça. Saída rápida e pouso longo, como a referência. */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

/** 0→1 entre `start` e `start + duration`, travado nas pontas. */
export function progress(
  frame: number,
  start: number,
  duration: number,
  easing: (t: number) => number = EASE_OUT,
): number {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });
}

/** Interpolação linear simples entre dois números. */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Entrada padrão de texto: desfocado → nítido, subindo. Devolve os valores
 * separados para a cena compor com as próprias transformações.
 */
export function blurIn(frame: number, start: number, duration = 10, distance = 28, blur = 16) {
  const p = progress(frame, start, duration);
  return {
    opacity: p,
    y: (1 - p) * distance,
    blur: (1 - p) * blur,
    scale: lerp(0.94, 1, p),
  };
}

/** Saída padrão: desfoca, encolhe um pouco e some. */
export function blurOut(frame: number, start: number, duration = 8, blur = 18) {
  const p = progress(frame, start, duration, EASE_IN);
  return {
    opacity: 1 - p,
    blur: p * blur,
    scale: lerp(1, 0.94, p),
  };
}

/** PRNG determinístico (mulberry32): mesmo seed, mesmo quadro, sempre. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
