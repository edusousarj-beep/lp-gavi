/*
 * Reels "Carreira": esta composição só hospeda UM <canvas>. Todo o desenho é
 * feito por public/reels/render.js — render(ctx, t). O Remotion entra apenas
 * para capturar os 750 quadros em paralelo e montar o MP4.
 */
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ensureFonts} from '../brand/fonts';

export type Cta = 'saibamais' | 'linknabio';
type Scene = {render: (ctx: CanvasRenderingContext2D, t: number) => void};
type SceneModule = {
  ASSETS: Record<string, string>;
  createScene: (o: {images: Record<string, HTMLImageElement>; cta: Cta}) => Scene;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Não carregou ${src}`));
    img.src = src;
  });
}

export const ReelsAd: React.FC<{cta: Cta}> = ({cta}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<Scene | null>(null);
  const current = useRef(frame);
  current.current = frame;
  const [handle] = useState(() => delayRender('Carregando a cena do canvas'));

  useEffect(() => {
    (async () => {
      await ensureFonts();
      // Módulo ES servido de public/: o bundler não toca nele (webpackIgnore).
      const mod: SceneModule = await import(/* webpackIgnore: true */ staticFile('reels/render.js'));
      const entries = await Promise.all(Object.entries(mod.ASSETS).map(async ([k, p]) => [k, await loadImage(staticFile(p))] as const));
      scene.current = mod.createScene({images: Object.fromEntries(entries), cta});
      const ctx = canvas.current?.getContext('2d');
      if (ctx) scene.current.render(ctx, current.current / fps);
      continueRender(handle);
    })().catch((err) => cancelRender(err));
  }, [cta, fps, handle]);

  // Cada quadro é desenhado de forma síncrona, antes da captura.
  useLayoutEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (scene.current && ctx) scene.current.render(ctx, frame / fps);
  }, [frame, fps]);

  return (
    <AbsoluteFill style={{background: '#0B0B0C'}}>
      <canvas ref={canvas} width={1080} height={1920} style={{width: '100%', height: '100%'}} />
      <Audio src={staticFile('audio/carreira.wav')} />
    </AbsoluteFill>
  );
};
