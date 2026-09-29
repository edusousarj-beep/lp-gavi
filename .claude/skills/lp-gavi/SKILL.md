---
name: lp-gavi
description: Constrói e edita a landing page do Inglês com a Gavi — LP de "veja a mentoria por dentro" com CTA direto para o SDR, tema escuro com acento amarelo (paleta da página atual da Gavi, a do link da bio) e bento grid. Use SEMPRE que o pedido envolver a LP do inglês, a página da mentoria, seções dela (hero, depoimentos, planos, FAQ), o botão do SDR, tokens de cor/tipografia dessa página, ou qualquer ajuste em HTML/CSS/JS deste repositório — mesmo que o usuário não cite "landing page" explicitamente.
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

## Esta skill e a frontend-design

O repositório também tem a `frontend-design`, cópia da skill da Anthropic que o
usuário trouxe em 27/09/2026 para os próximos sites dele. Nesta LP, esta skill
é o brief e vale mais. Tokens, fonte (Inter), eyebrow em caixa alta, ênfase no
título do hero, cards, reveals e o efeito do botão ficam como estão, mesmo que
a frontend-design os aponte como padrão genérico. Ela mesma manda seguir o
brief quando ele fixa uma direção. Só use a frontend-design nesta página se o
usuário pedir para redesenhá-la.

**Redesenho claro, recusado.** Em 27/09/2026 o usuário comparou lado a lado um
redesenho claro feito com a frontend-design (placas amarelas, fonte Overpass,
página clara) e ficou com esta versão escura. O redesenho saiu do repositório
e está no histórico do git (commit `4c09634`). Não proponha de novo o fundo
claro sem o usuário pedir.

## Regras invioláveis

Estas regras vêm de decisões já tomadas. Não as reverta sem o usuário pedir.

1. **Nomeie o método, não ensine.** O M.O.V.E. e seus pilares aparecem na
   página pelo nome e pelo que cada um entrega. O como — exercícios, sequência,
   execução — é moeda da call e não vai para a página.
   Analogia de referência: entregue o test drive, não a planta do motor.
2. **Não coloque preço.** Preço só aparece depois do agendamento (Mensagem 3 do
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
  --bg:          #0B0908;  /* quase-preto quente — fundo base (página da bio) */
  --surface:     #1C1A19;  /* cards: branco a 7% sobre o --bg */
  --border:      #3A3530;  /* linhas e bordas neutras (1.64:1) */
  --accent:      #F5B642;  /* ÚNICO acento — botões e destaques (página da bio) */
  --accent-dim:  #DDA033;  /* hover e estados pressionados */
  --accent-soft: #FFD479;  /* auxiliar — ver restrição abaixo */
  --text:        #FFFFFF;  /* headline */
  --text-2:      #A59C8E;  /* corpo (página da bio) */
  --text-3:      #928A7D;  /* derivado do --text-2 — labels, notas */

  /* Tintas do --accent. Ao trocar o acento, troque aqui também. */
  --accent-wash: rgba(245, 182, 66, 0.12);  /* fundo de ícone */
  --accent-line: rgba(245, 182, 66, 0.40);  /* bordas e linhas de destaque */
  --accent-glow: rgba(245, 182, 66, 0.30);  /* luz ambiente e brilho */

  --tile:        #FFFFFF;                   /* fundo dos logos: marcas nas cores originais */
  --scrim:       rgba(11, 9, 8, 0.88);      /* fundo do print ampliado e da legenda do vídeo */
  --shine:       rgba(255, 255, 255, 0.50); /* reflexo que atravessa o botão do SDR */

  --radius:      16px;
  --radius-pill: 999px;
}
```

**De onde vem esta paleta.** É a da página atual da Gavi, a do link da bio
(inglescomgavi.com/vip/oferta/?v=3): amarelo `#F5B642` sobre quase-preto quente
`#0B0908`, com cinza quente `#A59C8E` e `#FFD479` como amarelo claro. O usuário
escolheu em 27/09/2026: o amarelo remete ao "school bus" americano, e o laranja
da Growth não tinha relação com a marca. `--surface`, `--border`, `--text-3` e
`--accent-dim` foram derivados para contraste; não os troque no olho.

