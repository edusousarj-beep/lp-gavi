# Versão nova — plano de design

Redesenho pedido pelo usuário em 27/09/2026 para comparar lado a lado com a
página atual (`index.html`), feito com a skill `frontend-design`. O brief é o
mesmo da skill `lp-gavi`: mesmo conteúdo, mesmos botões do SDR, mesmas regras
de conteúdo e de medição. O que muda é a cara.

## Assunto, público, função

- **Assunto:** mentoria de inglês para quem trava no inglês de trabalho, na
  reunião, na call e na viagem.
- **Público:** executivos, empresários e profissionais sêniores, lendo no
  celular entre um compromisso e outro.
- **Função:** fazer a pessoa chamar a equipe no WhatsApp.

## Conceito: sinalização

O inglês de trabalho acontece em aeroporto, sala de reunião e call. O amarelo
da marca (o do link da bio, que o usuário ligou ao ônibus escolar americano) é
também a cor da sinalização de aeroporto e de estrada: legenda preta sobre
placa amarela. A página usa essa gramática. Placas amarelas marcam os pontos
de decisão, pictogramas em ladrilhos pretos nomeiam as três situações e uma
linha de trajeto mostra o próximo passo. O vocabulário já estava no conteúdo:
roadmap, próximo passo, "você sempre sabe o próximo passo".

## Cor

| Nome | Hex | Papel |
| --- | --- | --- |
| Sinal | `#F5B642` | amarelo da marca: fundo de placa, ou texto sobre preto |
| Preto | `#000000` | legenda das placas, botão, ladrilhos, rodapé |
| Terminal | `#EDEEEA` | fundo da página: cinza claro frio de terminal |
| Grafite | `#4A4B46` | texto corrido e secundário |
| Branco | `#FFFFFF` | painel dos logos, moldura dos prints |

Estados: `#2B2B28` no hover do botão; `#A9AAA4` no texto secundário do rodapé.

Contraste (WCAG): preto sobre sinal 11.65:1; preto sobre terminal 18.02:1;
grafite sobre terminal 7.55:1; sinal sobre preto 11.65:1; sinal sobre o hover
7.88:1; cinza do rodapé sobre preto 8.97:1. **Amarelo nunca é texto sobre
fundo claro** (1.55:1).

## Tipo

**Overpass**, uma família só. Ela descende da Highway Gothic, a letra das
placas de estrada americanas. 900 nas placas (títulos), 700 em nomes e botões,
400 no corpo. Escala da *Elements of Typographic Style*: 14, 16, 18, 21, 24,
36, 48, 72, 96. Corpo em 18px, linhas de até 65 caracteres. Tudo alinhado à
esquerda, como placa.

## Layout

Celular (390px):

```
┌ PLACA AMARELA ───────────────┐
│ Inglês com a Gavi            │
│                              │
│ Veja a mentoria              │  Overpass 900, 48px
│ por dentro antes             │
│ de decidir.                  │
│ [▣] Reunião [▣] Call [▣] Viagem   pictogramas das três situações
│ ┌──────────────────────────┐ │
│ │ vídeo                    │ │
│ └──────────────────────────┘ │
│ Aqui você acompanha ...      │
│ [ Quero ver por dentro     ] │  botão preto, luz amarela girando
│ Conversa no WhatsApp com ... │
└──────────────────────────────┘
  TERMINAL (claro)
  O inglês trava em algum destes momentos?
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━   barra de placa em cada situação
  [▣] Na reunião
  ...
  Aqui não é escola. É mentoria: ...

  Método M.O.V.E.
  [M] Mentalidade                 as letras são o marcador
  [O] Organização
  [V] Voz Ativa
  [E] Experiência Real
  [ Quero ver por dentro ]

  Prova: vídeos, prints, logos no painel branco
┌ PLACA AMARELA ───────────────┐
│ Uma conversa antes de ...    │
│ (1)─ Você chama a equipe ... │  trajeto: número porque é sequência
│  │                           │
│ (2)─ ...                     │
│ (3)─ ...                     │
│ (4)─ ...                     │
│ [ Quero ver por dentro     ] │
│ Garantia de 8 meses em contrato
└──────────────────────────────┘
  Bruna Gavioli (foto + bio) · perguntas
┌ PLACA AMARELA ───────────────┐
│ Veja por dentro.             │
│ Depois decida.               │
│ [ Quero ver por dentro     ] │
└──────────────────────────────┘
█ RODAPÉ PRETO █████████████████
```

Desktop (1440px): o título da placa ocupa a largura em três linhas de 96px. O
vídeo fica à esquerda (7 colunas) e o texto com o botão à direita (5). As
quatro letras do M.O.V.E. ficam lado a lado, lendo "MOVE", e o trajeto do
próximo passo vira uma linha horizontal com quatro paradas.

## Princípios

1. **Amarelo é placa, não enfeite.** Aparece onde a pessoa decide (topo,
   próximo passo, final) e nas letras do método.
2. **O título é a placa.** Sem palavra destacada, sem rótulo acima do título.
3. **Estrutura que informa.** Número só no trajeto, que é sequência de
   verdade. As letras do M.O.V.E. são o próprio conteúdo. O mesmo pictograma
   quer dizer a mesma situação em toda a página.
4. **Um movimento só:** a luz que gira no botão, pedido do usuário. Nada de
   fade em cada seção.

## Revisão contra o brief e os padrões genéricos

- **Só título enorme preto sobre amarelo é tendência de agência.** Mudei: a
  placa do topo leva os pictogramas das três situações. É o que liga o topo ao
  assunto, e não só à moda.
- **A versão escura com um acento vivo é o padrão 2 da lista da skill.** Na
  minha leitura, é também a cara mais comum de página de lançamento de
  infoproduto no Brasil, que é justamente o que o executivo não pode confundir
  com a mentoria. Por isso a página ficou clara. Contra: ela deixa de combinar
  com o link da bio, que é escuro.
- **Painel de voos com letras giratórias foi descartado.** Vira fantasia e
  pede caixa alta monoespaçada, que é o padrão 5.
- **O halo em volta do botão saiu,** porque em fundo claro vira mancha. A luz
  que gira ficou por dentro da borda do botão preto, a 3px da beirada, para
  não se misturar com a placa amarela.
- **Cantos por papel, não um raio para tudo:** placas sangram sem canto,
  ladrilhos 6px, mídia 4px, botão em pílula.

## O que não muda

Conteúdo e fatos (pilares, bio, garantia, respostas), os 5 botões com
`data-sdr` e os mesmos `placement`, pixel com `PageView` e `ClickSDR` (nunca
`LeadQualificado`), CTA fixo no celular, um botão por tela, fachada do vídeo,
prints ampliáveis e os 14 logos.

Mudanças de texto, só as que a skill pede:
- O título perde o destaque em "por dentro".
- Saem os rótulos acima dos títulos ("Para quem é", "O método", "Em vídeo"...).
- Os três itens sob o botão do topo viram uma frase só.
- O botão diz o que acontece no clique: "Conversar no WhatsApp" (pedido do
  usuário em 27/09/2026, só nesta versão). O texto em volta não repete o
  WhatsApp: "Com uma pessoa da equipe." sob o botão do topo e "Direto com uma
  pessoa da equipe." no final.

Com o texto do botão diferente, a comparação com a atual mede o visual e o
texto juntos.
