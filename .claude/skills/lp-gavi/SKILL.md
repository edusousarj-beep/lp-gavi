---
name: lp-gavi
description: Constrói e edita a landing page do Inglês com a Gavi — LP de "veja a mentoria por dentro" com CTA direto para o SDR, tema dark com acento neon e bento grid. Use SEMPRE que o pedido envolver a LP do inglês, a página da mentoria, seções dela (hero, depoimentos, planos, FAQ), o botão do SDR, tokens de cor/tipografia dessa página, ou qualquer ajuste em HTML/CSS/JS deste repositório — mesmo que o usuário não cite "landing page" explicitamente.
---

# LP — Inglês com a Gavi

## O que essa página é

Página de **prova**, não de venda. O objetivo é mostrar como a mentoria funciona
por dentro para que o lead **queira falar com o SDR**. Não existe checkout aqui.

- Público: adultos que querem destravar inglês para viagem/trabalho, renda 3k+
- Conversão única: clique no botão do SDR (WhatsApp)
- Métrica principal: cliques no botão SDR ÷ visitantes únicos

## Regras invioláveis

Estas regras vêm de decisões já tomadas. Não as reverta sem o usuário pedir.

1. **Não explique o método.** Mostre ambiente, rotina e transformação. O nome e
   o funcionamento do M.O.V.E. são moeda da call — não vão para a página.
   Analogia de referência: entregue o test drive, não a planta do motor.
2. **Não coloque preço.** Preço só aparece depois do agendamento (Mensagem 3 do
   playbook do SDR).
3. **Não dispare `LeadQualificado` no clique do botão.** Esse evento é o sinal de
   renda qualificada usado para otimizar campanha no Meta. Sujar ele com clique
   de página destrói a otimização. Use um evento separado para o clique.
4. **Uma cor de acento só.** Se o pedido introduzir uma segunda cor viva,
   avise que isso quebra o sistema antes de implementar.
5. **Sem depoimento inventado.** Se não houver depoimento real disponível,
   deixe o slot vazio e sinalize — não escreva um placeholder que pareça real.

## Design tokens

Definidos em `:root`. Nunca escreva cor literal fora daqui.

```css
:root {
  --bg:        #0A0A0B;   /* fundo base */
  --surface:   #131316;   /* cards do bento */
  --border:    #222226;
  --accent:    #C6F84E;   /* ÚNICO acento — ajustar ao definitivo da marca */
  --accent-dim:#8FBF2E;
  --text:      #FAFAFA;   /* headline */
  --text-2:    #A1A1A6;   /* corpo */
  --text-3:    #6E6E73;   /* labels, eyebrow */
  --radius:    16px;
  --radius-pill: 999px;
}
```

Escala de espaçamento: 8 / 16 / 24 / 40 / 64 / 96 / 144 px. Nada fora dela.

Tipografia: uma grotesk, **dois pesos apenas** (400 e 700/800).
Headline em clamp, corpo em 16–18px, eyebrow em 11–12px com `letter-spacing:
0.14em; text-transform: uppercase; color: var(--text-3)`.

Botão primário: pill, fundo `--accent`, texto escuro, glow via
`box-shadow: 0 0 40px -8px var(--accent)`. Um botão primário por viewport.

## Arquitetura de seções

Nesta ordem. Botão do SDR repetido a cada duas seções, todos com o mesmo destino.

1. **Hero** — promessa + botão SDR. Sem menu de navegação longo.
2. **Veja por dentro** — vídeo real de 30–60s (aula, tela, bastidor).
3. **A semana de uma aluna** — bento grid. Rotina e ritmo, não conteúdo.
4. **Quem conduz** — Bruna Gavioli, rosto e voz. Autoridade, não currículo.
5. **Prova** — depoimentos. Vídeo tem prioridade sobre texto.
6. **Objeções** — accordion: tempo, idade, "já tentei antes".
7. **CTA final**.

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

`ref/` contém frames de uma LP usada como referência de estilo (agência Dr.
Reels, capturada em vídeo de celular filmando um monitor).

**Use para layout e hierarquia. Não use para cor.** A câmera estourou o verde
neon — as cores do arquivo não correspondem às cores reais da página. Os tokens
acima mandam.

## Antes de dar por pronto

- [ ] Um só acento em toda a página
- [ ] Nenhuma menção ao método ou a preço
- [ ] Todos os CTAs no mesmo destino, com UTM sobrevivendo
- [ ] Evento de clique separado de `LeadQualificado`
- [ ] Testado em 390px de largura antes de testar em desktop
- [ ] Nenhum depoimento fictício no HTML
