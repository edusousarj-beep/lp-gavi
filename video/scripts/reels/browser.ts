/*
 * Abre o Chromium (Playwright) numa página servida de public/, com a Inter
 * carregada. É onde rodam a Web Audio API (OfflineAudioContext) e as
 * checagens do canvas — o mesmo ambiente do navegador da prévia.
 */
import fs from 'node:fs';
import http from 'node:http';
import type {AddressInfo} from 'node:net';
import path from 'node:path';
import {chromium, type Page} from 'playwright-core';

const PUBLIC = path.resolve('public');
const MIME: Record<string, string> = {
  '.js': 'text/javascript',
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.wav': 'audio/wav',
  '.json': 'application/json',
};

export async function withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://local');
    if (url.pathname === '/') {
      res.setHeader('Content-Type', MIME['.html']);
      res.end('<!doctype html><meta charset="utf-8"><title>reels</title><body></body>');
      return;
    }
    const file = path.join(PUBLIC, decodeURIComponent(url.pathname));
    if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.statusCode = 404;
      res.end();
      return;
    }
    res.setHeader('Content-Type', MIME[path.extname(file)] ?? 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const {port} = server.address() as AddressInfo;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    // O tsx (esbuild) envolve funções nomeadas em __name(); ele não existe na página.
    await page.addInitScript({content: 'globalThis.__name = (f) => f;'});
    page.on('pageerror', (e) => console.error('erro na página:', e.message));
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.evaluate(async () => {
      const faces = [
        ['400', '/fonts/inter-latin-400-normal.woff2'],
        ['700', '/fonts/inter-latin-700-normal.woff2'],
        ['800', '/fonts/inter-latin-800-normal.woff2'],
      ].map(([weight, url]) => new FontFace('Inter', `url(${url}) format('woff2')`, {weight}));
      (await Promise.all(faces.map((f) => f.load()))).forEach((f) => document.fonts.add(f));
    });
    return await fn(page);
  } finally {
    await browser.close();
    server.close();
  }
}

/** Float32Array → base64 dentro da página (para trazer o áudio para o Node). */
export function decodeF32(b64: string): Float32Array {
  const buf = Buffer.from(b64, 'base64');
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
