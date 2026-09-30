# Plano — Reel em capítulos (versão 2)

Refação do vídeo no formato da referência que o usuário mandou em 30/09
(trecho de um vídeo de lançamento de SaaS, "ClickMax · Funis", com a marca
d'água de @leandrorezendeux). A versão 1 continua em `brag-output/`.

## O que foi copiado do formato

- Capítulos numerados no chapéu ("01 · Para quem é") e moldura fixa: marca
  no canto, número do capítulo e traços de progresso.
- Título gigante em caixa alta, com ponto final e marca-texto no acento.
- Interface flutuando em 3D, com uma linha tracejada ligando os cards e um
  ponto que anda de um para o outro.
- Contadores que rolam até o número.
- Cartão de capítulo em tela cheia no acento ("MENTORIA.").
- Cortes rápidos (2–5s por capítulo) com câmera andando.

## O que não foi copiado (decisões do usuário em 30/09)

- **Proporção:** vertical 9:16 (a referência é horizontal).
- **Cores:** escuro com amarelo da LP (a referência é clara com verde-limão).
- **Números:** só os da LP — 14 anos como professora, 8 meses de garantia em
  contrato, 4 pilares. Nenhum contador de alunos, leads ou resultados.

Desvio consciente das regras da LP: marca-texto, selo "Em contrato" e o
cartão de capítulo usam o acento cheio fora do botão. É o formato pedido; na
página a regra continua valendo.

## Roteiro (24s, 1080×1920, 30fps, 120 BPM)

| Tempo | Capítulo | Na tela |
|---|---|---|
| 0,0–5,5 | 01 · Para quem é | "O inglês trava" + marca-texto: "na reunião." → "na call." → "na viagem de trabalho."; os 3 cards da LP em 3D acendem em sequência |
| 5,5–7,0 | Cartão | Tela amarela: "MENTORIA." / "Aqui não é escola." |
| 7,0–12,0 | 02 · O método | "M.O.V.E." + os 4 pilares ligados pela linha; toast da Bruna com contador "14 anos como professora" |
| 12,0–16,0 | 03 · Prova real | "Prova real." + 3 prints reais em leque + aviso de resultados + grade de logos com o aviso de marcas |
| 16,0–19,5 | 04 · Próximo passo | "Uma conversa." / "Antes de qualquer decisão." + os 4 passos da LP ligados pela linha |
| 19,5–24,0 | CTA | "Veja por dentro. Depois decida." + contador "8 meses de garantia" com selo "Em contrato" + botão do SDR |

Capa (quadro 0 e `brag.jpg`): o gancho em 1,6s — "O INGLÊS TRAVA / NA
REUNIÃO." com o primeiro card aceso.

## Trilha

Sintetizada do zero, sem música de terceiros. Batida desde o primeiro quadro,
parada de um tempo antes de cada corte, pancada no cartão amarelo, nota por
card aceso, tique de odômetro nos contadores, sino no botão. Os efeitos saem
de `work/events.json`, exportado da própria timeline (`window.EVENTS`).

## Como refazer

Pré-requisitos: `npm ci` na raiz do repositório (Playwright), `ffmpeg` e `uv`.

```bash
cd brag-output-2026-09-30-034032/composition
node render.mjs --stills 1.6,6.4,11.2,15.2,23.5   # conferir → ../work/stills/ (e gera ../work/events.json)
uv run --with numpy --with scipy python music.py  # trilha → ../work/music-raw.wav
ffmpeg -y -i ../work/music-raw.wav -af volume=0.5dB -ar 48000 -c:a pcm_s24le ../work/music.wav
node render.mjs --poster 1.6                      # vídeo, capa no quadro 0 → ../work/video.mp4
ffmpeg -y -i ../work/video.mp4 -i ../work/music.wav -map 0:v -map 1:a -c:v copy \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest ../brag.mp4
ffmpeg -y -i ../work/poster.png -q:v 2 ../brag.jpg
```
