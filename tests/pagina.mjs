/* Suíte da página (index.html). Rodar pelo `npm test`. */
import * as v from './apoio/verificacoes.mjs';
import { abrirNavegador, novaPagina, pronta, suite, BASE } from './apoio/navegador.mjs';

const PAGINA = {
  caminho: '/index.html',
  css: 'assets/css/style.css',
  faq: '.faq__item',
  videoTopo: '.hero [data-youtube]',
  iframeTopo: '.hero iframe',
  conteudo: '#metodo .section__head',
  corTextoBotao: 'rgb(11, 9, 8)',
  pseudosComLuz: ['::after', '::before'], // borda e halo
  versao: 'atual', // o data-lp-version do index.html
  lugares: ['hero', 'metodo', 'conversa', 'final'], // botões do SDR, sem o fixo
};

const t = suite('Página');
const browser = await abrirNavegador();

await v.destinoEClique(t, browser, PAGINA);
await v.midia(t, browser, PAGINA);
await v.semJs(t, browser, PAGINA);
await v.pixelSoEmProducao(t, browser, PAGINA);

// Os 4 vídeos da página atual estão na LP, em fachada; o do podcast abre o player no clique.
{
  const { ctx, page, erros } = await novaPagina(browser, { reducedMotion: 'reduce' });
  await page.goto(BASE + PAGINA.caminho, { waitUntil: 'load' }); await pronta(page);
  const ids = await page.$$eval('[data-youtube]', els => els.map(e => e.dataset.youtube).sort());
  t.check(ids.join() === 'LFGi4Th1iJo,Mq2io3x4xwc,RVVP-Ze6JVA,ZmF9XccavNE', `os 4 vídeos da página atual, em fachada (${ids.join(', ')})`);
  await page.locator('[data-youtube="RVVP-Ze6JVA"]').scrollIntoViewIfNeeded();
  await page.click('[data-youtube="RVVP-Ze6JVA"]');
  const src = await page.$eval('.founder__podcast iframe', f => f.src).catch(() => null);
  t.check(!!src && src.startsWith('https://www.youtube-nocookie.com/embed/RVVP-Ze6JVA?autoplay=1'), 'podcast abre o player no clique (youtube-nocookie)');
  t.check(erros.length === 0, `sem erro de JS (${erros.join(' | ') || 'nenhum'})`);
  await ctx.close();
}

// Se o reveal.js não carregar, a página não pode sumir.
{
  const { ctx, page } = await novaPagina(browser);
  await page.route('**/reveal.js', r => r.abort());
  await page.goto(BASE + PAGINA.caminho, { waitUntil: 'load' });
  await page.waitForTimeout(3300);
  t.check(await page.$eval(PAGINA.conteudo, e => getComputedStyle(e).opacity) === '1', 'reveal.js bloqueado: o conteúdo aparece depois de 3s');
  await ctx.close();
}

// Sem data-lp-version (a prévia, por exemplo), o clique sai sem a versão e sem erro.
{
  const { ctx, page, erros } = await novaPagina(browser);
  await ctx.route('**/index.html', async r => {
    const res = await r.fetch();
    r.fulfill({ response: res, body: (await res.text()).replace(' data-lp-version="atual"', '') });
  });
  await page.goto(BASE + PAGINA.caminho, { waitUntil: 'load' });
  await page.evaluate(() => document.addEventListener('click', e => { if (e.target.closest('a')) e.preventDefault(); }));
  await page.$eval('[data-sdr-placement="hero"]', e => e.click());
  const clique = await page.evaluate(() => (window.__fbq.find(c => c[1] === 'ClickSDR') || [])[2]);
  t.check(clique && clique.placement === 'hero' && !('lp_version' in clique) && erros.length === 0, 'sem data-lp-version, o ClickSDR sai sem a versão e sem erro');
  await ctx.close();
}

await v.botaoNaPrimeiraTela(t, browser, PAGINA, [{ width: 390, height: 844 }, { width: 375, height: 667 }, { width: 360, height: 740 }]);
await v.umBotaoPorTela(t, browser, PAGINA, [{ width: 390, height: 844 }, { width: 375, height: 667 }, { width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]);
await v.larguras(t, browser, PAGINA, [320, 360, 375, 390, 600, 768, 1024, 1366, 1440, 1920]);

// Os três itens sob o botão do topo cabem em 2 linhas cada no celular.
for (const w of [320, 360, 375, 390]) {
  const { ctx, page } = await novaPagina(browser, { viewport: { width: w, height: 740 }, reducedMotion: 'reduce' });
  await page.goto(BASE + PAGINA.caminho, { waitUntil: 'load' }); await pronta(page);
  const linhas = await page.$$eval('.hero__bullets li span', ss => ss.map(s => Math.round(s.getBoundingClientRect().height / parseFloat(getComputedStyle(s).lineHeight))));
  t.check(linhas.every(n => n <= 2), `${w}px: itens sob o botão do topo em até 2 linhas (${linhas.join('/')})`);
  await ctx.close();
}

await v.efeitoBotao(t, browser, PAGINA);
await v.semProperty(t, browser, PAGINA);
await v.contraste(t, browser, PAGINA, [{ width: 390, height: 844 }, { width: 1440, height: 900 }]);
await v.foco(t, browser, PAGINA);

await browser.close();
t.fim();
