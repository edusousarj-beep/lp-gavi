/*
 * Roda todas as suítes em sequência e junta o resultado. Use `npm test`: o
 * with_server.py (skill webapp-testing) sobe o servidor antes e desliga depois.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const AQUI = path.dirname(new URL(import.meta.url).pathname);
const BASE = (process.env.LP_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');

try {
  const r = await fetch(BASE + '/index.html');
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
} catch (e) {
  console.error(`Servidor fora do ar em ${BASE} (${e.message}). Rode pelo "npm test", que sobe o servidor.`);
  process.exit(2);
}

const SUITES = ['css.mjs', 'pagina.mjs'];
const resultado = [];
const inicio = Date.now();
for (const s of SUITES) {
  const r = spawnSync(process.execPath, [path.join(AQUI, s)], { stdio: 'inherit' });
  resultado.push([s, r.status === 0]);
}

console.log(`\n== Resumo (${Math.round((Date.now() - inicio) / 1000)}s)`);
for (const [s, ok] of resultado) console.log(`${ok ? 'ok   ' : 'FALHA'} ${s}`);
process.exit(resultado.every(([, ok]) => ok) ? 0 : 1);
