/*
 * Fontes do Google servidas de um cache local (tests/.fontes/).
 *
 * No ambiente de nuvem, o Chromium de teste não confia no proxy de rede e a
 * fonte real não carrega. Sem a fonte certa, os testes de quebra de linha
 * (botão em 1 linha, nada fora da tela) mediriam outra letra. O curl confia
 * no proxy, então ele baixa as fontes uma vez e o teste serve do disco.
 *
 * Os links vêm do próprio HTML das páginas: trocou a fonte na página, o teste
 * baixa a nova sozinho.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const CACHE = path.join(RAIZ, 'tests', '.fontes');
const MAPA = path.join(CACHE, 'mapa.json');
const PAGINAS = ['index.html', 'nova/index.html'];

// O Google Fonts só entrega woff2 para navegador moderno.
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';

const nomeDe = (url, ext) => createHash('sha1').update(url).digest('hex').slice(0, 16) + ext;

function baixar(url, destino) {
  execFileSync('curl', ['-sS', '-f', '-L', '-A', UA, '-o', destino, url], { stdio: ['ignore', 'ignore', 'pipe'], timeout: 30000 });
}

function linksDasPaginas() {
  const links = new Set();
  for (const p of PAGINAS) {
    const html = fs.readFileSync(path.join(RAIZ, p), 'utf8');
    for (const m of html.matchAll(/href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/g)) {
      links.add(m[1].replace(/&amp;/g, '&'));
    }
  }
  return [...links];
}

/*
 * Garante o cache. Devolve o mapa { url: arquivo } ou null se não conseguiu
 * baixar; nesse caso as fontes seguem para a rede e os testes de quebra de
 * linha podem medir a fonte reserva.
 */
export function garantirFontes() {
  const links = linksDasPaginas();
  let mapa = {};
  try { mapa = JSON.parse(fs.readFileSync(MAPA, 'utf8')); } catch { /* sem cache ainda */ }

  const completo = links.every(l => mapa[l] && fs.existsSync(path.join(CACHE, mapa[l])));
  if (completo) return mapa;

  try {
    fs.mkdirSync(CACHE, { recursive: true });
    for (const css of links) {
      const arqCss = nomeDe(css, '.css');
      baixar(css, path.join(CACHE, arqCss));
      mapa[css] = arqCss;
      const texto = fs.readFileSync(path.join(CACHE, arqCss), 'utf8');
      for (const m of texto.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)) {
        const arq = nomeDe(m[1], '.woff2');
        if (!fs.existsSync(path.join(CACHE, arq))) baixar(m[1], path.join(CACHE, arq));
        mapa[m[1]] = arq;
      }
    }
    fs.writeFileSync(MAPA, JSON.stringify(mapa, null, 2));
    return mapa;
  } catch (erro) {
    console.log(`AVISO fontes: não consegui baixar para o cache (${String(erro.message).split('\n')[0]}). Os testes seguem com a fonte da rede ou a reserva.`);
    return null;
  }
}

/* Rota do Playwright: serve do cache o que estiver lá; o resto segue adiante. */
export function servirFontes(mapa) {
  return route => {
    const url = route.request().url();
    const arq = mapa && mapa[url];
    if (!arq) return route.fallback();
    const tipo = arq.endsWith('.css') ? 'text/css' : 'font/woff2';
    return route.fulfill({ contentType: tipo, body: fs.readFileSync(path.join(CACHE, arq)) });
  };
}
