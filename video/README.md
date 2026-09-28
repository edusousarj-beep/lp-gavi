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

| | |
| --- | --- |
| Saída | `out/gavi-anuncio-24s-claro.mp4` e `out/gavi-anuncio-24s-escuro.mp4` — H.264, 1080×1920, 30 fps, **720 quadros** |
| Áudio | AAC 320 kbps, 48 kHz estéreo, −14 LUFS, pico real ≤ −1 dBTP |
| Grade | 100 BPM = 18 quadros por tempo; cenas cortam no tempo da música |

## Rodar

```sh
cd video
npm install
npm run dev      # gera imagem + trilha e abre o Remotion Studio
npm run build    # gera tudo, renderiza as duas versões e verifica as duas
```

Só uma versão: `npm run assets && npm run render:claro` (ou `render:escuro`).

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
  audio/dsp.ts       osciladores, filtros, reverb, compressor, limitador,
                     medidor de loudness BS.1770
  audio/*.ts         instrumentos e efeitos
  mux.ts             junta vídeo + trilha em AAC direto no MP4
  verify.ts          checa o MP4 final (quadros, áudio, sincronia)
  preview-frames.ts  renderiza quadros avulsos para revisão
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
pico real, o congelamento da palavra "travar" (quadros 126–134 idênticos),
o silêncio planejado, ausência de buracos na trilha e o desvio A/V nos
pontos de sincronia. Cada vídeo ganha um relatório ao lado:
`out/<nome>.verify.json`.

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
- Inter: SIL Open Font License 1.1.