Paletas anteriores, no histórico do git: laranja da Growth (até `4aef10b`) e
petróleo com vermelho (`981b86d`). Não volte a nenhuma sem o usuário pedir.

### Regras de contraste desta paleta

O amarelo é claro:

- **Texto do botão primário é `--bg`, nunca `--text`.** Branco sobre `--accent`
  dá 1.80:1 e reprova feio. `--bg` sobre `--accent` dá 11.03:1 (8.66:1 no
  hover, `--accent-dim`).
- **`--accent` pode ser texto**: 11.03:1 sobre `--bg`, 9.62:1 sobre `--surface`.
  Por isso eyebrow, título de card e letra do M.O.V.E. ficam no acento.
- **`--text-3` passa nas duas superfícies**: 5.82:1 sobre `--bg`, 5.08:1 sobre
  `--surface`. `--text-2` dá 7.33:1 e 6.40:1.
- **Acento cheio só no botão.** O resto usa texto no acento ou as tintas
  (`--accent-wash`, `--accent-line`, `--accent-glow`). Um bloco amarelo sólido
  fora do botão disputa com o CTA.

### `--accent-soft` (#FFD479)

É uma tinta do amarelo, não um segundo acento. Hoje só existe como o fim do
gradiente da ênfase do título do hero. **Não** vale para botão, badge, borda de
destaque ou qualquer coisa que dispute atenção com o CTA — isso é a regra 4
sendo quebrada por outro caminho.

Escala de espaçamento: 8 / 16 / 24 / 40 / 64 / 96 / 144 px. Nada fora dela.

Tipografia: uma grotesk, **dois pesos apenas** (400 e 700/800).
Headline em clamp, corpo em 16–18px, eyebrow em 11–12px com `letter-spacing:
0.14em; text-transform: uppercase; color: var(--accent)`.

Botão primário: pill, fundo `--accent`, texto `--bg`, brilho fixo via
`box-shadow: 0 0 24px -8px var(--accent)`. Um botão primário por viewport.

### Efeito do botão do SDR

Pedido do usuário em 27/09/2026 ("brilho girando"). Uma luz dá uma volta no
botão a cada 4s: um brilho branco (`--text`) corre pela borda de 2px e um
halo `--accent` desfocado acompanha por fora. A cada 5s, um reflexo
(`--shine`) atravessa o botão da esquerda para a direita. Tudo fica atrás do
texto, então o contraste não muda.

- Só os botões do SDR (`.btn--primary`) têm efeito. Se outro elemento girar
  ou brilhar, o botão perde o destaque.
- Sem pulsar, tremer, crescer ou piscar: o tom é sóbrio. Se o usuário pedir
  mais movimento, avise do risco antes de fazer.
- O brilho usa `--text` e `--shine`, nunca `--accent-soft` (ver abaixo).
- Com `prefers-reduced-motion`, nada anima: o brilho fica parado na borda e
  o reflexo não passa.
- O giro depende de `@property` (`--sdr-angle`, `--btn-fill`). O ângulo base
  vem declarado no botão (`--sdr-angle: 0deg`): em navegador sem suporte, é
  ele que deixa o brilho parado em vez de piscar a cada 2s. Não troque isso
  por reserva no `var()` (`var(--sdr-angle, 0deg)`): no Chromium 141 o giro
  trava, embora a propriedade continue andando. Para testar o giro, confira o
  gradiente calculado do `::after`, não o valor de `--sdr-angle`.

## Arquitetura de seções

Layout da LP v3 da Lord of Sales (ver Referências visuais), nesta ordem. Todo
CTA vai para o mesmo destino: hero, fim do M.O.V.E., Próximo passo e CTA final,
mais o CTA fixo no celular.

