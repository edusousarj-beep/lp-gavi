// Gera os PNGs dos criativos a partir de criativos.json + molde.html, mais a
// prévia com todos lado a lado.
//
//   node criativos/2026-10_estaticos-branco-vermelho/fonte/gerar.cjs
//   node .../gerar.cjs --guias=<pasta>   também grava cópias com a zona segura
//                                        desenhada, para conferência
//
// .cjs porque o package.json do repositório é "type": "module".
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const AQUI = __dirname;
const SAIDA = path.join(AQUI, '..', 'exportados');
const PREVIA = path.join(AQUI, '..', 'previa.png');
const dados = JSON.parse(fs.readFileSync(path.join(AQUI, 'criativos.json'), 'utf8'));

const argGuias = process.argv.find(a => a.startsWith('--guias='));
const pastaGuias = argGuias ? path.resolve(argGuias.slice('--guias='.length)) : null;

const nomeDo = (criativo, formato) =>
  `${criativo.id}_${formato.id}_${formato.largura}x${formato.altura}.png`;
const pastaDo = criativo => path.join(SAIDA, `${criativo.id}_${criativo.slug}`);

async function exportar(navegador) {
  const relatorio = [];
  for (const formato of dados.formatos) {
    const pagina = await navegador.newPage({
      viewport: { width: formato.largura, height: formato.altura },
      deviceScaleFactor: 1,
    });
    for (const criativo of dados.criativos) {
      for (const guias of pastaGuias ? [false, true] : [false]) {
        await pagina.goto('file://' + path.join(AQUI, 'molde.html'));
        const medidas = await pagina.evaluate(
          ([d, f, c, g]) => window.montar(d, f, c, g),
          [dados, formato, criativo, guias],
        );
        const pasta = guias ? pastaGuias : pastaDo(criativo);
        fs.mkdirSync(pasta, { recursive: true });
        await pagina.screenshot({
          path: path.join(pasta, nomeDo(criativo, formato)),
          clip: { x: 0, y: 0, width: formato.largura, height: formato.altura },
        });
        if (!guias) relatorio.push({ arquivo: nomeDo(criativo, formato), ...medidas });
      }
    }
    await pagina.close();
  }
  return relatorio;
}

// Prévia: uma linha por criativo, os formatos lado a lado, sobre cinza para a
// borda do branco aparecer.
async function montarPrevia(navegador) {
  const ALTURA = 560;
  const linhas = dados.criativos.map(criativo => {
    const pecas = dados.formatos.map(formato => {
      const png = fs.readFileSync(path.join(pastaDo(criativo), nomeDo(criativo, formato)));
      const largura = Math.round(ALTURA * formato.largura / formato.altura);
      return `<figure>
        <img src="data:image/png;base64,${png.toString('base64')}" width="${largura}" height="${ALTURA}">
        <figcaption>${formato.id} · ${formato.largura}×${formato.altura}</figcaption>
      </figure>`;
    }).join('');
    return `<section><h2>${criativo.id} · ${criativo.slug}</h2><div>${pecas}</div></section>`;
  }).join('');

  const pagina = await navegador.newPage({ viewport: { width: 1600, height: 800 }, deviceScaleFactor: 1 });
  await pagina.setContent(`<!doctype html><meta charset="utf-8"><style>
    body { margin: 0; padding: 56px; background: #E6E6E6; font: 500 22px/1.3 system-ui, sans-serif; color: #333; }
    section + section { margin-top: 48px; }
    h2 { margin: 0 0 16px; font-size: 26px; font-weight: 700; }
    div { display: flex; gap: 32px; align-items: flex-start; }
    figure { margin: 0; }
    img { display: block; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18); }
    figcaption { margin-top: 10px; font-size: 18px; color: #666; }
  </style>${linhas}`);
  await pagina.screenshot({ path: PREVIA, fullPage: true });
  await pagina.close();
}

(async () => {
  const navegador = await chromium.launch();
  try {
    const relatorio = await exportar(navegador);
    await montarPrevia(navegador);
    for (const r of relatorio) {
      console.log(`\n${r.arquivo}  gancho ${r.corpoGancho}px · promessa ${r.corpoPromessa}px · ` +
        `texto de y=${r.textoTopo} a y=${r.textoBase} · vão ${r.vao}px`);
      for (const l of r.linhas.gancho) console.log(`  | ${l}`);
      for (const l of r.linhas.promessa) console.log(`  : ${l}`);
    }
  } finally {
    await navegador.close();
  }
})();
