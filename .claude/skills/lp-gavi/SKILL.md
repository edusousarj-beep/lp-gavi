---
name: lp-gavi
description: Constrói e edita a landing page do Inglês com a Gavi — LP de "veja a mentoria por dentro" com CTA direto para o SDR, tema escuro com acento laranja (paleta da LP v3 da Lord of Sales) e bento grid. Use SEMPRE que o pedido envolver a LP do inglês, a página da mentoria, seções dela (hero, depoimentos, planos, FAQ), o botão do SDR, tokens de cor/tipografia dessa página, ou qualquer ajuste em HTML/CSS/JS deste repositório — mesmo que o usuário não cite "landing page" explicitamente.
---

# LP — Inglês com a Gavi

## O que essa página é

Página de **prova**, não de venda. O objetivo é mostrar como a mentoria funciona
por dentro para que o lead **queira falar com o SDR**. Não existe checkout aqui.

- Público: executivos, empresários e profissionais sêniores que travam em
  reunião, call e viagem de trabalho. Renda 3k+ é piso de qualificação da
  campanha, não o tom da página.
- Tom: sóbrio, adulto, profissional. Sem gíria, sem emoji, sem informalidade de
  rede social. Nunca cite objeções que o leitor não levantou.
## Regras invioláveis

Estas regras vêm de decisões já tomadas. Não as reverta sem o usuário pedir.

1. **1. **Nomeie o método, não ensine.** O M.O.V.E. e seus pilares aparecem na
   página pelo nome e pelo que cada um entrega. O como — exercícios, sequência,
   execução — é moeda da call e não vai para a página.
   Analogia de referência: entregue o test drive, não a planta do motor.2. **Não coloque preço.** Preço só aparece depois do agendamento (Mensagem 3 do
   playbook do SDR).
3. **Não dispare `LeadQualificado` no clique do botão.** Esse evento é o sinal de
   renda qualificada usado para otimizar campanha no Meta. Sujar ele com clique
   de página destrói a otimização. Use um evento separado para o clique.
4. **Uma cor de acento só.** O acento é `--accent`. `--accent-soft` é tinta
   dele, com uso restrito (ver Design tokens); qualquer outra cor viva quebra o
   sistema — avise antes de implementar.
5. **Sem depoimento inventado.** Se não houver depoimento real disponível,
   deixe o slot vazio e sinalize — não escreva um placeholder que pareça real.

## Design tokens

Definidos em `:root`. Nunca escreva cor literal fora daqui.

```css
:root {
  --bg:          #09090B;  /* quase-preto — fundo base */
  --surface:     #1D1D20;  /* cards */
  --border:      #383838;  /* linhas e bordas neutras */
  --accent:      #FA6400;  /* ÚNICO acento — botões e destaques */
  --accent-dim:  #D65600;  /* hover e estados pressionados */
  --accent-soft: #FFAD33;  /* auxiliar — ver restrição abaixo */
  --text:        #FFFFFF;  /* headline */
  --text-2:      #A9A9B1;  /* corpo */
  --text-3:      #8A8A93;  /* derivado do --text-2 — labels, notas */

  /* Tintas do --accent. Ao trocar o acento, troque aqui também. */
  --accent-wash: rgba(250, 100, 0, 0.12);  /* fundo de ícone */
  --accent-line: rgba(250, 100, 0, 0.40);  /* bordas e linhas de destaque */
  --accent-glow: rgba(250, 100, 0, 0.30);  /* luz ambiente e brilho */

  --radius:      16px;
  --radius-pill: 999px;
}
```

**De onde vem esta paleta.** É a da LP v3 da Lord of Sales (Growth Machine),
tirada do CSS dela. O usuário escolheu trocar a paleta da marca Gavi
(petróleo `#062D33`, teal `#1B6070`, vermelho `#E32443`) por esta, sabendo do
custo: a página deixa de ter a cor dos anúncios e do Instagram da marca. Não
volte para a paleta antiga sem ele pedir; ela está no histórico do git
(commit `981b86d`).

`--text-3` foi calculado para passar em AA sobre `--bg` e sobre `--surface` —
não o troque no olho.

### Regras de contraste desta paleta

O laranja é claro. Isso inverte o que valia na paleta vermelha:

- **Texto do botão primário é `--bg`, não `--text`.** `--text` (branco) sobre
  `--accent` dá 3.05:1 e reprova em AA no tamanho do botão. `--bg` sobre
  `--accent` dá 6.53:1 (4.92:1 no hover, `--accent-dim`).
- **`--accent` pode ser texto**: 6.53:1 sobre `--bg`, 5.52:1 sobre `--surface`.
  Por isso eyebrow, título de card e letra do M.O.V.E. são laranja.
- **`--text-3` passa nas duas superfícies**: 5.81:1 sobre `--bg`, 4.91:1 sobre
  `--surface`. `--text-2` dá 8.52:1 e 7.20:1.
- **Laranja cheio só no botão.** O resto usa texto laranja ou as tintas
  (`--accent-wash`, `--accent-line`, `--accent-glow`). Um bloco laranja sólido
  fora do botão disputa com o CTA.

### `--accent-soft` (#FFAD33)

