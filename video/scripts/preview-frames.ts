/*
 * Revisão rápida: empacota uma vez e renderiza quadros avulsos em PNG.
 *   npx tsx scripts/preview-frames.ts 40 130 200 ...
 * Sem argumentos, renderiza um quadro-chave por cena.
 * PREVIEW_COMP escolhe a versão (GaviAdClaro, padrão, ou GaviAdEscuro).
 */
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {EVENTS, SCENES} from '../src/timeline';

const DEFAULT_FRAMES = [
  20,
  EVENTS.hook.wordFrames[1][2] + 12,
  EVENTS.hook.travar + 6,
  EVENTS.hook.slam + 16,
  SCENES.mission.from + 40,
  EVENTS.prompt.keys[16],
  EVENTS.prompt.click + 1,
  SCENES.processing.from + 20,
  EVENTS.dossier.footer + 16,
  EVENTS.method.letters[3] + 14,
  EVENTS.closing.lineFrames[2][2] + 14,
  EVENTS.endCard.click + 20,
];

const frames = process.argv.length > 2 ? process.argv.slice(2).map(Number) : DEFAULT_FRAMES;
const outDir = path.resolve(process.env.PREVIEW_DIR ?? 'out/preview');
const scale = Number(process.env.PREVIEW_SCALE ?? 0.5);
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null;
const id = process.env.PREVIEW_COMP ?? 'GaviAdClaro';

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable});
const composition = await selectComposition({serveUrl, id, puppeteerInstance: browser, browserExecutable});

for (const frame of frames) {
  const output = path.join(outDir, `f${String(frame).padStart(3, '0')}.png`);
  await renderStill({composition, serveUrl, frame, output, puppeteerInstance: browser, browserExecutable, imageFormat: 'png', scale});
  console.log(output);
}

await browser.close({silent: true});
