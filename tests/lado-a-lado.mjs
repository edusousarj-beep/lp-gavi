/*
 * Capturas das duas versões lado a lado, nas mesmas condições (mesma largura,
 * fontes e marcadores de imagem). Saem em tests/.capturas/. Use
 * `npm run lado-a-lado`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { abrirNavegador, novaPagina, BASE } from './apoio/navegador.mjs';

const SAIDA = path.join(path.dirname(new URL(import.meta.url).pathname), '.capturas');
fs.mkdirSync(SAIDA, { recursive: true });
const VERSOES = { Atual: '/index.html', Nova: '/nova/index.html' };
const browser = await abrirNavegador();

async function capturar(caminho, vp, dpr, inteira) {
  const { ctx, page } = await novaPagina(browser, { viewport: vp, deviceScaleFactor: dpr, reducedMotion: 'reduce' });
  await page.goto(BASE + caminho, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const altura = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= altura; y += vp.height / 2) { await page.evaluate(yy => scrollTo(0, yy), y); await page.waitForTimeout(25); }
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
  const png = await page.screenshot({ fullPage: inteira });
  await ctx.close();
  return 'data:image/png;base64,' + png.toString('base64');
}

async function montar(arquivo, imagens, largura, nota) {
  const colunas = Object.entries(imagens).map(([nome, src]) => `<div><p style="margin:0 0 12px">${nome}</p><img src="${src}" style="width:${largura}px;display:block;border:1px solid #ccc"></div>`).join('');
  const html = `<body style="margin:0;background:#fff;color:#222;font:600 18px Arial,sans-serif;padding:24px;display:grid;grid-template-columns:repeat(2,${largura}px);gap:32px;width:max-content">${colunas}<p style="grid-column:1/-1;margin:0;font-weight:400;font-size:14px;color:#555">${nota}</p></body>`;
  const ctx = await browser.newContext({ viewport: { width: largura * 2 + 90, height: 400 } });
  const page = await ctx.newPage();
  await page.setContent(html); await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(SAIDA, arquivo), fullPage: true });
  await ctx.close();
  console.log(path.join('tests/.capturas', arquivo));
}

const nota = 'Blocos cinza = marcadores do teste: foto, prints e capas dos vídeos não carregam no ambiente de teste.';
const cada = async (vp, dpr, inteira) => Object.fromEntries(await Promise.all(Object.entries(VERSOES).map(async ([n, c]) => [n, await capturar(c, vp, dpr, inteira)])));
await montar('lado-a-lado-celular.png', await cada({ width: 390, height: 844 }, 2, false), 390, 'Celular, 390x844, primeira tela. ' + nota);
await montar('lado-a-lado-desktop.png', await cada({ width: 1440, height: 900 }, 1, false), 720, 'Desktop, 1440x900, primeira tela. ' + nota);
await montar('lado-a-lado-pagina.png', await cada({ width: 390, height: 844 }, 1, true), 390, 'Celular, página inteira. ' + nota);
await browser.close();
