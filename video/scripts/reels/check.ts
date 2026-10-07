/*
 * Checagens do Reels "Carreira" direto no canvas (sem compressão de vídeo):
 *  1. textos longe das bordas — a caixa de todo texto, em todos os 750 quadros,
 *     dentro da área segura (SAFE em render.js);
 *  2. logo original — no final, os pixels da logo no canvas são idênticos aos
 *     do arquivo (nada redesenhado, nada reamostrado), com branco puro em volta.
 *
 *   npx tsx scripts/reels/check.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import {withPage} from './browser';

const result = await withPage((page) =>
  page.evaluate(async (urls) => {
    const mod = await import(urls.render);
    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(src));
        img.src = src;
      });
    const entries = await Promise.all(Object.entries(mod.ASSETS as Record<string, string>).map(async ([k, p]) => [k, await load('/' + p)] as const));
    const images = Object.fromEntries(entries);
    const logo = images.logo;
    const debug = {boxes: [] as {t: number; a: number; x0: number; x1: number; y0: number; y1: number}[]};
    const canvas = document.createElement('canvas');
    canvas.width = mod.W;
    canvas.height = mod.H;
    const ctx = canvas.getContext('2d')!;
    const report: Record<string, unknown> = {};

    for (const cta of ['saibamais', 'linknabio']) {
      debug.boxes.length = 0;
      const scene = mod.createScene({images, cta, debug});
      const frames = Math.round(mod.DURATION * mod.FPS);
      for (let f = 0; f < frames; f++) scene.render(ctx, f / mod.FPS);
      const S = mod.SAFE;
      const out = (b: {x0: number; x1: number; y0: number; y1: number}) => b.x0 < S.x0 - 0.5 || b.x1 > S.x1 + 0.5 || b.y0 < S.y0 - 0.5 || b.y1 > S.y1 + 0.5;
      const inTransition = (t: number) => (mod.TRANSITIONS as number[][]).some(([a, b]) => t >= a && t < b);
      // Texto parado (fora das transições) nunca pode sair da área segura.
      const bad = debug.boxes.filter((b) => out(b) && !inTransition(b.t));
      const flying = debug.boxes.filter((b) => out(b) && inTransition(b.t));
      const times = [...new Set(flying.map((b) => Math.round(b.t * 100) / 100))];
      const ext = debug.boxes.reduce(
        (a, b) => ({x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1), y0: Math.min(a.y0, b.y0), y1: Math.max(a.y1, b.y1)}),
        {x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity},
      );
      // logo no quadro final, comparada ao arquivo
      scene.render(ctx, mod.T.final + 1.5);
      const L = mod.LOGO;
      const got = ctx.getImageData(L.left, L.top, L.w, L.h).data;
      const ref = document.createElement('canvas');
      ref.width = L.w;
      ref.height = L.h;
      const rc = ref.getContext('2d')!;
      rc.drawImage(logo, 0, 0);
      const want = rc.getImageData(0, 0, L.w, L.h).data;
      let maxDiff = 0;
      let diffPx = 0;
      for (let i = 0; i < got.length; i += 4) {
        const d = Math.max(Math.abs(got[i] - want[i]), Math.abs(got[i + 1] - want[i + 1]), Math.abs(got[i + 2] - want[i + 2]));
        if (d > 0) diffPx++;
        maxDiff = Math.max(maxDiff, d);
      }
      // borda ao redor da logo também branca pura (sem retângulo aparente)
      const ring = ctx.getImageData(L.left - 6, L.top - 6, L.w + 12, L.h + 12).data;
      let ringMin = 255;
      const rw = L.w + 12;
      for (let y = 0; y < L.h + 12; y++) {
        for (let x = 0; x < rw; x++) {
          if (x >= 6 && x < rw - 6 && y >= 6 && y < L.h + 6) continue;
          const i = (y * rw + x) * 4;
          ringMin = Math.min(ringMin, ring[i], ring[i + 1], ring[i + 2]);
        }
      }
      report[cta] = {
        textBoxes: debug.boxes.length,
        outsideSafe: bad.length,
        examples: bad.slice(0, 5),
        outsideOnlyInTransitions: flying.length,
        transitionTimes: times.length ? `${Math.min(...times)}–${Math.max(...times)} s` : '—',
        extent: ext,
        safe: S,
        logoMaxDiff: maxDiff,
        logoDiffPixels: diffPx,
        whiteAroundLogoMin: ringMin,
      };
    }
    return report;
  }, {render: '/reels/render.js'}),
);

console.log(JSON.stringify(result, null, 2));
fs.mkdirSync('out', {recursive: true});
fs.writeFileSync(path.join('out', 'gavi-carreira.canvas-check.json'), JSON.stringify(result, null, 2));
const ok = Object.values(result as Record<string, {outsideSafe: number; logoMaxDiff: number; whiteAroundLogoMin: number}>).every(
  (r) => r.outsideSafe === 0 && r.logoMaxDiff === 0 && r.whiteAroundLogoMin === 255,
);
console.log(ok ? 'Canvas: todas as checagens passaram.' : 'Canvas: há checagens falhando.');
process.exit(ok ? 0 : 1);
