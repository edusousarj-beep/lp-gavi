/*
 * Lint das folhas de estilo, sem navegador:
 *   - nenhuma cor literal fora do :root (as cores vivem nos tokens);
 *   - espaçamento só da escala 8/16/24/40/64/96/144;
 *   - nenhum var(--sdr-angle, …) com reserva: trava o giro no Chromium 141;
 *   - chaves e comentários fechados;
 *   - contraste AA dos pares de tokens que as páginas usam.
 */
import fs from 'node:fs';
import path from 'node:path';
import { suite } from './apoio/navegador.mjs';

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const t = suite('CSS');

const ESCALA = new Set(['0', '0px', '-1px', '8px', '16px', '24px', '40px', '64px', '96px', '144px']);

const lum = hex => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const razao = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

const FOLHAS = {
  'assets/css/style.css': [
    ['text', 'bg'], ['text-2', 'bg'], ['text-3', 'bg'], ['accent', 'bg'],
    ['text', 'surface'], ['text-2', 'surface'], ['text-3', 'surface'], ['accent', 'surface'],
    ['bg', 'accent'], ['bg', 'accent-dim'],
  ],
  'nova/style.css': [
    ['preto', 'sinal'], ['preto', 'terminal'], ['grafite', 'terminal'], ['grafite', 'branco'],
    ['grafite', 'sinal'], ['sinal', 'preto'], ['sinal', 'preto-hover'], ['cinza-rodape', 'preto'],
  ],
};

for (const [arquivo, pares] of Object.entries(FOLHAS)) {
  const css = fs.readFileSync(path.join(RAIZ, arquivo), 'utf8');
  const fimRoot = css.indexOf('}', css.indexOf(':root'));
  const raiz = css.slice(0, fimRoot);
  const corpo = css.slice(fimRoot + 1);
  const codigo = css.replace(/\/\*[\s\S]*?\*\//g, '');

  const literais = corpo.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g) || [];
  t.check(literais.length === 0, `${arquivo}: nenhuma cor literal fora do :root (${literais.join(' ') || 'ok'})`);

  const fora = new Set();
  for (const m of corpo.matchAll(/^\s*(margin[\w-]*|padding[\w-]*|gap|row-gap|column-gap|inset)\s*:\s*([^;]+);/gm)) {
    for (const tok of m[2].match(/-?\d+(?:\.\d+)?px|-?\d*\.?\d+rem/g) || []) if (!ESCALA.has(tok)) fora.add(`${m[1]}: ${m[2].trim()}`);
  }
  t.check(fora.size === 0, `${arquivo}: espaçamento só da escala (${[...fora].join('; ') || 'ok'})`);

  const reserva = codigo.match(/var\(--sdr-angle,[^)]*\)/g) || [];
  t.check(reserva.length === 0, `${arquivo}: nenhum var(--sdr-angle, …) com reserva (${reserva.join(' ') || 'ok'})`);

  const abre = (css.match(/\{/g) || []).length, fecha = (css.match(/\}/g) || []).length;
  const ca = (css.match(/\/\*/g) || []).length, cf = (css.match(/\*\//g) || []).length;
  t.check(abre === fecha && ca === cf, `${arquivo}: chaves e comentários fechados`);

  const tokens = Object.fromEntries([...raiz.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\b/g)].map(m => [m[1], m[2]]));
  const ruins = pares.filter(([a, b]) => !tokens[a] || !tokens[b] || razao(tokens[a], tokens[b]) < 4.5);
  const lista = pares.map(([a, b]) => `${a}/${b} ${tokens[a] && tokens[b] ? razao(tokens[a], tokens[b]).toFixed(2) : '?'}`).join(', ');
  t.check(ruins.length === 0, `${arquivo}: pares de tokens em AA (${lista})`);
}

t.fim();
