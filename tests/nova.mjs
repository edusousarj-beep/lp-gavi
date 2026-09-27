/* Suíte da versão nova (nova/index.html). Rodar pelo `npm test`. */
import * as v from './apoio/verificacoes.mjs';
import { abrirNavegador, novaPagina, pronta, suite, BASE } from './apoio/navegador.mjs';

const NOVA = {
  caminho: '/nova/index.html',
  css: 'nova/style.css',
  faq: '.duvida',
  videoTopo: '.topo [data-youtube]',
  iframeTopo: '.topo iframe',
  conteudo: '#metodo .move',
  corTextoBotao: 'rgb(245, 182, 66)',
  pseudosComLuz: ['::after'], // só a borda: a nova não tem halo
  versao: 'nova',
};

const t = suite('Versão nova');
const browser = await abrirNavegador();

await v.destinoEClique(t, browser, NOVA);
await v.midia(t, browser, NOVA);
await v.semJs(t, browser, NOVA);
await v.botaoNaPrimeiraTela(t, browser, NOVA, [{ width: 390, height: 844 }, { width: 375, height: 667 }, { width: 360, height: 740 }]);
await v.umBotaoPorTela(t, browser, NOVA, [{ width: 390, height: 844 }, { width: 375, height: 667 }, { width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]);
await v.larguras(t, browser, NOVA, [320, 360, 375, 390, 600, 768, 1000, 1024, 1366, 1440, 1920]);
await v.efeitoBotao(t, browser, NOVA);
await v.semProperty(t, browser, NOVA);
await v.contraste(t, browser, NOVA, [{ width: 390, height: 844 }, { width: 1440, height: 900 }]);
await v.foco(t, browser, NOVA);

// O player ocupa a moldura 16:9, e o foco nos vídeos é amarelo (o preto some na capa escura).
{
  const { ctx, page } = await novaPagina(browser, { reducedMotion: 'reduce' });
  await page.goto(BASE + NOVA.caminho, { waitUntil: 'load' }); await pronta(page);
  await page.focus('.topo [data-youtube]');
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); await page.waitForTimeout(150);
  const cor = await page.evaluate(() => getComputedStyle(document.activeElement).outlineColor);
  t.check(cor === 'rgb(245, 182, 66)', `foco no vídeo em amarelo (${cor})`);
  await page.click('.topo [data-youtube]');
  const [w, h] = await page.$eval('.topo iframe', f => { const r = f.getBoundingClientRect(); return [r.width, r.height]; });
  t.check(w > 300 && Math.abs(w / h - 16 / 9) < 0.02, `player ocupa a moldura 16:9 (${Math.round(w)}x${Math.round(h)})`);
  await ctx.close();
}

await browser.close();
t.fim();
