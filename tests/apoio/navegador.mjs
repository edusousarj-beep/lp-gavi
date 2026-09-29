/*
 * Apoio comum das suítes: abre o Chromium do Playwright, liga as rotas que
 * deixam o teste determinístico e conta os resultados.
 *
 * - Fontes do Google: servidas do cache (ver fontes.mjs).
 * - Imagem do WordPress ou capa do YouTube (hoje não há nenhuma: a página usa
 *   assets/img/): vira marcador com as mesmas dimensões, e o teste de mídia
 *   reprova imagem de outro site.
 * - Qualquer outro host externo (pixel da Meta etc.) é bloqueado. O `fbq` vira
 *   um gravador, para conferir os eventos sem mandar nada à Meta. Com
 *   `gravarPixel: false`, vale o snippet de verdade (o fbevents.js continua
 *   bloqueado, então as chamadas ficam na fila `fbq.queue`).
 *
 * O servidor da página não sobe aqui: o `npm test` usa o with_server.py da
 * skill webapp-testing, que sobe o servidor e roda as suítes.
 */
import { chromium } from 'playwright';
import { garantirFontes, servirFontes } from './fontes.mjs';

export const BASE = (process.env.LP_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
export const QS = '?utm_source=ig&utm_medium=paid&utm_campaign=teste-lp&utm_content=ad01&fbclid=abc123';

const mapaFontes = garantirFontes();

function marcador(url) {
  const m = url.match(/-(\d+)x(\d+)\.\w+$/);
  const [w, h] = m ? [m[1], m[2]] : url.includes('ytimg') ? [480, 360] : url.includes('FOTOS') ? [800, 1000] : [600, 1024];
  const rotulo = url.split('/').pop().slice(0, 28);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#3a3a44"/><text x="50%" y="50%" fill="#c9c9d1" font-family="sans-serif" font-size="${Math.round(w / 14)}" text-anchor="middle">${rotulo}</text></svg>`;
}

export async function abrirNavegador() {
  return chromium.launch();
}

/*
 * Contexto com as rotas e o gravador do pixel. `erros` junta exceções de JS e
 * erros de console da página (menos as falhas de rede dos hosts bloqueados).
 */
export async function novaPagina(browser, opcoes = {}, { gravarPixel = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...opcoes });

  // Rotas: a registrada por último roda primeiro. Esta é a de reserva.
  await ctx.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith('https://inglescomgavi.com/') || url.startsWith('https://i.ytimg.com/')) {
      return route.fulfill({ contentType: 'image/svg+xml', body: marcador(url) });
    }
    // Fonte fora do cache: deixa tentar a rede (numa máquina comum, carrega).
    if (url.startsWith('https://fonts.googleapis.com/') || url.startsWith('https://fonts.gstatic.com/')) {
      return route.continue();
    }
    // A página local e o arquivo aberto do disco (file:) seguem.
    return url.startsWith(BASE) || url.startsWith('file:') ? route.continue() : route.abort();
  });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, servirFontes(mapaFontes));

  if (gravarPixel) {
    await ctx.addInitScript(() => {
      window.__fbq = [];
      window.fbq = function () { window.__fbq.push([].slice.call(arguments)); };
    });
  }

  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) erros.push(m.text()); });
  return { ctx, page, erros };
}

/*
 * Serve a página local em outro endereço (o da Netlify, um domínio próprio),
 * para testar o que depende do host, como o pixel só em produção.
 */
export async function servirComo(ctx, origem) {
  await ctx.route(u => u.origin === origem, async route => {
    const u = new URL(route.request().url());
    try {
      await route.fulfill({ response: await route.fetch({ url: BASE + u.pathname + u.search }) });
    } catch {
      // Servidor fora do ar: falha já, sem esperar o tempo-limite. Se o teste
      // fechou a página com o pedido no meio (uma imagem tardia), só ignora.
      await route.abort().catch(() => {});
    }
  });
}

export async function pronta(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
}

/* Contador de resultados de uma suíte. */
export function suite(nome) {
  let falhas = 0;
  console.log(`\n== ${nome}`);
  return {
    check(ok, msg) {
      console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`);
      if (!ok) falhas++;
    },
    info(msg) { console.log(`INFO ${msg}`); },
    fim() {
      console.log(falhas ? `${nome}: ${falhas} FALHA(S)` : `${nome}: tudo passou`);
      process.exitCode = falhas ? 1 : 0;
    },
  };
}

/* Espera o IntersectionObserver e dois quadros de pintura. */
export async function assentar(page, ms = 60) {
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(ms);
}