1. **Hero** — marca, promessa, vídeo real (aula, tela, bastidor; ideal 30–60s)
   e botão SDR, com três bullets curtos embaixo. Sem menu de navegação. Vídeo
   do YouTube em fachada (`video.js`): só a capa carrega, o player entra no
   clique.

2. **Para quem é** — três cards de situação (reunião, call, viagem) e uma linha
   que separa mentoria de escola, com as palavras da página atual. A mentoria
   atende todas as áreas e cargos: não corte por área.

3. **O método M.O.V.E.** — grade 2x2 (M, O, V, E): pilares nomeados e o que
   cada um entrega. Sem ensinar a execução (regra 1).

4. **Prova** — depoimentos em vídeo (Shorts 9:16, prioridade sobre texto),
   faixa de prints com ampliação (`lightbox.js`) e os logos das empresas onde
   trabalham mentorados atuais ou antigos, sob "Onde nossos mentorados
   trabalham". O usuário confirmou essas 14 empresas em 26/09/2026; empresa
   nova só entra com mentorado real lá. Logos nas cores originais, em cartão
   branco (`--tile`): o branco chapado apaga Siemens e SAP. Nunca sugerir
   relação comercial: alt só com o nome e nota de "sem vínculo".

5. **Próximo passo** — o card de checkout da referência, sem preço: o que
   acontece depois do clique (WhatsApp, conversa, call, decisão).

6. **Quem conduz** — Bruna Gavioli, rosto e voz. Autoridade, não currículo.
   Números só com dado real conferido. Hoje: foto, função, bio curta e o
   podcast (vídeo `RVVP-Ze6JVA`, "A história por trás do método"), tudo da
   página atual. O podcast usa a mesma fachada dos outros vídeos, sem a luz
   do vídeo do topo e sem rótulo: a capa já traz título e nomes escritos.

7. **Objeções** — accordion: tempo, nível de inglês, "já tentei antes" e
   garantia. A garantia é real e está em contrato (confirmada em 26/09/2026):
   8 meses de garantia de resultado, mais os 7 dias do CDC. Não mexa nos
   termos sem o usuário.

8. **CTA final**.

**CTA fixo no celular** (`sticky.js`): aparece entre os CTAs da página e some
sempre que outro botão do SDR está na tela. É o que mantém "um botão primário
por viewport" com um CTA sempre à mão.

Material real que falta fica em `.slot`: vazio, sinalizado, dizendo o que
precisa. Nenhum `.slot` pode estar visível na página publicada.

**De onde vem o conteúdo.** Pilares do M.O.V.E., bio da Bruna, vídeos, prints,
respostas do FAQ e empresas vêm da página atual,
inglescomgavi.com/vip/oferta/?v=3. Mantenha as palavras de lá; não reescreva
fato (pilar, número, garantia) sem o usuário pedir. O público são
"mentorados" (homens e mulheres), não "alunas".

**Onde fica a mídia.** Foto, prints e capas dos vídeos foram copiados da
página atual para `assets/img/` em 29/09/2026; os logos ficam em
`assets/logos/`. A página não depende do WordPress nem do `i.ytimg.com`: só o
player do YouTube vem de fora, e só no clique. Imagem nova entra copiada no
repositório, com largura e altura reais no `<img>`, nunca por link para outro
site. No CSS, essa imagem ganha altura própria ou `height: auto`: senão a
altura do atributo vale e o recorte (o 4:5 da foto, por exemplo) some. O
`npm test` reprova as duas coisas: imagem de outro site e altura presa.

## Stack

- HTML estático + Tailwind (ou CSS puro com os tokens acima). Sem framework SPA.
- `lenis` para scroll suave — `npm i lenis`, ou a tag `<script>` da unpkg se o
  projeto não tiver build step. Verifique a versão atual no npm antes de fixar.
- Reveals no scroll: `IntersectionObserver` nativo. Só use GSAP/ScrollTrigger se
  o efeito realmente exigir timeline.
