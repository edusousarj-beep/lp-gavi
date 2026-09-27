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
petróleo com vermelho (`981b86d`).

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
nova/index.html         versão nova, em comparação (usa os mesmos assets/)
nova/style.css          tokens e estilos da versão nova
nova/PLANO.md           plano de design da versão nova
```

HTML estático, sem build step. Para rodar local:

```sh
npx http-server -p 8000 .
```

## Versão nova (em comparação)

`nova/` é um redesenho da mesma página, pedido em 27/09/2026 para comparar lado
a lado com a atual. Foi feito com a skill `frontend-design` e usa uma gramática
de sinalização: placas amarelas nos pontos de decisão, página clara e a fonte
Overpass. As escolhas e o porquê estão em `nova/PLANO.md`. Localmente, fica em
`http://localhost:8000/nova/`.

- **Mesmo conteúdo, mesmos botões.** Os 5 `data-sdr`, os mesmos `placement`,
  os mesmos scripts (`../assets/js/`) e os mesmos logos. Sem `reveal.js`: nada
  entra com fade.
- **Mudança de conteúdo vale para as duas.** Garantia, FAQ, bio, número do SDR:
  enquanto as duas versões existirem, edite `index.html` e `nova/index.html`.
- **`noindex`.** A versão nova não aparece em busca. Tire se ela virar a
  principal.
- **Teste A/B ainda não dá.** As duas disparam `PageView` e `ClickSDR` no mesmo
  pixel, mas o `ClickSDR` não diz de qual versão veio o clique. Para comparar
  conversão, o `sdr.js` precisa mandar a versão junto.

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
| Foto da Bruna e os 9 prints | apontam para o WordPress (`inglescomgavi.com/wp-content/uploads`). Funcionam, mas a LP fica dependente dele. Para trazer ao repositório, libere `inglescomgavi.com` na rede do ambiente ou copie os arquivos para `assets/`. |
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
4. No clique, dispara `ClickSDR` via `fbq('trackCustom', ...)`.

**`LeadQualificado` não é disparado por esta página.** É o sinal de renda
qualificada usado para otimizar campanha no Meta; enchê-lo de clique de página
destrói a otimização. Quem dispara é o SDR, depois de qualificar.

Todo CTA novo é só um `<a>` com `data-sdr` e `data-sdr-placement="<nome>"` —
o `sdr.js` cuida do resto e mantém todos no mesmo destino. Os de hoje: `hero`,
`metodo`, `conversa`, `final` e `fixo` (o CTA fixo do celular). O
`placement` vai no evento `ClickSDR`, então dá para ver qual botão converte.
