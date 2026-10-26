# Paleta da marca

Inglês com a Gavi. Renovada em 26/10/2026 a pedido do usuário: "um ar mais
jovem, renovado", com alterações sutis. A paleta anterior era fechada e lia
como mais do mesmo no mercado de inglês.

Esta é a paleta da marca. A LP deste repositório usa outra, a da página da bio
(amarelo sobre quase-preto, ver `.claude/skills/lp-gavi/SKILL.md`), e não
muda: em 26/10/2026 o usuário decidiu não aplicar a paleta nova nela.

## As sete cores

Seis mudam, uma fica. Cada uma continua na sua família.

| Cor | Antes | Agora | ΔE | O que mudou |
| --- | --- | --- | --- | --- |
| Vermelho | `#E32443` | `#FE626C` | 0.111 | Mesmo matiz (H 20), mais aberto (L 0.59 → 0.70). Sai do vermelho das escolas e da bandeira. O texto em cima dele passa a ser petróleo. |
| Rosa | `#FFA8B7` | `#FFC2C8` | 0.060 | Mais claro e limpo, para servir de fundo de destaque. |
| Bordô (era vinho) | `#C00E2B` | `#921F3C` | 0.096 | O vinho era o vermelho da bandeira britânica (ΔE 0.017 do Pantone 186 C). O bordô é o vermelho para texto sobre fundo claro. |
| Petróleo | `#062D3C` | `#062D3C` | 0 | Fica. É a âncora sóbria e o texto sobre o vermelho novo (4.96:1). |
| Teal | `#1B6070` | `#01707D` | 0.048 | Mais vivo (C 0.071 → 0.086). Papel em cima continua passando (5.44:1). |
| Água (era névoa) | `#B5D4D7` | `#A2E6EA` | 0.048 | Tira o cinza: a saturação dobra (C 0.033 → 0.068) e fica a mesma do água do logo (`#9CDBE1`, C 0.064), um pouco mais claro para servir de fundo. |
| Papel (era branco) | `#FEFEFE` | `#FBF7F1` | 0.021 | Branco levemente quente para fundos. A diferença está no limiar: aparece ao lado do branco puro. |

ΔE é a distância no espaço OKLab (ΔE OK); L, C e H são as coordenadas OKLCH.
O CSS Color 4 (W3C) usa 0.02 como a menor diferença perceptível.

## Regras de contraste

WCAG 2.x, nível AA: 4.5:1 para texto; 3:1 para texto grande (a partir de
24px, ou 18.66px em negrito).

**A regra que muda: texto sobre o vermelho é petróleo (4.96:1).** Branco puro
e papel sobre o vermelho dão 2.93:1 e 2.74:1 e reprovam até em texto grande.
Na paleta anterior era o contrário: branco sobre `#E32443` dava 4.53:1.

**O que a paleta ganha:** o vermelho passa a valer como texto sobre o petróleo
(4.96:1; o anterior dava 3.18:1).

| Fundo | Texto em AA (4.5:1) | Só texto grande (3:1) |
| --- | --- | --- |
| Papel | petróleo 13.59 · bordô 7.92 · teal 5.44 | — |
| Água | petróleo 10.39 · bordô 6.06 | teal 4.16 |
| Rosa | petróleo 9.53 · bordô 5.56 | teal 3.82 |
| Vermelho | petróleo 4.96 | — |
| Petróleo | papel 13.59 · água 10.39 · rosa 9.53 · vermelho 4.96 | — |
| Teal | papel 5.44 | água 4.16 · rosa 3.82 |
| Bordô | papel 7.92 · água 6.06 · rosa 5.56 | — |

Não passam nem como texto grande: vermelho sobre fundo claro (papel 2.74,
água 2.10, rosa 1.92), teal sobre petróleo (2.50) e bordô sobre petróleo
(1.71).

## Proporção

O que mais renova a marca não é o código de cada cor, é quem domina a peça.

- Claros (papel, água, rosa) no campo: cerca de 60%.
- Petróleo e teal no texto e na estrutura: cerca de 30%.
- Vermelho como faísca: cerca de 10%. Botão, a palavra-chave, o G do logo.
- Evite vermelho, petróleo e branco em partes iguais: é a leitura de bandeira.

## Por que o vermelho mudou mais que as outras

Seis grandes redes de inglês do país usam vermelho como cor principal ou de
destaque, e o vermelho anterior da Gavi era, na prática, o mesmo delas: a
distância para o do CNA (0.019) fica abaixo do limiar de 0.02.

| Marca | Cor | ΔE do vermelho anterior | ΔE do vermelho novo |
| --- | --- | --- | --- |
| CNA | `#ED1941` | 0.019 | 0.104 |
| Fisk | `#E31F26` | 0.027 | 0.121 |
| Cultura Inglesa | `#E21E26` | 0.027 | 0.123 |
| Wizard | `#E70022` | 0.030 | 0.126 |
| CCAA | `#BC0E12` | 0.095 | 0.197 |
| Wise Up | `#A70240` | 0.135 | 0.235 |
| Bandeira britânica (Pantone 186 C) | `#C8102E` | 0.064 | 0.170 |
| Preply (rosa) | `#FF7AAC` | 0.179 | 0.085 |
| Open English (laranja) | `#FF6600` | 0.136 | 0.082 |

O vinho anterior (`#C00E2B`) ficava a 0.017 da bandeira britânica e a 0.022
do CCAA. O bordô fica a 0.112 e 0.095 deles; o mais perto agora é o Wise Up
(0.044), aceitável para uma cor de apoio.

Cores lidas nas páginas iniciais em 26/10/2026, por extração automática
(Firecrawl, formato `branding`). A extração é heurística: confira no manual de
cada marca antes de citar em público. A cor da bandeira é a conversão mais
citada do Pantone 186 C.

**Por que não um ajuste menor.** Com texto branco legível (4.5:1), não existe
vermelho vivo fora desse grupo: a busca no espaço de cor só achou saída
tirando saturação (tons como `#D23D57`), o contrário de mais jovem. E entre a
luminância 0.18 e 0.27 nem texto branco nem petróleo passam em AA. Por isso o
vermelho foi para 0.31 e o texto em cima dele virou petróleo.

## Em aberto

- **Logo.** Substituído em 26/10/2026 por um logo tipográfico com ponto final
  vermelho: ver `marca/logo.md`.

## Como os números foram calculados

OKLab e OKLCH pela conversão de Björn Ottosson; ΔE OK é a distância euclidiana
em OKLab. Contraste pela luminância relativa do WCAG 2.x, a mesma fórmula do
`tests/css.mjs`.
