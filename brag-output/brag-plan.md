# Plano — vídeo do Inglês com a Gavi

Feito com `/brag` no modo slim (Opus 5.5): história, visual, trilha e render
feitos aqui, a partir da LP deste repositório.

## Entrada

- **Projeto:** a LP do Inglês com a Gavi (`index.html`, `assets/`), com as
  regras da skill `lp-gavi`.
- **Referência enviada:** Reel `instagram.com/reel/Dd1rTdeRbyd`. O Instagram
  está bloqueado na rede deste ambiente, então o vídeo não foi visto. Pela
  busca, é um post de @leandrorezendeux sobre ferramentas de IA ("Eu não
  tenho palavras além de ABSURDO…"). Uso dele: o formato (Reel vertical),
  não o estilo.

## Respostas do briefing

- **O que é:** mentoria de inglês para adultos que travam no inglês de
  trabalho, com o Método M.O.V.E. e a Bruna Gavioli.
- **Para quem:** executivos, empresários e profissionais sêniores que travam
  na reunião, na call e na viagem de trabalho.
- **O que diferencia:** "Aqui não é escola. É mentoria." Plano montado para a
  rotina e a área de cada um, e uma conversa antes de qualquer decisão.
- **Afirmação mais forte (real):** garantia de 8 meses em contrato; mentorados
  em empresas como Caterpillar, Siemens e SAP (lista confirmada em 26/09).
- **Gancho visual:** a pergunta da LP, em tela cheia: "O inglês trava na
  reunião? na call? na viagem de trabalho?"
- **O que mostrar de real:** cards e grade do M.O.V.E. da LP, foto da Bruna,
  prints reais de mentorados, logos em cartão branco, o botão do SDR com a luz
  girando.
- **Tom:** `polished` — sóbrio, adulto, sem gíria, sem emoji (regra da LP).
- **Legenda de uma linha:** "Veja a mentoria por dentro antes de decidir."

## Ângulo

Da dor ao próximo passo, com as palavras da própria LP. O vídeo faz o que a
página faz: nomeia onde o inglês trava, mostra que é mentoria e não escola,
nomeia o método sem ensinar, mostra prova real e termina no botão do SDR.

## Regras que o vídeo segue (skill lp-gavi)

- Uma cor de acento (`#F5B642`) sobre `#0B0908`; acento cheio só no botão.
- `#FFD479` só como fim do gradiente das ênfases de título.
- Inter, pesos 400 e 800.
- M.O.V.E. só pelo nome dos pilares; nada de como funciona.
- Sem preço. Sem depoimento, número ou fala inventados.
- Logos com "Sem vínculo, patrocínio ou endosso."; prints com o aviso de
  resultados da LP.
- Botão: "Conversar no WhatsApp", com a luz girando (4s por volta) e o
  reflexo; sem pulsar, tremer ou crescer.

## Formato

1080×1920 (9:16), 30fps, 21,5s. Conteúdo dentro da área segura do Reels:
x 90–990 (até 950 na metade de baixo), y 220–1480.

## Roteiro (120 BPM: 1 compasso = 2s; cortes nos compassos)

| # | Tempo | Cena | Texto na tela | Movimento | Som |
|---|---|---|---|---|---|
| 1 | 0,0–4,0 | Gancho | "O inglês trava" + (acento) "na reunião?" → "na call?" → "na viagem de trabalho?" | Título sobe em 0,35s; a linha do acento troca como um letreiro (sai por cima, entra por baixo), cada item assentado ≥0,8s | Pad filtrado em Ré menor, chimbal leve, tique nas trocas, subida para o corte |
| 2 | 4,0–8,0 | Revelação | "Aqui não é escola." / (acento) "É mentoria." + foto da Bruna com "Bruna Gavioli · Mentora e criadora do Método M.O.V.E." | Texto sobe palavra a palavra; foto entra por máscara de baixo para cima com zoom lento | Batida entra no 4,0; acorde abre para Fá maior |
| 3 | 8,0–12,0 | Método | "O método" / "M.O.V.E." + grade 2x2: Mentalidade, Organização, Voz Ativa, Experiência Real | Cards da LP entram um a um (0,3s de intervalo) e assentam | Uma nota por pilar (Fá, Lá, Dó, Mi), no tom |
| 4 | 12,0–16,0 | Prova | "Prova real / de quem aplicou" + 3 prints em leque + "Onde nossos mentorados trabalham" + faixa de logos + avisos | Prints entram como cartas; logos correm devagar em faixa | Deslizes suaves nas cartas; subida para o CTA |
| 5 | 16,0–21,5 | CTA | "Veja por dentro." / (acento) "Depois decida." + "Direto com uma pessoa da equipe." + botão + "Garantia de 8 meses em contrato" | Botão entra e a luz gira; reflexo atravessa uma vez; fica parado para leitura | Resolve em Fá maior; acorde final soa até o fim |

Transições: a cena sai (sobe e some em ~0,25s) antes da próxima entrar —
sem fusão de dois layouts cheios.

Marca fixa no topo: "Inglês com a Gavi".

## Trilha

Composta aqui, sintetizada do zero: sem música de terceiros, então sem
questão de licença. Fá maior / Ré menor, 120 BPM. Efeitos no mesmo tom e na
mesma reverberação da música, mixados por baixo. Alvo de loudness: por volta
de -14 LUFS, pico abaixo de -1 dBTP.

## Capa

Quadro assentado mais forte (provavelmente a cena 2: rosto da Bruna + "É
mentoria."), gravado também como quadro 0 do vídeo.

## Como refazer

Pré-requisitos: `npm ci` na raiz do repositório (Playwright), `ffmpeg` e `uv`.

```bash
cd brag-output/composition
node render.mjs --stills 1,7,10.9,14.8,19.2        # conferir quadros → ../work/stills/
uv run --with numpy --with scipy python music.py  # trilha → ../work/music-raw.wav
ffmpeg -y -i ../work/music-raw.wav -af volume=0.5dB -ar 48000 -c:a pcm_s24le ../work/music.wav
node render.mjs --poster 7.2                      # vídeo, capa no quadro 0 → ../work/video.mp4
ffmpeg -y -i ../work/video.mp4 -i ../work/music.wav -map 0:v -map 1:a -c:v copy \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest ../brag.mp4
ffmpeg -y -i ../work/poster.png -q:v 2 ../brag.jpg
```

Medido na entrega: -14,0 LUFS, pico -2,4 dBFS; 645 quadros; amarelo do botão
decodificado em (244,180,68) para `#F5B642`.
