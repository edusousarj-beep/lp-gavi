# lp-gavi

Landing page do **Inglês com a Gavi**. Página de prova, não de venda: mostra
como a mentoria funciona por dentro para o lead querer falar com o SDR.

A especificação completa (regras invioláveis, design tokens, arquitetura das
seções, spec do botão do SDR) está em `.claude/skills/lp-gavi/SKILL.md`.

## Estado atual

Todas as seções estão montadas no layout da LP v3 da Lord of Sales, com a
paleta da página atual da Gavi (amarelo sobre quase-preto quente, a do link da
bio) e as regras da skill: hero com vídeo, para quem é, método M.O.V.E., prova,
próximo passo, quem conduz, perguntas, CTA final e CTA fixo no celular. As
paletas anteriores estão no histórico: laranja da Growth (até `4aef10b`) e
petróleo com vermelho (`981b86d`). Em 27/09/2026, uma versão clara feita com a
skill `frontend-design` foi comparada lado a lado e descartada; ela está no
histórico do git (commit `4c09634`).

Os botões do SDR têm um brilho que gira em volta e um reflexo que passa a
cada 5s (regras na skill, em "Efeito do botão do SDR"). Para quem ativa
"reduzir movimento" no aparelho, ficam parados.

O conteúdo (pilares do M.O.V.E., bio da Bruna, vídeos, prints, respostas do
FAQ e empresas) vem da página atual, inglescomgavi.com/vip/oferta/?v=3. Hoje não
há nenhum `.slot` na página; se faltar material no futuro, ele entra como
`.slot` tracejado dizendo o que precisa.

## Estrutura

```
index.html              seções + sprite de ícones + snippet do pixel
assets/css/style.css    tokens e estilos
assets/js/sdr.js        botão do SDR (código crítico)
assets/js/sticky.js     CTA fixo no celular
assets/js/video.js      vídeos do YouTube em fachada (player só no clique)
assets/js/lightbox.js   print ampliado num <dialog>
assets/js/reveal.js     reveals no scroll, IntersectionObserver
assets/logos/           logos das empresas dos mentorados (SVG)
assets/img/             foto da Bruna, prints e capas dos vídeos
tests/                  testes da página (npm test)
package.json            só para os testes: Playwright preso em 1.56.1
```

HTML estático, sem build step. Para rodar local:

```sh
npx http-server -p 8000 .
```

## Testes

Os testes ficam em `tests/` e rodam num Chromium de verdade, pelo Playwright.

```sh
npm install     # só na primeira vez
npm test
```

O `npm test` usa o `with_server.py` da skill webapp-testing: sobe um servidor
local na porta 8765, roda as suítes e desliga o servidor. A saída do servidor
é descartada de propósito: o script guarda essa saída sem ler, e o log do
servidor de Python lota o buffer e trava os testes no meio.

| Suíte | O que confere |
| --- | --- |
| `tests/css.mjs` | cores só nos tokens, espaçamento da escala, contraste dos pares de tokens, nenhum `var(--sdr-angle, …)` |
| `tests/pagina.mjs` | destino e UTMs do WhatsApp; `ClickSDR` com placement e versão, nunca `LeadQualificado`; pixel só em produção; CTA fixo sem colisão; um botão por tela; botão do topo na primeira tela; sem rolagem lateral de 320 a 1920px; texto do botão em 1 linha; vídeo, prints e logos; nenhuma imagem de outro site nem com a altura presa pelo atributo `height`; página sem JS; giro do botão, também sem `@property`; movimento reduzido; contraste AA de todo texto; anel de foco |

As fontes do Google são baixadas uma vez com `curl` para `tests/.fontes/`. O
Chromium do ambiente de nuvem não confia no proxy de rede e, sem a fonte certa,
os testes de quebra de linha medem outra letra. A página não carrega imagem de
outro site: o teste reprova se aparecer uma e confere se cada imagem local
existe.

Fora do ambiente de nuvem, depois do `npm install`, rode uma vez
`npx playwright install chromium`.

