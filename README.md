# lp-gavi

Landing page do **Inglês com a Gavi**. Página de prova, não de venda: mostra
como a mentoria funciona por dentro para o lead querer falar com o SDR.

A especificação completa (regras invioláveis, design tokens, arquitetura das
seções, spec do botão do SDR) está em `.claude/skills/lp-gavi/SKILL.md`.

## Estado atual

Todas as seções estão montadas no layout e na paleta da LP v3 da Lord of Sales
(laranja sobre quase-preto), com as regras da Gavi: hero com vídeo, para quem
é, método M.O.V.E., prova, próximo passo, quem conduz, perguntas, CTA final e
CTA fixo no celular. A paleta anterior (petróleo e vermelho da marca) está no
commit `981b86d`.

Onde falta material real, a página mostra um `.slot` tracejado dizendo o que
precisa. Ver "Antes de publicar".

## Estrutura

```
index.html              seções + sprite de ícones + snippet do pixel
assets/css/style.css    tokens e estilos
assets/js/sdr.js        botão do SDR (código crítico)
assets/js/sticky.js     CTA fixo no celular
assets/js/reveal.js     reveals no scroll, IntersectionObserver
```

HTML estático, sem build step. Para rodar local:

```sh
npx http-server -p 8000 .
```

## Antes de publicar

Nenhum `.slot` pode ficar visível. O que falta:

| Onde | O quê |
| --- | --- |
| Hero | vídeo real de 30–60s (aula, tela ou bastidor) e a capa dele |
| Método | nome de cada pilar do M.O.V.E. e o que ele entrega |
| Prova | 2 depoimentos em vídeo; 3 prints com nome, cargo, empresa e transcrição |
| Prova | logos das empresas onde as alunas trabalham ("Alunas em") |
| Quem conduz | foto da Bruna (4:5) e 2–3 frases de autoridade com fatos verificáveis |
| Perguntas | respostas sobre tempo, nível de inglês e "já tentei antes" |
| `index.html` → `og:image`, `og:url` | quando o domínio estiver definido |

Cada slot tem, no HTML, um comentário com a marcação que entra no lugar dele.
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
