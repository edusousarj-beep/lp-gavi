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

Número do SDR e id do pixel já estão preenchidos. Falta só:

| Onde | O quê |
| --- | --- |
| `index.html` → `og:image`, `og:url` | quando o domínio estiver definido |

## Ponte do SDR para a Conversions API

`netlify/functions/sdr-event.js` recebe do Make e manda `QUALIFIED`, `BAD` e
`CONVERTED` para o dataset do SDR com as chaves de correspondência hasheadas.
Existe porque esses eventos chegavam na Meta sem chave nenhuma
(`composite_score: 0`), o que impede otimizar campanha por qualificação.

A normalização mora aqui e não no Make de propósito: prefixar `55`
condicionalmente e validar comprimento no editor de expressões do Make erra em
silêncio, e silêncio foi o que causou o bug original.

Variáveis de ambiente na Netlify — as duas primeiras são obrigatórias, a função
devolve `503` sem elas:

| Variável | O quê |
| --- | --- |
| `META_CAPI_TOKEN` | token da Conversions API do dataset `963230822869669` |
| `SDR_WEBHOOK_SECRET` | segredo compartilhado; o Make manda em `x-sdr-secret` |
| `META_CAPI_TEST_CODE` | opcional, só enquanto valida no Test Events da Meta |

O Make manda `POST` com JSON plano. Campos: `event` (obrigatório, um de
`QUALIFIED`/`BAD`/`CONVERTED`), e ao menos um identificador entre `lead_id`,
`telefone`, `email` e `crm_id`. Opcionais: `nome`, `valor`, `moeda`, `quando`,
`event_id`, `fbc`, `fbp`. Sem identificador a função devolve `422` em vez de
enviar evento anônimo.

O número do SDR aparece em dois lugares e os dois precisam bater: o
`CONFIG.phone` do `sdr.js` e o `href` de fallback do `<a data-sdr>` no HTML —
esse segundo é o que vale quando o JS não carrega.

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
