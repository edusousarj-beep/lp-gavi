# Vídeo — Inglês com a Gavi (anúncio vertical de 24 s)

Peça audiovisual programada em **React + Remotion**. Não há arquivo de vídeo,
música ou imagem de terceiros: as cenas são componentes React, a imagem
editorial é desenhada por código e a trilha é sintetizada em TypeScript. Tudo
é editável e o render sai idêntico a cada execução.

Formato modelado a partir de um anúncio SaaS de referência (logo → gancho →
card de missão → digitação → "pensando" → documento em 3D → rotina →
fechamento → CTA), reescrito para a marca: petróleo + um acento vermelho,
Inter 400/800 e as regras da skill `lp-gavi`.

Saem **duas versões do mesmo anúncio**, que só mudam a luz — linha do tempo,
animação e trilha são idênticas:

- **claro** (`GaviAdClaro`): fundo quase branco, como o vídeo de referência;
  texto em petróleo, destaques em teal, imagem editorial de manhã.
- **escuro** (`GaviAdEscuro`): petróleo, como a LP; imagem editorial à noite.

E duas **variações de layout** com a copy do post que a Gavi já veicula
(mesma grade de 100 BPM, trilha própria, movimentos próprios):

- **Post** (`GaviPost`, `src/post/`): o post da Bruna vira vídeo — o card vira
  em 3D e cresce com o texto, câmera de leitura bloco a bloco, carimbo em
  "PROPOSTA:", marca-texto em "90 dias", sublinhado à mão em "garantia de
  resultado", staccato nos "sem…" e seta pulando para o "Saiba mais".
- **Notícia** (`GaviNoticia`, `src/noticia/`): layout de card de manchete — a
  manchete bate no tempo, "90" conta de 0 a 90, sublinhados se desenham, o
  artigo rola e a pílula leva um toque de dedo. O topo do card diz
  "Mentoria", não "Notícias": anúncio não se passa por reportagem.
- **Conversa** (`GaviConversa`, `src/conversa/`): o criativo de conversa (um
  dos que mais trazem lead), encenado com a copy original palavra por
  palavra — a aluna digita e o balão voa da caixa de texto, ticks de
  entregue/lido, "digitando…" e pontinhos que viram o balão da Bruna, a
  janela cresce e depois rola, "volume" riscado, marca-texto em
  "frequência", teclas 1–4 girando, "Não." carimbado e a pílula saindo de
  baixo da janela no drop. App de mensagem genérico nas cores da marca: sem
  logo, papel de parede, barra de status ou botão de ligação de app real.
  Se a conversa for encenada, rotule: prop `aviso` (ex. `"Conversa
  ilustrativa"`) — `npx remotion render GaviConversa … --props='{"tema":"escuro","aviso":"Conversa ilustrativa"}'`.

E uma peça **modelada em outro anúncio** (formato próprio, 16 s):

