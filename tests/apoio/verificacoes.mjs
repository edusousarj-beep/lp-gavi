/*
 * Verificações da página, por perfil (seletores, cor do texto do botão,
 * arquivo de CSS). Uma variante nova da página, para um teste A/B, ganha a
 * bateria inteira com um perfil novo em tests/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { BASE, QS, novaPagina, pronta, assentar } from './navegador.mjs';

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const DESTINO = 'https://wa.me/5521999100432';

/* 1. Destino, UTMs, CTA fixo, clique no pixel, FAQ, ícones, erros de JS. */
export async function destinoEClique(t, browser, p) {
  const { ctx, page, erros } = await novaPagina(browser, { reducedMotion: 'no-preference' });
  await page.goto(BASE + p.caminho + QS, { waitUntil: 'load' }); await pronta(page);

  const hrefs = await page.$$eval('[data-sdr]', els => els.map(e => ({ p: e.dataset.sdrPlacement, h: e.getAttribute('href') })));
  t.check(hrefs.length === 5, `5 botões do SDR (${hrefs.map(h => h.p).join(', ')})`);
  t.check(new Set(hrefs.map(h => h.h)).size === 1, 'todos os botões com o mesmo destino');
  t.check(hrefs[0].h.startsWith(DESTINO + '?text='), 'destino wa.me do SDR');
  const texto = decodeURIComponent(hrefs[0].h.split('text=')[1] || '');
  t.check(texto.includes('[origem: ig · paid · teste-lp · ad01]'), 'UTMs na mensagem do WhatsApp');

  // Varre a página: o CTA fixo nunca aparece junto de outro botão.
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  let colisoes = 0;
  const visiveis = () => page.evaluate(() => {
    const bar = document.querySelector('[data-sticky-cta]');
    const vis = [...document.querySelectorAll('[data-sdr]')].filter(e => !bar.contains(e))
      .filter(e => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
    return bar.getAttribute('data-state') === 'on' && vis.length > 0;
  });
  for (let y = 0; y <= total; y += 60) {
    await page.evaluate(yy => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    await page.waitForTimeout(40);
    if (await visiveis()) {
      await page.waitForTimeout(300); // transição de entrada de um bloco; confere depois
      if (await visiveis()) colisoes++;
    }
  }
  t.check(colisoes === 0, `CTA fixo nunca junto de outro botão (${colisoes} colisões)`);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(100);
  t.check(await page.$eval('[data-sticky-cta]', b => b.getAttribute('data-state')) !== 'on', 'CTA fixo escondido no rodapé');

  // Clique: ClickSDR com placement e versão, nunca LeadQualificado.
  await page.evaluate(() => document.addEventListener('click', e => { if (e.target.closest('a')) e.preventDefault(); }));
  for (const lugar of ['hero', 'metodo', 'conversa', 'final']) await page.$eval(`[data-sdr-placement="${lugar}"]`, e => e.click());
  const chamadas = await page.evaluate(() => window.__fbq);
  const cliques = chamadas.filter(c => c[0] === 'trackCustom' && c[1] === 'ClickSDR').map(c => c[2]);
  t.check(cliques.map(c => c.placement).join() === 'hero,metodo,conversa,final', `ClickSDR por placement (${cliques.map(c => c.placement).join(', ')})`);
  t.check(!JSON.stringify(chamadas).includes('LeadQualificado'), 'nenhum LeadQualificado disparado');
  t.check(cliques[0] && cliques[0].utm_campaign === 'teste-lp' && cliques[0].fbclid === 'abc123', 'UTMs no payload do ClickSDR');
  if (p.versao) t.check(cliques.length > 0 && cliques.every(c => c.lp_version === p.versao), `ClickSDR diz a versão da página (lp_version: ${[...new Set(cliques.map(c => c.lp_version))]})`);

  // FAQ exclusivo via <details name>.
  const faq = await page.evaluate(async sel => {
    const d = [...document.querySelectorAll(sel)];
    d[0].querySelector('summary').click(); d[1].querySelector('summary').click();
    await new Promise(r => setTimeout(r, 50));
    return d.map(x => x.open);
  }, p.faq);
  t.check(JSON.stringify(faq) === '[false,true,false,false]', `abrir uma pergunta fecha a outra (${JSON.stringify(faq)})`);

  t.check(await page.$$eval('use', us => us.filter(u => !document.querySelector(u.getAttribute('href'))).length) === 0, 'todo ícone aponta para um símbolo existente');
  t.check(erros.length === 0, `sem erro de JS (${erros.join(' | ') || 'nenhum'})`);
  await ctx.close();
}

/* 2. Vídeo em fachada, print ampliado, logos, nenhum .slot. */
export async function midia(t, browser, p) {
  const { ctx, page, erros } = await novaPagina(browser, { reducedMotion: 'reduce' });
  await page.goto(BASE + p.caminho, { waitUntil: 'load' }); await pronta(page);

  // Foto, prints e capas moram em assets/img/: nenhuma imagem vem de outro site.
  // Confere antes do clique no vídeo do topo, que tira a capa dele da página.
  const imagens = await page.$$eval('img[src], [data-lightbox]', els => els.map(e => e.getAttribute('src') || e.getAttribute('href')));
  const externas = imagens.filter(s => /^(https?:)?\/\//.test(s));
  t.check(externas.length === 0, `nenhuma imagem de outro site (${externas.join(', ') || `${imagens.length} locais`})`);
  const quebradas = [];
  for (const src of new Set(imagens)) {
    const r = await page.request.get(new URL(src, page.url()).href);
    if (!r.ok() || !/^image\//.test(r.headers()['content-type'] || '')) quebradas.push(`${src} (${r.status()})`);
  }
  t.check(quebradas.length === 0, `todas as imagens locais existem (${quebradas.join(', ') || 'ok'})`);

  t.check(await page.evaluate(() => document.querySelectorAll('iframe').length) === 0, 'nenhum player do YouTube antes do clique');
  await page.click(p.videoTopo);
  const src = await page.$eval(p.iframeTopo, f => f.src).catch(() => null);
  t.check(!!src && src.startsWith('https://www.youtube-nocookie.com/embed/LFGi4Th1iJo?autoplay=1'), 'clique troca a capa pelo player (youtube-nocookie)');

  await page.locator('.prints').scrollIntoViewIfNeeded();
  const alvo = await page.getAttribute('.prints [data-lightbox] >> nth=1', 'href');
  await page.click('.prints [data-lightbox] >> nth=1');
  const aberto = await page.$eval('[data-lightbox-dialog]', d => ({ open: d.open, src: d.querySelector('img').getAttribute('src') || '' }));
  t.check(aberto.open && aberto.src === new URL(alvo, page.url()).href, `print abre ampliado (${alvo})`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100); // o evento close do <dialog> é assíncrono
  t.check(await page.$eval('[data-lightbox-dialog]', d => !d.open && !d.querySelector('img').getAttribute('src')), 'Esc fecha o print ampliado');
  await page.click('.prints [data-lightbox] >> nth=0');
  await page.click('[data-lightbox-close]');
  t.check(await page.$eval('[data-lightbox-dialog]', d => !d.open), 'botão fechar funciona');

  await page.locator('.logos').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const logos = await page.$$eval('.logos img', imgs => imgs.map(i => ({ alt: i.alt, ok: i.complete && i.naturalWidth > 0 })));
  t.check(logos.length === 14 && logos.every(l => l.ok), `14 logos carregados (${logos.filter(l => l.ok).length}/14)`);
  t.check(logos.every(l => l.alt && !/parceir|cliente/i.test(l.alt)), 'alt dos logos só com o nome da empresa');
  t.check(await page.$$eval('.slot', els => els.length) === 0, 'nenhum .slot na página');
  t.check(erros.length === 0, `sem erro de JS (${erros.join(' | ') || 'nenhum'})`);
  await ctx.close();
}

/* 3. Sem JS: conteúdo visível e botão com o href de reserva. */
export async function semJs(t, browser, p) {
  const { ctx, page } = await novaPagina(browser, { javaScriptEnabled: false });
  await page.goto(BASE + p.caminho, { waitUntil: 'load' });
  t.check(await page.$eval('[data-sdr-placement="final"]', e => e.getAttribute('href')) === DESTINO, 'sem JS, botão usa o href de reserva');
  t.check(await page.$eval(p.conteudo, e => getComputedStyle(e).opacity) === '1', 'sem JS, conteúdo visível');
  await ctx.close();
}

/* 4. Um botão primário por tela (o CTA fixo conta quando está visível). */
export async function umBotaoPorTela(t, browser, p, telas) {
  for (const vp of telas) {
    const { ctx, page } = await novaPagina(browser, { viewport: vp, reducedMotion: 'reduce' });
    await page.goto(BASE + p.caminho, { waitUntil: 'load' }); await pronta(page);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    let pior = 0, onde = '';
    for (let y = 0; y <= total; y += 100) {
      await page.evaluate(yy => window.scrollTo({ top: yy, behavior: 'instant' }), y);
      await assentar(page, 120);
      const n = await page.evaluate(() => [...document.querySelectorAll('[data-sdr]')].filter(e => {
        const caixa = e.closest('[data-sticky-cta]') || e;
        const st = getComputedStyle(caixa);
        if (st.display === 'none' || st.visibility === 'hidden') return false;
        const r = caixa.getBoundingClientRect();
        return r.bottom > 0 && r.top < innerHeight;
      }).map(e => e.dataset.sdrPlacement));
      if (n.length > pior) { pior = n.length; onde = `y=${y}: ${n.join('+')}`; }
    }
    t.check(pior <= 1, `${vp.width}x${vp.height}: no máximo 1 botão por tela (${pior}; ${onde})`);
    await ctx.close();
  }
}

/* 5. Larguras: sem rolagem lateral, nada fora da tela, texto do botão em 1 linha. */
export async function larguras(t, browser, p, lista) {
  const presas = [];
  for (const w of lista) {
    const { ctx, page } = await novaPagina(browser, { viewport: { width: w, height: 800 }, reducedMotion: 'reduce' });
    await page.goto(BASE + p.caminho, { waitUntil: 'load' }); await pronta(page);
    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const fora = [...document.querySelectorAll('body *')].filter(e => {
        if (e.closest('[aria-hidden="true"], .sprite, .prints, dialog')) return false;
        const b = e.getBoundingClientRect();
        return b.width > 0 && (b.right > vw + 0.5 || b.left < -0.5);
      }).map(e => String(e.className || e.tagName)).slice(0, 5);
      const linhas = [...document.querySelectorAll('[data-sdr] span')]
        .filter(s => s.getBoundingClientRect().height > 0)
        .map(s => Math.round(s.getBoundingClientRect().height / parseFloat(getComputedStyle(s).lineHeight)));
      // Com width/height no <img>, o CSS precisa dar a altura (ou height: auto):
      // senão vale a do atributo, e a imagem encolhe na largura mas não na altura.
      const presas = [...document.querySelectorAll('img[width][height]')].filter(i => {
        const b = i.getBoundingClientRect();
        return b.width > 0 && Math.abs(b.height - Number(i.getAttribute('height'))) < 0.5
          && Math.abs(b.width - Number(i.getAttribute('width'))) >= 0.5;
      }).map(i => `${i.getAttribute('src')} ${Math.round(i.getBoundingClientRect().width)}x${Math.round(i.getBoundingClientRect().height)}`);
      return { vw, sw: document.documentElement.scrollWidth, fora, linhas, presas };
    });
    t.check(r.sw <= r.vw && r.fora.length === 0, `${w}px: sem rolagem lateral nem elemento fora da tela (${r.fora.join(', ') || 'ok'})`);
    t.check(r.linhas.every(n => n === 1), `${w}px: texto dos ${r.linhas.length} botões visíveis em 1 linha (${r.linhas.join('/')})`);
    presas.push(...r.presas.map(x => `${x} em ${w}px`));
    await ctx.close();
  }
  t.check(presas.length === 0, `nenhuma imagem com a altura presa pelo atributo height (${presas.slice(0, 3).join(', ') || 'ok'})`);
}

/* 6. Efeito do botão: gira, reflete, respeita movimento reduzido. */
export async function efeitoBotao(t, browser, p) {
  const { ctx, page } = await novaPagina(browser, { reducedMotion: 'no-preference' });
  await page.goto(BASE + p.caminho, { waitUntil: 'load' }); await pronta(page);
  const r = await page.evaluate(async pseudos => {
    const btns = [...document.querySelectorAll('[data-sdr]')];
    const an = document.getAnimations();
    const gira = btns.map(b => an.some(a => a.animationName === 'sdr-spin' && a.effect.target === b && a.playState === 'running'));
    const reflete = btns.map(b => an.some(a => a.animationName === 'sdr-sweep' && a.effect.target === b && a.effect.pseudoElement === '::after'));
    // Vale o gradiente desenhado, não o valor de --sdr-angle: com
    // var(--sdr-angle, 0deg) a propriedade anda e o gradiente fica parado.
    const angulo = (b, pe) => (getComputedStyle(b, pe).backgroundImage.match(/conic-gradient\(from ([\d.]+)deg/) || [0, '0'])[1];
    const antes = btns.map(b => pseudos.map(pe => angulo(b, pe)));
    await new Promise(res => setTimeout(res, 500));
    const depois = btns.map(b => pseudos.map(pe => angulo(b, pe)));
    return {
      gira, reflete,
      girando: btns.map((_, i) => pseudos.every((_, k) => antes[i][k] !== depois[i][k])),
      exemplo: `${antes[0][0]}° -> ${depois[0][0]}°`,
      cor: [...new Set(btns.map(b => getComputedStyle(b).color))],
      altura: btns.map(b => Math.round(b.getBoundingClientRect().height)),
    };
  }, p.pseudosComLuz);
  t.check(r.gira.every(Boolean) && r.reflete.every(Boolean), 'giro e reflexo rodando nos 5 botões');
  t.check(r.girando.every(Boolean), `gradiente desenhado gira em ${p.pseudosComLuz.join(' e ')} dos 5 botões (1º: ${r.exemplo})`);
  t.check(r.cor.length === 1 && r.cor[0] === p.corTextoBotao, `texto dos botões em ${p.corTextoBotao} (${r.cor.join(', ')})`);
  t.check(r.altura.every(x => x === 56), `altura dos botões: ${r.altura.join(', ')}`);
  await ctx.close();

  const b = await novaPagina(browser, { reducedMotion: 'reduce' });
  await b.page.goto(BASE + p.caminho, { waitUntil: 'load' }); await pronta(b.page);
  t.check(await b.page.evaluate(() => document.getAnimations().filter(a => /^sdr-/.test(a.animationName)).length) === 0, 'movimento reduzido: nada gira nem reflete');
  await b.ctx.close();
}

/*
 * 7. Navegador sem @property (Safari < 16.4, Firefox < 128): o CSS vai sem os
 * blocos @property. O brilho tem de ficar parado, nunca sumir e voltar.
 */
export async function semProperty(t, browser, p) {
  const css = fs.readFileSync(path.join(RAIZ, p.css), 'utf8').replace(/@property\s+--[\w-]+\s*\{[^}]*\}/g, '');
  const { ctx, page } = await novaPagina(browser, { reducedMotion: 'no-preference' });
  await ctx.route('**/' + p.css, r => r.fulfill({ contentType: 'text/css', body: css }));
  await page.goto(BASE + p.caminho, { waitUntil: 'load' });
  const sumiu = [];
  for (const ms of [0, 1000, 1999, 2001, 3000, 3999]) {
    const r = await page.evaluate(([ms, pseudos]) => {
      for (const a of document.getAnimations()) if (a.animationName === 'sdr-spin') { a.pause(); a.currentTime = ms; }
      const b = document.querySelector('[data-sdr]');
      return pseudos.filter(pe => getComputedStyle(b, pe).backgroundImage === 'none');
    }, [ms, p.pseudosComLuz]);
    if (r.length) sumiu.push(`${ms}ms: ${r.join(' ')}`);
  }
  t.check(sumiu.length === 0, `sem @property, o brilho fica parado (${sumiu.join('; ') || 'nunca some'})`);
  await ctx.close();
}

/*
 * 8. Contraste de todo texto visível contra o fundo real (WCAG AA).
 * Texto em degradê conta pela pior cor do degradê; cor com transparência é
 * misturada ao fundo.
 */
export async function contraste(t, browser, p, telas) {
  for (const vp of telas) {
    const { ctx, page } = await novaPagina(browser, { viewport: vp, reducedMotion: 'reduce' });
    await page.goto(BASE + p.caminho, { waitUntil: 'load' }); await pronta(page);
    await page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));
    const res = await page.evaluate(() => {
      const cores = s => [...s.matchAll(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/g)].map(m => [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]]);
      const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const razao = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
      const mistura = (c, fundo) => c.slice(0, 3).map((v, i) => v * c[3] + fundo[i] * (1 - c[3]));
      const fundoDe = el => {
        for (let e = el; e; e = e.parentElement) {
          const c = cores(getComputedStyle(e).backgroundColor)[0];
          if (c && c[3] > 0.5) return c;
        }
        return cores(getComputedStyle(document.body).backgroundColor)[0] || [255, 255, 255, 1];
      };
      const saida = []; const visto = new Set();
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) {
        const n = w.currentNode; if (!n.textContent.trim()) continue;
        const el = n.parentElement;
        // aria-hidden fica: as letras do M.O.V.E. são aria-hidden e continuam à vista.
        if (el.closest('.sprite, dialog, [data-sticky-cta]')) continue;
        const st = getComputedStyle(el);
        if (st.visibility === 'hidden' || st.display === 'none' || el.getBoundingClientRect().width === 0) continue;
        const fundo = fundoDe(el);
        const degrade = st.backgroundClip === 'text' || st.webkitBackgroundClip === 'text';
        const tintas = degrade ? cores(st.backgroundImage) : cores(st.color);
        const pior = Math.min(...tintas.map(c => razao(mistura(c, fundo), fundo)));
        const tam = parseFloat(st.fontSize), negrito = +st.fontWeight >= 700;
        const minimo = (tam >= 24 || (negrito && tam >= 18.66)) ? 3 : 4.5;
        const chave = `${degrade ? st.backgroundImage : st.color}|${fundo.join()}|${tam}|${st.fontWeight}`;
        if (visto.has(chave)) continue; visto.add(chave);
        saida.push({ texto: n.textContent.trim().slice(0, 28), razao: Math.round(pior * 100) / 100, minimo });
      }
      return saida;
    });
    const ruins = res.filter(r => r.razao < r.minimo);
    const menor = res.reduce((m, r) => (r.razao < m.razao ? r : m), res[0]);
    t.check(ruins.length === 0, `${vp.width}px: contraste AA em ${res.length} combinações de texto (${ruins.map(r => `"${r.texto}" ${r.razao}:1`).join('; ') || `menor: ${menor.razao}:1 em "${menor.texto}"`})`);
    await ctx.close();
  }
}

