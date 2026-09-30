// Renderiza a composição quadro a quadro: window.render(t) + screenshot.
//
//   node render.mjs --stills 0.9,4.3,11     → ../work/stills/t-<t>.png
//   node render.mjs                         → ../work/video.mp4 (sem áudio)
//   node render.mjs --poster 7.2            → idem, com o quadro de 7,2s como quadro 0
//
// O áudio entra depois (music.py + mux no ffmpeg).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const work = path.join(here, '..', 'work');
const FPS = 30;
const W = 1080;
const H = 1920;

const args = process.argv.slice(2);
const stillsArg = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;
// Capa: o quadro 0 vira o quadro assentado mais forte (miniatura em qualquer
// plataforma). Substitui o quadro, não acrescenta: duração e sincronia ficam iguais.
const posterT = args.includes('--poster') ? Number(args[args.indexOf('--poster') + 1]) : null;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('pageerror', (err) => { console.error('erro na página:', err.message); process.exitCode = 1; });
await page.goto(pathToFileURL(path.join(here, 'index.html')).href);
await page.evaluate(() => window.__ready);
const duration = await page.evaluate(() => window.DURATION);

async function frameAt(t) {
  await page.evaluate((tt) => window.render(tt), t);
  return page.screenshot({ type: 'png' });
}

if (stillsArg) {
  const dir = path.join(work, 'stills');
  mkdirSync(dir, { recursive: true });
  for (const s of stillsArg.split(',')) {
    const t = Number(s);
    await page.evaluate((tt) => window.render(tt), t);
    await page.screenshot({ path: path.join(dir, `t-${t.toFixed(2)}.png`) });
    console.log('still', t);
  }
} else {
  mkdirSync(work, { recursive: true });
  const out = path.join(work, 'video.mp4');
  const total = Math.round(duration * FPS);
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    // RGB → YUV com a matriz BT.709: sem isso o amarelo da marca desvia.
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high',
    // aq-mode 3: mais bits nas áreas escuras, onde o degradê do fundo mora.
    '-x264-params', 'aq-mode=3',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
    '-r', String(FPS), '-movflags', '+faststart', out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  const started = Date.now();
  for (let i = 0; i < total; i++) {
    const buf = await frameAt(i === 0 && posterT !== null ? posterT : i / FPS);
    if (i === 0 && posterT !== null) writeFileSync(path.join(work, 'poster.png'), buf);
    if (!ff.stdin.write(buf)) await once(ff.stdin, 'drain');
    if (i % 60 === 0) console.log(`quadro ${i}/${total} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  const [code] = await once(ff, 'close');
  if (code !== 0) throw new Error(`ffmpeg saiu com ${code}`);
  console.log(`ok: ${out} — ${total} quadros em ${((Date.now() - started) / 1000).toFixed(0)}s`);
}

await browser.close();