- **Por dentro** (`GaviPorDentro`, `src/pordentro/`): modelada no anúncio de
  diagnóstico da turaCRM — 4 blocos de 4 s trocados por rolagem vertical e
  deslize lateral, texto que entra apagado e acende, barra vertical, itens
  com alerta acendendo, retrato em perspectiva, número grande com caixa
  ("20 MINUTOS. POR DIA."), barras crescendo e cartão final em cascata. A
  oferta de lá (diagnóstico grátis) não foi copiada: o CTA é o da LP. O
  cartão final diz "Mentoria de inglês funcional" e o público ("executivos
  e profissionais de diversas áreas") aparece em destaque no gancho e no
  cartão final, com marca-texto. Origem de cada frase anotada em `copy.ts`.
  Fotos em `public/pordentro/`: **`aula.jpg` foi gerada por IA** (manifesto
  C2PA do Google no arquivo original, `trainedAlgorithmicMedia`) — troque
  por um quadro real de aula antes de veicular algo que diga "por dentro";
  `perfil.jpg` é a foto de perfil recortada acima do texto que vinha
  embutido; `retrato.jpg` sem alteração.

E um **Reels desenhado num canvas só** (43,5 s):

- **Carreira** (`GaviCarreira` e `GaviCarreiraBio`, `public/reels/`): toda a
  animação é uma função `render(ctx, t)` em JavaScript puro que desenha um
  canvas de 1080×1920; o Remotion só chama essa função quadro a quadro.
  Modelada num Reels do Pinterest que a cliente mandou: cenas pretas e
  brancas, palavra-chave em vermelho, poucas palavras por tela, objetos e
  emojis, cartão com tachinha e uma faixa curva cinza que atravessa o vídeo.
  Texto próprio, em português, para o público de 32 a 55 anos (executivos):
  "Você estuda inglês há anos. / Mas e a sua carreira? No mesmo lugar. /
  Porque inglês sem prática real é só decoreba. / E é na reunião que se
  decide a promoção. / Sem inglês funcional: … / O mercado não premia
  esforço. Premia clareza. / [Bruna] / Você já se esforça muito. Mas não do
  jeito certo. / Toque em Saiba mais e mude isso." **Cadência de leitura**: cada
  tela fica o tempo de ler (~0,3 s por palavra + entrada + um respiro), ideias
  que se contrapõem ficam na mesma tela, e a Bruna tem 7 s ("Quem conduz a
  mentoria:", foto, nome, credenciais e a oferta, uma linha de cada vez).
  Enquanto o texto fica parado, dois brilhos correm pela faixa: a tela nunca
  congela (algo muda a cada 0,3 s no máximo). O executivo (em retícula),
  a chamada de vídeo e o cartão são desenhados por código; a única foto é o
  retrato real da Bruna (`public/pordentro/retrato.jpg`). Emojis: SVGs da Noto
  (`public/emoji/`). Trilha e efeitos em Web Audio API
  (`public/reels/audio.js`), gerados no Chromium com `OfflineAudioContext` no
  ritmo das cenas (120 BPM, escura e seca). Transições com círculo que abre,
  luz branca ou zoom cruzado — nenhum corte seco. A logo é o PNG original
  recortado sem perda e desenhado 1:1 (`public/reels/logo.png`); a checagem
  compara pixel a pixel. **Dois finais**, porque Reels orgânico não tem botão:
  `GaviCarreira` diz "Toque em Saiba mais" (para turbinar/anúncio) e
  `GaviCarreiraBio` diz "Link na bio" / "Acesse o link na bio" (para só
  publicar). A versão anterior desta peça ("Call", com a bolhinha) está no
  histórico do git (commit `7692e1d`).

| | |
| --- | --- |
| Saída | `out/gavi-anuncio-24s-{claro,escuro}.mp4`, `out/gavi-{post,noticia,conversa}-24s.mp4` (720 quadros), `out/gavi-pordentro-16s.mp4` (480 quadros), `out/gavi-carreira-43s{,-linknabio}.mp4` (1305 quadros) — H.264, 1080×1920, 30 fps |
| Áudio | AAC 320 kbps, 48 kHz estéreo, −14 LUFS, pico real ≤ −1 dBTP |
| Grade | 100 BPM = 18 quadros por tempo (Por dentro e Carreira: 120 BPM = 15); cenas cortam no tempo da música |

## Rodar

```sh
cd video
npm install
npm run dev      # gera imagem + trilha e abre o Remotion Studio
npm run build    # gera tudo, renderiza as duas versões e verifica as duas
```

Só uma versão: `npm run assets && npm run render:claro` (ou `render:escuro`,
`render:post`, `render:noticia`, `render:conversa`, `render:pordentro`,
`render:carreira`, `render:carreirabio`). Checagens do canvas do Carreira (texto na área
segura em todos os quadros, logo idêntica ao arquivo): `npm run reels:check`.

O avatar das variações Post e Conversa (`public/post/avatar-bruna.png`) foi
recortado do próprio post e tem resolução baixa: troque pela foto original no
mesmo caminho.

Em máquina sem o Chrome que o Remotion baixa (CI, container), aponte um
Chromium: `REMOTION_BROWSER_EXECUTABLE=/caminho/do/headless_shell npm run build`.

## Onde editar

| Quero mudar… | Arquivo |
| --- | --- |
| Qualquer texto | `src/copy.ts` |
| Tempo de qualquer coisa | `src/timeline.ts` — cenas e eventos, em quadros |
| Cores da marca, fonte, espaçamento | `src/brand/tokens.ts` (mesmos tokens da LP) |
| Qual cor faz cada papel em cada versão | `src/brand/theme.ts` (claro/escuro) |
| Uma cena | `src/scenes/*.tsx` |
| A imagem editorial | `src/editorial/*` (seed, prédios, sala; luz em `palette.ts`) |
| Música e efeitos | `scripts/compose-audio.ts` (arranjo), `scripts/audio/*` (síntese) |
| Reels Carreira: cenas, textos, tempos (`T`), cores | `public/reels/render.js` |
| Reels Carreira: trilha e efeitos (Web Audio) | `public/reels/audio.js` — lê os tempos de `render.js` |

**Mudou texto digitado ou tempo? Rode `npm run audio`** (o `dev`/`build` já
rodam). A trilha é gerada a partir da mesma `timeline.ts` das cenas: cada
tecla soa no quadro do caractere, cada clique no quadro do clique.

## Estrutura

```
src/
  timeline.ts        fonte única de tempo (vídeo e áudio leem daqui)
  copy.ts            todo o texto
  GaviAd.tsx         composição: fundo, 9 cenas, logo/cabeçalho, trilha
  scenes/            Gancho, Missão, Pedido, Abrindo, Dossiê, Método,
                     Fechamento, CTA (o logo é o components/Brand.tsx)
  editorial/         imagem editorial procedural (cidade + sala, 2 camadas)
scripts/
  compose-audio.ts   arranjo + mix + master → public/audio/trilha.wav
  compose-variations.ts  partituras de Post, Notícia, Conversa e Por dentro → public/audio/*.wav
  audio/studio.ts    grooves, acordes, mix e master compartilhados pelas variações
                     (grade parametrizável: andamento, compasso 1, duração)
  audio/dsp.ts       osciladores, filtros, reverb, compressor, limitador,
                     medidor de loudness BS.1770
  audio/*.ts         instrumentos e efeitos
  mux.ts             junta vídeo + trilha em AAC direto no MP4
  verify.ts          checa o MP4 final (quadros, áudio, sincronia, retenção)
  preview-frames.ts  renderiza quadros avulsos para revisão
  reels/browser.ts   abre o Chromium (Playwright) servindo public/, com a Inter
  reels/audio.ts     roda audio.js no OfflineAudioContext → public/audio/carreira.wav
  reels/check.ts     checagens do canvas do Carreira (área segura, logo)
public/reels/
  render.js          o Reels Carreira inteiro: render(ctx, t) num canvas 1080×1920
  audio.js           trilha e efeitos em Web Audio API
  logo.png           logo original recortada sem perda (logo-original.png)
src/reels/ReelsAd.tsx  composição que só hospeda o canvas e chama render(t)
```

**Por que o áudio não sai direto do Remotion:** ele comprime o AAC em ADTS e
só depois mistura com o vídeo. O ADTS perde a marcação do atraso do encoder
(2048 amostras), e o áudio chegava 42,7 ms atrasado — mais de um quadro. O
`render` gera o vídeo mudo e o `mux.ts` codifica o AAC direto no MP4, onde o
atraso fica marcado para descarte. A verificação mede o desvio: 0,00 ms.

Arquivos gerados (`public/editorial/*.png`, `public/audio/trilha.*`, `out/`)
ficam fora do git: saem do código a cada `npm run assets`.

## O que a verificação mede

`npm run verify` decodifica o MP4 inteiro — não confia em metadado — e
falha se qualquer item não bater: codec, resolução, 30 fps, 720 quadros
contados um a um, duração, BT.709, faixa AAC estéreo 48 kHz, loudness,
pico real, imagem em movimento em todo segundo, ausência de buracos na
trilha, desvio A/V nos pontos de sincronia e sons caindo no quadro exato do
evento. O que é específico de cada vídeo (o congelamento de "travar", o
silêncio planejado, os cortes, as teclas) vem do `.cues.json` que a trilha
grava ao lado do WAV. Cada vídeo ganha um relatório ao lado:
`out/<nome>.verify.json`.

**Regra fixa de retenção: nunca mais de 2,5 s sem algo acontecendo.** Vale
para toda peça e a verificação mede no MP4: "evento" é, em 0,1 s, pelo menos
0,3% da tela mudar de verdade (palavra entrando, card, número, pulso,
transição); brilho de fundo que deriva devagar e textura não contam. O
relatório traz o maior intervalo sem evento. Peça com meta mais rígida põe
`maxIdle` no `.cues.json` (o Carreira usa 0,5 s). Peça sem corte seco põe
`smooth: true`: aí nenhum quadro pode trocar ≥ 30% da tela de uma vez em
relação ao anterior (uma fusão de 6 quadros fica abaixo disso; um corte, perto
de 100%).

## Regras da marca respeitadas

- Um acento só, e no máximo **um elemento vermelho por quadro** (a palavra
  "travar", o botão de enviar, "M.O.V.E." no dossiê, o CTA). Luz ambiente no
  teal, como o `.hero__glow` da LP.
- Versão clara com contraste conferido sobre o fundo: título 14,2:1, corpo
  6,9:1; o `--text-3` (3,1:1) só aparece em texto grande, no cabeçalho.
- M.O.V.E. aparece pelo nome, sem explicar pilar nenhum (regra 1).
- Sem preço, sem número, sem depoimento. Todo fato do dossiê está na LP ou
  na skill.
- CTA com o mesmo texto e destino do botão da LP ("Quero ver por dentro",
  WhatsApp com uma pessoa da equipe).

## Licenças

- Remotion: gratuito para pessoa física e empresa com até 3 funcionários;
  acima disso exige licença paga (ver `node_modules/remotion/LICENSE.md`).
- Inter e Source Serif 4 (serifada da variação Post): SIL Open Font License 1.1.
- Emoji das peças Conversa e Carreira (`public/emoji/`): SVGs da Noto Emoji (Google,
  repositório googlefonts/noto-emoji). O `LICENSE` do repositório é a OFL 1.1
  (cópia em `public/emoji/`); o README de lá cita Apache 2.0 para as imagens.
  As duas permitem uso comercial.