/* 9. Foco pelo teclado: todo elemento focável mostra o anel. */
export async function foco(t, browser, p, passos = 12) {
  const { ctx, page } = await novaPagina(browser, { reducedMotion: 'reduce' });
  await page.goto(BASE + p.caminho, { waitUntil: 'load' }); await pronta(page);
  const sem = [];
  for (let i = 0; i < passos; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(150); // o navegador aplica o :focus-visible depois de rolar até o elemento
    const r = await page.evaluate(() => {
      const e = document.activeElement; const s = getComputedStyle(e);
      return { nome: (e.getAttribute('aria-label') || e.textContent.trim()).slice(0, 30) || e.tagName, ok: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 };
    });
    if (!r.ok) sem.push(r.nome);
  }
  t.check(sem.length === 0, `anel de foco visível nos ${passos} primeiros elementos do Tab (${sem.join(', ') || 'todos com anel'})`);
  await ctx.close();
}

/* 10. O botão do topo aparece na primeira tela, sem rolar. */
export async function botaoNaPrimeiraTela(t, browser, p, telas) {
  for (const vp of telas) {
    const { ctx, page } = await novaPagina(browser, { viewport: vp, reducedMotion: 'reduce' });
    await page.goto(BASE + p.caminho, { waitUntil: 'load' }); await pronta(page);
    const [topo, base] = await page.$eval('[data-sdr-placement="hero"]', e => { const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; });
    t.check(base <= vp.height, `${vp.width}x${vp.height}: botão do topo na primeira tela (${topo}–${base}px)`);
    await ctx.close();
  }
}
