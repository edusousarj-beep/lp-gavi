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

## Skills do Claude

Ficam em `.claude/skills/` e carregam em qualquer sessão que abra este
repositório, no terminal ou na nuvem. Na nuvem, `/plugin` não roda e plugins
ligados no `.claude/settings.json` não são instalados; fora desta pasta, só
carregam lá as skills ligadas na conta do claude.ai.

| Skill | Origem | Papel aqui |
| --- | --- | --- |
| `lp-gavi` | este repositório | A spec da página |
| `frontend-design` | `anthropics/skills` @ `3337550` (24/09/2026), Apache-2.0 | Direção de arte das seções 2 a 9 |
| `webapp-testing` | `anthropics/skills` @ `3337550` (24/09/2026), Apache-2.0 | Abrir a página no Chromium e tirar print em 390px |

A `frontend-design` manda seguir o brief onde ele fixa uma direção, e aqui o
brief é a `lp-gavi`. Conflito conhecido: ela lista eyebrow em caixa alta como
sinal de página gerada, e a `lp-gavi` exige eyebrow em caixa alta. Vale a
`lp-gavi` até alguém decidir o contrário.

Na nuvem, o Playwright de Python não vem instalado. `pip install
playwright==1.56.0` (uns 5 s) usa o Chromium que já vem no ambiente — testado
em 28/09/2026. Outra versão do pacote pode procurar outro build do Chromium.

As duas são cópia fixa, sem atualização automática. Para atualizar, copie de
novo a pasta `skills/<nome>` do repositório de origem e troque o commit na
tabela.

Ficaram de fora, de propósito:

- **`gsap-scrolltrigger`, `locomotive-scroll`** (comunidade,
  `freshtechbro/claudedesignskills`, sem commit desde 19/11/2025). A spec já
  escolheu `IntersectionObserver` e Lenis. A de GSAP trata SplitText e
  CustomEase como plugins pagos, e o GSAP é gratuito desde a 3.13 (abr/2025).
  A de Locomotive ensina a API da v4 (`data-scroll-container`), e o npm hoje
  instala a v5, que roda sobre o Lenis.
- **`threejs-webgl`, `playcanvas-engine`, `web3d-integration-patterns`**. 3D
  não tem função numa página de prova com CTA para o WhatsApp.
- **`theme-factory`**. Aplica tema pronto de cor e fonte, e esta página já tem
  tokens de marca.
