import {useState, useEffect} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

/*
 * Inter 400 e 800, servidas de public/fonts (SIL OFL 1.1, via @fontsource/inter).
 * Arquivo local em vez de Google Fonts: o render não depende de rede e sai
 * idêntico em qualquer máquina.
 */
let fontsLoaded = false;
let fontsPromise: Promise<void> | null = null;

export function ensureFonts(): Promise<void> {
  if (fontsPromise) return fontsPromise;
  if (typeof document === 'undefined') return Promise.resolve();

  const handle = delayRender('Carregando Inter');
  const faces = [
    new FontFace('Inter', `url(${staticFile('fonts/inter-latin-400-normal.woff2')}) format('woff2')`, {
      weight: '400',
    }),
    new FontFace('Inter', `url(${staticFile('fonts/inter-latin-800-normal.woff2')}) format('woff2')`, {
      weight: '800',
    }),
  ];

  fontsPromise = Promise.all(faces.map((face) => face.load())).then((loaded) => {
    loaded.forEach((face) => document.fonts.add(face));
    fontsLoaded = true;
    continueRender(handle);
  });
  // Sem a fonte o quadro sai errado: o erro derruba o render de propósito.
  return fontsPromise;
}

/**
 * Para componentes que MEDEM texto: força um novo render depois que a fonte
 * carregou e segura a captura do quadro até lá. Sem isso, o primeiro quadro de
 * cada aba do renderizador poderia medir a fonte de fallback.
 */
export function useFontsReady(): boolean {
  const [ready, setReady] = useState(fontsLoaded);
  const [handle] = useState(() => (fontsLoaded ? null : delayRender('Medindo texto com a Inter')));

  useEffect(() => {
    if (handle === null) return;
    ensureFonts().then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);

  return ready;
}

let ctx: CanvasRenderingContext2D | null = null;

/** Largura do texto em px na Inter, com o mesmo letter-spacing do CSS. */
export function measureText(text: string, sizePx: number, weight: 400 | 800, letterSpacingEm = 0): number {
  if (typeof document === 'undefined') return 0;
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return 0;
  ctx.font = `${weight} ${sizePx}px Inter`;
  return ctx.measureText(text).width + [...text].length * letterSpacingEm * sizePx;
}