- Deploy: Netlify ou Vercel, a partir deste repositório.
- Respeite `prefers-reduced-motion` em qualquer animação.
- Testes: `npm test` (Playwright em Node, pasta `tests/`). A skill
  webapp-testing dá o método e o `with_server.py`, mas os testes daqui são em
  Node: escreva os novos junto dos que existem, não comece uma suíte em
  Python. As verificações ficam em `tests/apoio/verificacoes.mjs`, por perfil
  de página: uma variante para A/B ganha a bateria inteira com um perfil novo.

## Botão do SDR — especificação

Isto é o que faz ou quebra a página. Trate como código crítico.

- Destino: `https://wa.me/<numero>?text=<mensagem pré-preenchida>`
- A mensagem pré-preenchida precisa carregar a origem, para o SDR saber de onde
  o lead veio sem perguntar.
- UTMs da URL têm que sobreviver do anúncio até o Kommo. Leia os parâmetros na
  chegada, guarde, e injete no link do WhatsApp.
- Dispare um evento de clique próprio no pixel. **Não** `LeadQualificado`.
- O pixel só liga em produção (pedido do usuário em 29/09/2026). No `<head>`,
  o snippet sai antes de carregar na Deploy Preview, no branch deploy e no
  link de deploy da Netlify (`.netlify.app` com `--`), no servidor local e no
  arquivo aberto do disco. Sem `fbq`, o `ClickSDR` também não sai. É lista de
  exclusão, não de permissão: numa lista de permissão, o domínio próprio que
  vier depois ficaria sem pixel e ninguém perceberia. Serviço de preview novo
  entra na lista do `<head>` e no teste (`pixelSoEmProducao`).
- O `ClickSDR` leva o `placement` do botão e a versão da página em
  `lp_version`, lida de `<html data-lp-version="...">`. Toda página com botão
  do SDR declara a sua versão (hoje só existe `atual`): é o que permite
  comparar versões num teste A/B.
- Todo botão da página aponta para o mesmo destino. Sem CTA secundário
  competindo.
- Texto do botão: "Conversar no WhatsApp" (decisão do usuário em 27/09/2026: o
  botão diz o que acontece no clique). O texto em volta não repete o WhatsApp:
  os itens sob o botão do topo contam o que vem depois do clique.

## Referências visuais

**Layout: LP v3 da Lord of Sales** (lord-of-sales.com/v3, da Growth Machine).
Dela vêm a ordem das seções, o hero com vídeo, os cards, a grade 2x2, o card
de próximo passo, o CTA fixo e o uso do acento em eyebrows, títulos de card,
ícones e na ênfase do título. As cores **não** vêm dela: são as da página atual
da Gavi (ver Design tokens). Também não vêm: preço, checkout, contagem
regressiva, "últimas vagas", bônus e o bloco de garantia no meio da oferta
(regra 2 e o tom). A garantia da Gavi entra, mas como pergunta no FAQ.

`ref/` contém frames de uma LP usada como referência de estilo (agência Dr.
Reels, capturada em vídeo de celular filmando um monitor).

**Use para layout e hierarquia. Não use para cor.** A referência é verde sobre
preto e a página é amarelo sobre quase-preto — não há relação de cor entre as
duas. Os tokens acima mandam.

## Antes de dar por pronto

- [ ] Um só acento em toda a página (`--accent-soft` não conta como segundo)
- [ ] Texto sobre `--accent` e sobre `--surface` conferido contra as regras de contraste
- [ ] Método nomeado sem explicar a execução de nenhum pilar; nenhuma menção a preço
- [ ] Todos os CTAs no mesmo destino, com UTM sobrevivendo
- [ ] Evento de clique separado de `LeadQualificado`
- [ ] Pixel desligado fora de produção (preview, local)
- [ ] Testado em 390px de largura antes de testar em desktop
- [ ] Nenhum depoimento fictício no HTML
- [ ] Nenhum `.slot` visível na página publicada
- [ ] CTA fixo nunca aparece junto de outro CTA
- [ ] Efeito do botão parado com `prefers-reduced-motion`
- [ ] `npm test` passou