## Skills

- `.claude/skills/lp-gavi/`: a especificação desta LP.
- `.claude/skills/frontend-design/`: skill de design da Anthropic, copiada sem
  alterações de [anthropics/skills](https://github.com/anthropics/skills)
  (commit `3337550`, 24/09/2026), com a licença Apache 2.0 no `LICENSE.txt` da
  pasta. Serve para os próximos sites; nesta LP, a `lp-gavi` vale mais. Para
  atualizar, copie a pasta de novo do repositório original.

## Antes de publicar

Nenhum `.slot` pode ficar visível. Pendências:

| Onde | O quê |
| --- | --- |
| Selo "Powered by Netlify" | a Netlify liga esse selo nos projetos novos do plano gratuito, e no celular ele cobre o botão fixo do WhatsApp. Desligue em **Project configuration > General > Powered by Netlify badge** (vale na hora, sem novo deploy) e confira no celular. |
| Foto da Bruna | é a da página atual: 563x582, com o texto e a moldura inclinada desenhados na própria imagem. No celular ela ocupa 342x428px da tela, o que numa tela de alta densidade (3x) pede cerca de 1030x1280 pixels: a imagem é ampliada uns 2x e perde nitidez. Uma foto limpa, vertical (4:5), com pelo menos 1000px de largura, resolve. |
| Vídeo do hero | é o `LFGi4Th1iJo` da página atual. A skill pede 30–60s; confira a duração. |
| Logos | marcas de terceiros, usadas porque há mentorados nessas empresas (confirmado em 26/09/2026). Empresa nova só com mentorado real lá. |
| `index.html` → `og:image`, `og:url` | quando o domínio estiver definido |

Os números de "Quem conduz" estão comentados: só entram com dado real conferido.

O número do SDR precisa bater em todos os lugares: o `CONFIG.phone` do
`sdr.js` e o `href` de fallback de cada `<a data-sdr>` no HTML. O `href` é o
que vale quando o JS não carrega.

## Como a atribuição funciona

1. Na chegada, `sdr.js` lê da URL: `utm_*`, `fbclid`, `gclid`, `ttclid`.
2. Guarda em `localStorage` por 90 dias. Visita com parâmetros substitui o que
   estava guardado (last touch); visita direta reaproveita o guardado.
3. Injeta a origem na mensagem pré-preenchida do WhatsApp, para o SDR saber de
   onde o lead veio sem perguntar e a atribuição chegar ao Kommo.
4. No clique, dispara `ClickSDR` via `fbq('trackCustom', ...)`, com o
   `placement` do botão e a versão da página em `lp_version` (lida de
   `<html data-lp-version="...">`; hoje, `atual`). Serve para um teste A/B com
   uma variante futura da página.

**`LeadQualificado` não é disparado por esta página.** É o sinal de renda
qualificada usado para otimizar campanha no Meta; enchê-lo de clique de página
destrói a otimização. Quem dispara é o SDR, depois de qualificar.

**O pixel só liga em produção.** Na Deploy Preview e no branch deploy da
Netlify (endereço `.netlify.app` com `--`), no servidor local e no arquivo
aberto do disco, o snippet do `<head>` sai antes de carregar. Sem `fbq`, o
`sdr.js` também não manda o `ClickSDR`, e o botão segue para o WhatsApp.
Então, dá para testar à vontade sem sujar o dataset. É lista de exclusão: um
domínio de produção novo liga o pixel sem mexer em nada. Um serviço de preview
novo (Vercel, por exemplo) precisa entrar na lista do `<head>` e no teste.

Todo CTA novo é só um `<a>` com `data-sdr` e `data-sdr-placement="<nome>"` —
o `sdr.js` cuida do resto e mantém todos no mesmo destino. Os de hoje: `hero`,
`metodo`, `conversa`, `final` e `fixo` (o CTA fixo do celular). O
`placement` vai no evento `ClickSDR`, então dá para ver qual botão converte.