É uma tinta do laranja, não um segundo acento. Hoje só existe como o fim do
gradiente da ênfase do título do hero. **Não** vale para botão, badge, borda de
destaque ou qualquer coisa que dispute atenção com o CTA — isso é a regra 4
sendo quebrada por outro caminho.

Escala de espaçamento: 8 / 16 / 24 / 40 / 64 / 96 / 144 px. Nada fora dela.

Tipografia: uma grotesk, **dois pesos apenas** (400 e 700/800).
Headline em clamp, corpo em 16–18px, eyebrow em 11–12px com `letter-spacing:
0.14em; text-transform: uppercase; color: var(--accent)`.

Botão primário: pill, fundo `--accent`, texto `--bg`, glow via
`box-shadow: 0 0 40px -8px var(--accent)`. Um botão primário por viewport.

## Arquitetura de seções

Layout da LP v3 da Lord of Sales (ver Referências visuais), nesta ordem. Todo
CTA vai para o mesmo destino: hero, fim do M.O.V.E., Próximo passo e CTA final,
mais o CTA fixo no celular.

1. **Hero** — marca, promessa, vídeo real de 30–60s (aula, tela, bastidor) e
   botão SDR, com três bullets curtos embaixo. Sem menu de navegação.

2. **Para quem é** — três cards de situação (reunião, call, viagem) e uma linha
   de filtro que corta lead fora do perfil antes do SDR.

3. **O método M.O.V.E.** — grade 2x2 (M, O, V, E): pilares nomeados e o que
   cada um entrega. Sem ensinar a execução (regra 1).

4. **Prova** — depoimentos em vídeo (prioridade sobre texto), prints com nome,
   cargo e transcrição, e os logos das empresas onde as alunas trabalham, sob o
   rótulo "Alunas em". Nunca sugerir relação comercial com essas empresas.

5. **Próximo passo** — o card de checkout da referência, sem preço: o que
   acontece depois do clique (WhatsApp, conversa, call, decisão).

6. **Quem conduz** — Bruna Gavioli, rosto e voz. Autoridade, não currículo.
   Números só com dado real conferido.

7. **Objeções** — accordion: tempo, nível de inglês, "já tentei antes".

8. **CTA final**.

**CTA fixo no celular** (`sticky.js`): aparece entre os CTAs da página e some
sempre que outro botão do SDR está na tela. É o que mantém "um botão primário
por viewport" com um CTA sempre à mão.

Material real que falta fica em `.slot`: vazio, sinalizado, dizendo o que
precisa. Nenhum `.slot` pode estar visível na página publicada.

## Stack

- HTML estático + Tailwind (ou CSS puro com os tokens acima). Sem framework SPA.
- `lenis` para scroll suave — `npm i lenis`, ou a tag `<script>` da unpkg se o
  projeto não tiver build step. Verifique a versão atual no npm antes de fixar.
- Reveals no scroll: `IntersectionObserver` nativo. Só use GSAP/ScrollTrigger se
  o efeito realmente exigir timeline.
- Deploy: Netlify ou Vercel, a partir deste repositório.
- Respeite `prefers-reduced-motion` em qualquer animação.

## Botão do SDR — especificação

Isto é o que faz ou quebra a página. Trate como código crítico.

- Destino: `https://wa.me/<numero>?text=<mensagem pré-preenchida>`
- A mensagem pré-preenchida precisa carregar a origem, para o SDR saber de onde
  o lead veio sem perguntar.
- UTMs da URL têm que sobreviver do anúncio até o Kommo. Leia os parâmetros na
  chegada, guarde, e injete no link do WhatsApp.
- Dispare um evento de clique próprio no pixel. **Não** `LeadQualificado`.
- Todo botão da página aponta para o mesmo destino. Sem CTA secundário
  competindo.

## Referências visuais

**Layout e paleta: LP v3 da Lord of Sales** (lord-of-sales.com/v3, da Growth
Machine). Dela vêm a ordem das seções, o hero com vídeo, os cards, a grade 2x2,
o card de próximo passo, o CTA fixo, as cores e o uso do laranja em eyebrows,
títulos de card, ícones e na ênfase do título. Dela **não** vêm: preço,
checkout, contagem regressiva, "últimas vagas", bônus e garantia (regra 2 e o
tom), nem texto branco sobre o laranja, que reprova em contraste.

`ref/` contém frames de uma LP usada como referência de estilo (agência Dr.
Reels, capturada em vídeo de celular filmando um monitor).

**Use para layout e hierarquia. Não use para cor.** A referência é verde sobre
preto e a página é laranja sobre quase-preto — não há relação de cor entre as
duas. Os tokens acima mandam.

## Antes de dar por pronto

- [ ] Um só acento em toda a página (`--accent-soft` não conta como segundo)
- [ ] Texto sobre `--accent` e sobre `--surface` conferido contra as regras de contraste
- [ ] - [ ] Método nomeado sem explicar a execução de nenhum pilar; nenhuma menção a preço
- [ ] Todos os CTAs no mesmo destino, com UTM sobrevivendo
- [ ] Evento de clique separado de `LeadQualificado`
- [ ] Testado em 390px de largura antes de testar em desktop
- [ ] Nenhum depoimento fictício no HTML
- [ ] Nenhum `.slot` visível na página publicada
- [ ] CTA fixo nunca aparece junto de outro CTA
