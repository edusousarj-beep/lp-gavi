# lp-gavi

Landing page do **Inglês com a Gavi**. Página de prova, não de venda: mostra
como a mentoria funciona por dentro para o lead querer falar com o SDR.

A especificação completa (regras invioláveis, design tokens, arquitetura das
seções, spec do botão do SDR) está em `.claude/skills/lp-gavi/SKILL.md`.

## Estado atual

Implementado: **hero + mecânica do botão do SDR**.
Pendentes as seções 2 a 7 — os slots estão marcados como comentário no
`index.html`, na ordem definida.

## Estrutura

```
index.html              hero + snippet do pixel
assets/css/style.css    tokens e estilos
assets/js/sdr.js        botão do SDR (código crítico)
assets/js/reveal.js     reveals no scroll, IntersectionObserver
```

HTML estático, sem build step. Para rodar local:

```sh
npx http-server -p 8000 .
```

## Antes de publicar

Três valores são placeholder e precisam ser preenchidos:

| Onde | O quê |
| --- | --- |
| `assets/js/sdr.js` → `CONFIG.phone` | número do SDR, internacional, só dígitos |
| `index.html` → `fbq('init', 'PIXEL_ID')` | id do pixel |
| `index.html` → `og:image`, `og:url` | quando o domínio estiver definido |

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
o `sdr.js` cuida do resto e mantém todos no mesmo destino.
