/*
 * Suíte da versão executiva (executiva/index.html). Rodar pelo `npm test`.
 * Roda a mesma bateria da versão atual, com o perfil desta página, e confere
 * o que só ela tem: o formulário de aplicação, a página de obrigado e a
 * política de privacidade.
 */
import fs from 'node:fs';
import path from 'node:path';
import * as v from './apoio/verificacoes.mjs';
import { abrirNavegador, novaPagina, pronta, suite, assentar, BASE, QS } from './apoio/navegador.mjs';

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DESTINO = 'https://wa.me/5521999100432';

const PAGINA = {
  caminho: '/executiva/index.html',
  css: 'assets/css/style.css',
  faq: '.faq__item',
  videoTopo: '#por-dentro [data-youtube]',
  iframeTopo: '#por-dentro iframe',
  conteudo: '#metodo .section__head',
  corTextoBotao: 'rgb(11, 9, 8)',
  pseudosComLuz: ['::after', '::before'], // borda e halo
  versao: 'executiva', // o data-lp-version da página
  lugares: ['hero', 'metodo', 'programa', 'pronto', 'final'], // botões do SDR, sem o fixo
};

const t = suite('Versão executiva');
const browser = await abrirNavegador();

await v.destinoEClique(t, browser, PAGINA);
await v.midia(t, browser, PAGINA);
await v.semJs(t, browser, PAGINA);
await v.pixelSoEmProducao(t, browser, PAGINA);

// Os 4 vídeos da página atual também estão aqui, em fachada.
{
  const { ctx, page } = await novaPagina(browser, { reducedMotion: 'reduce' });
  await page.goto(BASE + PAGINA.caminho, { waitUntil: 'load' }); await pronta(page);
  const ids = await page.$$eval('[data-youtube]', els => els.map(e => e.dataset.youtube).sort());
  t.check(ids.join() === 'LFGi4Th1iJo,Mq2io3x4xwc,RVVP-Ze6JVA,ZmF9XccavNE', `os 4 vídeos da página atual, em fachada (${ids.join(', ')})`);
  await ctx.close();
}

// Formulário da Netlify: atributos, rótulos, isca para robô e a origem que o sdr.js preenche.
{
  const { ctx, page, erros } = await novaPagina(browser, { reducedMotion: 'reduce' });
  await page.goto(BASE + PAGINA.caminho + QS, { waitUntil: 'load' }); await pronta(page);
  const f = await page.$eval('form[name="aplicacao"]', form => ({
    netlify: form.getAttribute('data-netlify'),
    isca: form.getAttribute('netlify-honeypot'),
    iscaCampo: !!form.querySelector('[name="bot-field"]'),
    metodo: form.getAttribute('method'),
    destino: form.getAttribute('action'),
    nome: form.getAttribute('name'),
    semRotulo: [...form.querySelectorAll('input:not([type="hidden"]):not([name="bot-field"]), textarea')]
      .filter(i => !i.id || !form.querySelector(`label[for="${i.id}"]`)).map(i => i.name),
    obrigatorios: [...form.querySelectorAll('[required]')].map(i => i.name).join(),
    origem: form.querySelector('[name="origem"]').value,
    versao: form.querySelector('[name="lp_version"]').value,
    enviarCheio: form.querySelector('[type="submit"]').classList.contains('btn--primary'),
    politica: (form.querySelector('a[href$="privacidade.html"]') || {}).href || '',
  }));
  t.check(f.netlify === 'true' && f.isca === 'bot-field' && f.iscaCampo && f.metodo === 'POST' && f.nome === 'aplicacao', 'formulário da Netlify, com isca para robô');
  t.check(f.destino === '/executiva/obrigado/' && fs.existsSync(path.join(RAIZ, 'executiva/obrigado/index.html')), `o envio cai na página de obrigado (${f.destino})`);
  t.check(f.semRotulo.length === 0 && f.obrigatorios === 'nome,email,whatsapp', `todo campo com rótulo; obrigatórios: ${f.obrigatorios} (${f.semRotulo.join(', ') || 'nenhum sem rótulo'})`);
  t.check(f.origem === '[origem: ig · paid · teste-lp · ad01]' && f.versao === 'executiva', `origem da visita nos campos ocultos (${f.origem}; ${f.versao})`);
  t.check(!f.enviarCheio, 'botão de enviar vazado: o único botão cheio é o do SDR');
  const r = f.politica ? await page.request.get(f.politica) : null;
  t.check(!!r && r.ok() && /text\/html/.test(r.headers()['content-type'] || ''), 'o formulário leva à política de privacidade');
  t.check(erros.length === 0, `sem erro de JS (${erros.join(' | ') || 'nenhum'})`);
  await ctx.close();
}

// Celular: o CTA fixo nunca cobre o formulário.
{
  const { ctx, page } = await novaPagina(browser, { viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await page.goto(BASE + PAGINA.caminho, { waitUntil: 'load' }); await pronta(page);
  const cobre = [];
  for (const campo of ['#ap-nome', '#ap-objetivo', '.apply__form [type="submit"]']) {
    await page.locator(campo).scrollIntoViewIfNeeded();
    await assentar(page, 300);
    if (await page.$eval('[data-sticky-cta]', b => b.getAttribute('data-state') === 'on')) cobre.push(campo);
  }
  t.check(cobre.length === 0, `CTA fixo escondido no formulário (${cobre.join(', ') || 'ok'})`);
  await ctx.close();
}

// Obrigado: evento próprio com a versão, nunca LeadQualificado, e o botão do SDR.
{
  const { ctx, page, erros } = await novaPagina(browser);
  await page.goto(BASE + '/executiva/obrigado/index.html', { waitUntil: 'load' }); await pronta(page);
  const chamadas = await page.evaluate(() => window.__fbq);
  const aplic = chamadas.filter(c => c[0] === 'trackCustom' && c[1] === 'AplicacaoEnviada');
  t.check(aplic.length === 1 && aplic[0][2].lp_version === 'executiva', `obrigado dispara AplicacaoEnviada com a versão (${JSON.stringify(aplic.map(c => c[2]))})`);
  t.check(!JSON.stringify(chamadas).includes('LeadQualificado'), 'obrigado não dispara LeadQualificado');
  const pg = await page.evaluate(() => ({
    robo: (document.querySelector('meta[name="robots"]') || {}).content,
    botao: (document.querySelector('[data-sdr]') || {}).href || '',
  }));
  t.check(pg.robo === 'noindex' && pg.botao.startsWith(DESTINO) && erros.length === 0, `obrigado fora do Google, com o botão do SDR e sem erro (${pg.robo}; ${erros.join(' | ') || 'ok'})`);
  await ctx.close();
}

// Política de privacidade: não pode ter pendência (.slot) quando for ao ar.
{
  // Sem o gravador: vale a página de verdade, que não carrega o pixel.
  const { ctx, page } = await novaPagina(browser, {}, { gravarPixel: false });
  let pediu = false;
  page.on('request', r => { if (r.url().startsWith('https://connect.facebook.net/')) pediu = true; });
  await page.goto(BASE + '/privacidade.html', { waitUntil: 'load' });
  const faltam = await page.$$eval('.slot', els => els.map(e => e.textContent.trim()));
  t.check(faltam.length === 0, `política de privacidade sem pendência (${faltam.join('; ') || 'ok'})`);
  t.check(!pediu && await page.evaluate(() => typeof window.fbq === 'undefined'), 'política de privacidade sem pixel');
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
