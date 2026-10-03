/*
 * Inglês com a Gavi — Reels "Call" (25 s, 1080×1920, 30 fps).
 *
 * TODA a animação é desenhada num único <canvas> pela função render(ctx, t),
 * com t em segundos. Nada aqui depende de quadro anterior: qualquer instante
 * pode ser desenhado sozinho (é o que permite renderizar em paralelo).
 *
 * Roteiro aprovado (7 cenas, sem corte seco — toda troca é luz, zoom ou líquido):
 *   1  0–3 s      gancho: "Call com o time de fora em… 3 2 1"
 *   2  3–6 s      virada: "…e dessa vez quem conduz é você."
 *   3  6–9,65 s   para quem é: mentoria funcional, cards, executivos de diversas áreas
 *   4  9,65–14,6  como funciona: 20 min por dia, inglês da sua área, M.O.V.E.
 *   5  14,6–18,6  quem conduz (cena clara): Bruna Gavioli
 *   6  18,6–22    convite: "Na próxima call, quem conduz é você."
 *   7  22–25 s    final (2,5 s a partir de 22,5): logo original + chamada
 *
 * Elemento contínuo: a bolhinha "…" (vem da logo). No fim ela pousa
 * exatamente sobre a bolhinha da logo. A logo é o arquivo original,
 * recortado sem alterar pixel e desenhado em escala 1:1 — nunca redesenhada.
 *
 * Grade musical: 120 BPM → uma batida a cada 0,5 s; a trilha (audio.js) lê
 * os mesmos tempos daqui, então todo som cai no quadro do seu evento.
 */

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION = 25;
export const BPM = 120;
export const BEAT = 60 / BPM; // 0,5 s

export const COLORS = {
  petrol: '#063642', // fundo (da logo)
  navy: '#072837', // texto escuro da logo
  teal: '#1E5A66',
  aqua: '#98D9E0',
  red: '#DC2343', // vermelho vivo do "G"
  white: '#FFFFFF',
};

/* Recorte da logo (476×588, borda branca) e onde fica a bolhinha dela. */
export const LOGO = {w: 476, h: 588, left: 302, top: 560, bubble: {x: 378.5, y: 54.5, r: 30.5}};

/* Área segura: textos nunca saem daqui (longe das bordas e da interface do Reels). */
export const SAFE = {x0: 110, x1: 970, y0: 280, y1: 1470};

/* Janelas de transição (clarão, líquido, portal, luz): ali o texto está sendo coberto ou atravessado. */
export const TRANSITIONS = [
  [2.85, 3.4],
  [5.5, 6.45],
  [9.65, 10.3],
  [14.6, 15.35],
  [18.6, 19.35],
  [22.0, 22.5],
];

/* ------------------------------------------------------------- linha do tempo */

export const T = {
  // 1 · gancho
  s1: [-0.24, -0.12, -0.02, 0.08, 0.22, 0.32, 0.44], // Call com o time | de fora em… (já em cena no quadro 0)
  count: [1.0, 1.5, 2.0], // 3 · 2 · 1
  silence: [2.5, 2.75], // a música para por um instante
  drop: 3.0, // clarão + batida cheia
  // 2 · virada
  s2: [3.1, 3.22, 3.34, 3.5, 3.62, 4.0, 4.1], // …e dessa vez | quem conduz | é você.
  s2Rings: [4.5, 5.0],
  liquid1: 5.5, // mancha líquida azul-água (cobre até 6,0; revela até 6,45)
  // 3 · para quem é
  s3Title: [6.08, 6.18, 6.28, 6.42], // Mentoria de inglês | funcional
  cards: [6.5, 7.0, 7.5, 8.0],
  s3Aud: [8.1, 8.2, 8.35, 8.45, 8.62, 8.74], // para executivos | e profissionais | de diversas áreas.
  portal: 9.65, // zoom para dentro do anel (até 10,3)
  // 4 · como funciona
  ring: 10.2, // relógio se enche até 12,2
  counter: [10.3, 11.3], // 0 → 20
  s4: [11.3, 11.62, 11.72, 11.82, 12.0, 12.1], // por dia, | com o inglês | da sua área.
  s4Out: 12.6,
  method: 12.82,
  tiles: [13.0, 13.5, 14.0, 14.5], // M · O · V · E
  bloom: 14.6, // clarão para a cena clara (até 15,35)
  // 5 · quem conduz
  photo: 15.0,
  arc: 15.15,
  s5: [15.55, 15.68, 16.3, 16.38, 16.46, 16.56, 17.0, 17.08, 17.16, 17.24, 17.32],
  liquid2: 18.6, // mancha escura (cobre até 19,0; revela até 19,35)
  // 6 · convite
  s6: [19.3, 19.4, 19.52, 19.8, 19.95, 20.3, 20.42],
  s6Rings: [21.0, 21.5],
  grow: 21.85, // a bolhinha cresce e brilha
  flood: 22.0, // luz branca toma a tela (até 22,5)
  // 7 · final
  final: 22.5,
  land: 23.0, // a bolhinha pousa na logo
  cta: [23.1, 23.22, 23.34],
  ctaPulses: [23.5, 24.0, 24.5],
};

/** Instantes em que o contador 0→20 muda de número (a trilha toca um tique em cada). */
export function counterTimes() {
  const [a, b] = T.counter;
  const out = [];
  for (let k = 1; k <= 20; k++) {
    const y = k / 20; // easeOut(p) = y  →  p = 1 − (1 − y)^(1/3)
    out.push(a + (b - a) * (1 - Math.cbrt(1 - y)));
  }
  return out;
}

/* ------------------------------------------------------------------ util */

const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, start, dur) => clamp((t - start) / dur);
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeIn = (x) => x * x * x;
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** Seno ida e volta: inclinação máxima π/2 — usada nas transições de tela inteira. */
const sineInOut = (x) => 0.5 - 0.5 * Math.cos(Math.PI * x);
/** Distância de um ponto até o canto da tela mais distante. */
const reach = (x, y) => Math.max(Math.hypot(x, y), Math.hypot(W - x, y), Math.hypot(x, H - y), Math.hypot(W - x, H - y));
const easeOutBack = (x) => {
  const s = 1.70158;
  return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
};
/** Pulso 0→1→0 que dura `dur` a partir de `at`. */
const bump = (t, at, dur = 0.3) => (t >= at && t < at + dur ? Math.sin((Math.PI * (t - at)) / dur) : 0);

/** Mistura duas cores hex (k = 0 → a, 1 → b) com alpha. */
function mixColor(a, b, k, alpha) {
  const p = (hex) => [(parseInt(hex.slice(1), 16) >> 16) & 255, (parseInt(hex.slice(1), 16) >> 8) & 255, parseInt(hex.slice(1), 16) & 255];
  const [r1, g1, b1] = p(a);
  const [r2, g2, b2] = p(b);
  const c = (x, y) => Math.round(lerp(x, y, k));
  return `rgba(${c(r1, r2)}, ${c(g1, g2)}, ${c(b1, b2)}, ${clamp(alpha).toFixed(4)})`;
}

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** PRNG determinístico (mulberry32): mesmo seed, mesmo quadro, sempre. */
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Batida da música: 1 no tempo, decaindo. Para no silêncio; meio tempo na cena clara. */
function beatEnv(t) {
  if (t >= T.silence[0] && t < T.drop) return 0;
  if (t < T.count[0]) return 0.5 * Math.exp(-(t % BEAT) / 0.12);
  const half = t >= 15.0 && t < 19.0;
  const period = half ? 2 * BEAT : BEAT;
  return Math.exp(-(t % period) / 0.13);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function camera(ctx, cx, cy, s, fn) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.translate(-cx, -cy);
  fn();
  ctx.restore();
}

/* --------------------------------------------------------------- a cena */

/**
 * createScene({logo, photo, cta}) → { render(ctx, t) }
 *   logo:  imagem do recorte da logo (476×588)
 *   photo: retrato da Bruna
 *   cta:   'saibamais' (anúncio/turbinado) ou 'linknabio' (só publicar)
 *   debug: { boxes: [] } recebe a caixa de cada texto desenhado (checagem de bordas)
 */
export function createScene({logo, photo, cta = 'saibamais', debug = null, makeCanvas = defaultCanvas}) {
  const grain = makeGrain(makeCanvas);
  const specks = makeSpecks();

  function render(ctx, tIn) {
    const t = clamp(tIn, 0, DURATION - 1e-6);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    let grainAmt = 0.085;

    if (t < T.drop) {
      bgDark(ctx, t);
      scene1(ctx, t);
      flash(ctx, t);
    } else if (t < T.liquid1) {
      bgDark(ctx, t);
      scene2(ctx, t);
      flash(ctx, t);
    } else if (t < T.liquid1 + 0.5) {
      bgDark(ctx, t);
      scene2(ctx, t);
      liquidCover(ctx, t, bubbleAt(t), prog(t, T.liquid1, 0.5), COLORS.aqua, COLORS.teal, 11);
    } else if (t < T.liquid1 + 0.95) {
      bgDark(ctx, t);
      scene3(ctx, t);
      liquidReveal(ctx, t, {x: 540, y: 560}, prog(t, T.liquid1 + 0.5, 0.45), COLORS.aqua, COLORS.teal, 11);
    } else if (t < T.portal) {
      bgDark(ctx, t);
      scene3(ctx, t);
    } else if (t < T.portal + 0.65) {
      portal(ctx, t);
    } else if (t < T.bloom) {
      bgDark(ctx, t);
      scene4(ctx, t);
    } else if (t < T.bloom + 0.4) {
      bgDark(ctx, t);
      scene4(ctx, t);
      whiteBloom(ctx, bubbleAt(t), prog(t, T.bloom, 0.4));
    } else if (t < T.liquid2) {
      bgLight(ctx, t);
      scene5(ctx, t);
      const fade = 1 - prog(t, T.bloom + 0.4, 0.35);
      if (fade > 0) fillAll(ctx, rgba(COLORS.white, fade));
      grainAmt = 0.05;
    } else if (t < T.liquid2 + 0.4) {
      bgLight(ctx, t);
      scene5(ctx, t);
      liquidCover(ctx, t, bubbleAt(t), prog(t, T.liquid2, 0.4), '#0A4552', '#04212B', 23);
      grainAmt = 0.05 + 0.035 * prog(t, T.liquid2, 0.4);
    } else if (t < T.liquid2 + 0.75) {
      bgDark(ctx, t);
      scene6(ctx, t);
      liquidReveal(ctx, t, {x: 540, y: 920}, prog(t, T.liquid2 + 0.4, 0.35), '#0A4552', '#04212B', 23);
    } else if (t < T.flood) {
      bgDark(ctx, t);
      scene6(ctx, t);
    } else if (t < T.final) {
      bgDark(ctx, t);
      scene6(ctx, t);
      whiteBloom(ctx, bubbleAt(t), prog(t, T.flood, 0.5));
      grainAmt = 0.085 * (1 - prog(t, T.flood, 0.5));
    } else {
      bgFinal(ctx, t);
      grainAmt = 0;
    }

    if (grainAmt > 0.001) applyGrain(ctx, grain, grainAmt);
    if (t >= T.final) scene7(ctx, t); // a logo fica fora do grão: pixels intactos
    drawBubble(ctx, t, bubbleAt(t));
    ctx.restore();
  }

  /* ----------------------------------------------------------- fundos */

  function bgDark(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#073742');
    g.addColorStop(0.55, '#052C36');
    g.addColorStop(1, '#031A21');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const p = beatEnv(t);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    glow(ctx, 300 + 130 * Math.sin(t * 0.31), 420 + 90 * Math.cos(t * 0.27), 680, COLORS.teal, 0.62 + 0.12 * p);
    glow(ctx, 860 + 90 * Math.sin(t * 0.23 + 1), 1320 + 140 * Math.sin(t * 0.19), 780, COLORS.aqua, 0.15 + 0.07 * p);
    glow(ctx, 120 + 80 * Math.cos(t * 0.21), 1660, 560, COLORS.teal, 0.5);
    glow(ctx, 840, 250 + 60 * Math.sin(t * 0.4), 440, COLORS.aqua, 0.1 + 0.06 * p);
    ctx.restore();

    // anéis finos de luz e um pulso que se abre a cada batida
    ring(ctx, 905, 330, 390 + 12 * Math.sin(t * 0.5), rgba(COLORS.aqua, 0.07), 2);
    ring(ctx, 150, 1520, 540 + 10 * Math.cos(t * 0.4), rgba(COLORS.aqua, 0.05), 2);
    const ph = (t % BEAT) / BEAT;
    if (beatEnv(t) > 0.01 && t >= T.count[0]) ring(ctx, 540, 960, 260 + 640 * easeOut(ph), rgba(COLORS.aqua, 0.05 * (1 - ph)), 3);

    drawSpecks(ctx, t, specks, COLORS.aqua);

    const v = ctx.createRadialGradient(540, 900, 320, 540, 900, 1300);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  function bgLight(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(1, '#EAF6F8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const p = beatEnv(t);
    glow(ctx, 120 + 60 * Math.sin(t * 0.4), 260, 640, COLORS.aqua, 0.42 + 0.08 * p);
    glow(ctx, 980, 1600 + 60 * Math.cos(t * 0.33), 760, COLORS.aqua, 0.38 + 0.08 * p);
    glow(ctx, 900, 380, 420, COLORS.teal, 0.08);
    ring(ctx, 920, 300, 360 + 10 * Math.sin(t * 0.6), rgba(COLORS.teal, 0.08), 2);
    ring(ctx, 140, 1560, 480, rgba(COLORS.teal, 0.07), 2);
  }

  /* Final: branco puro onde a logo fica (o fundo dela é branco); luz só nos cantos. */
  function bgFinal(ctx, t) {
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(0, 0, W, H);
    const p = beatEnv(t);
    const breathe = 0.5 + 0.5 * Math.sin((t - T.final) * 2.2);
    glow(ctx, -40, -40, 560, COLORS.aqua, 0.5 + 0.1 * breathe + 0.08 * p);
    glow(ctx, 1120, 1960, 680, COLORS.aqua, 0.48 + 0.1 * (1 - breathe) + 0.08 * p);
    ring(ctx, 1040, 1820, 300 + 14 * breathe, rgba(COLORS.teal, 0.09), 2);
    ring(ctx, 40, 140, 240 + 14 * (1 - breathe), rgba(COLORS.teal, 0.08), 2);
  }

  /* ----------------------------------------------------------- cena 1 */

  function scene1(ctx, t) {
    const breath = easeInOut(prog(t, T.silence[0], 0.45));
    const push = (1 + 0.035 * prog(t, 0, 2.5)) * (1 - 0.04 * breath);
    camera(ctx, 540, 900, push, () => {
      const w = T.s1;
      line(ctx, t, {y: 650, size: 86, words: [{text: 'Call', at: w[0], hl: true}, {text: 'com', at: w[1]}, {text: 'o', at: w[2]}, {text: 'time', at: w[3]}]});
      line(ctx, t, {y: 752, size: 86, words: [{text: 'de', at: w[4]}, {text: 'fora', at: w[5]}, {text: 'em…', at: w[6]}]});
      countdown(ctx, t, breath);
    });
  }

  function countdown(ctx, t, breath) {
    const cx = 540;
    const cy = 1060;
    // anel do cronômetro: aparece antes do "3" e esvazia a cada meio segundo
    const ringIn = easeOut(prog(t, 0.45, 0.5));
    if (ringIn > 0) {
      ctx.save();
      ctx.globalAlpha *= ringIn;
      ring(ctx, cx, cy, 230, rgba(COLORS.white, 0.1), 10);
      let frac = 1;
      if (t >= T.count[0]) frac = t < T.silence[0] ? 1 - ((t - T.count[0]) % BEAT) / BEAT : 0;
      else frac = ringIn;
      ctx.lineCap = 'round';
      ctx.shadowColor = COLORS.aqua;
      ctx.shadowBlur = 26;
      ctx.strokeStyle = COLORS.aqua;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, 230, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0.0001, frac));
      ctx.stroke();
      ctx.restore();
    }
    ['3', '2', '1'].forEach((d, i) => {
      const at = T.count[i];
      const next = T.count[i + 1];
      if (t < at - 0.02) return;
      const p = easeOut(prog(t, at, 0.24));
      let scale = lerp(1.75, 1, p);
      let alpha = p;
      let blur = (1 - p) * 18;
      if (next !== undefined) {
        const q = easeIn(prog(t, next - 0.02, 0.2));
        scale *= lerp(1, 1.45, q);
        alpha *= 1 - q;
        blur += q * 14;
      } else {
        scale *= 1 - 0.08 * breath;
      }
      if (alpha <= 0.003) return;
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.font = '800 400px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.white;
      ctx.shadowColor = rgba(COLORS.aqua, 0.85);
      ctx.shadowBlur = 40 + 30 * (1 - p);
      if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(2)}px)`;
      ctx.fillText(d, 0, 145);
      ctx.restore();
      record(ctx, cx - 125 * scale, cy - 150 * scale, cx + 125 * scale, cy + 150 * scale, t);
    });
  }

  /* Clarão do drop: a luz nasce no "1" no fim do silêncio, toma a tela com o swell,
     pico no drop (3,0 s) e abre a cena 2 em 0,45 s; um anel de luz se expande.
     Cada pixel clareia ao longo de ~7 quadros: nenhum quadro carrega o salto sozinho. */
  const FLASH = {x: 540, y: 1000, up: 0.35, spread: 0.35};
  function flash(ctx, t) {
    const up = prog(t, T.drop - FLASH.up, FLASH.up);
    const down = Math.pow(1 - prog(t, T.drop, 0.45), 1.7);
    if (t < T.drop - FLASH.up || (t >= T.drop && down < 0.002)) {
      // nada
    } else {
      const sorted = screenDistances(FLASH.x, FLASH.y);
      const D = reach(FLASH.x, FLASH.y) + 2;
      const g = ctx.createRadialGradient(FLASH.x, FLASH.y, 0, FLASH.x, FLASH.y, D);
      const M = 20;
      for (let j = 0; j <= M; j++) {
        const d = quantile(sorted, j / M);
        // perfil do pico: branco no centro, puxando para o aqua na borda
        const u = d / 1400;
        const edge = clamp((u - 0.6) / 0.4);
        const peak = u < 0.6 ? lerp(0.96, 0.883, u / 0.6) : lerp(0.883, 0.672, edge);
        const k = t < T.drop ? clamp((up - (FLASH.spread * j) / M) / (1 - FLASH.spread)) : down;
        g.addColorStop(Math.min(1, d / D), mixColor(COLORS.white, COLORS.aqua, edge, peak * k));
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    const r = prog(t, T.drop - 0.1, 0.45);
    if (r > 0 && r < 1) {
      ctx.save();
      ctx.strokeStyle = rgba(COLORS.white, 0.9 * (1 - r));
      ctx.shadowColor = COLORS.aqua;
      ctx.shadowBlur = 40;
      ctx.lineWidth = lerp(36, 3, r);
      ctx.beginPath();
      ctx.arc(540, 1000, lerp(60, 1500, easeOut(r)), 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ----------------------------------------------------------- cena 2 */

  function scene2(ctx, t) {
    const z = 1.2 - 0.2 * easeOut(prog(t, T.drop, 0.7));
    const push = 1 + 0.03 * prog(t, 3.7, 2.3);
    const w = T.s2;
    camera(ctx, 540, 860, z * push, () => {
      line(ctx, t, {y: 700, size: 84, words: [{text: '…e', at: w[0]}, {text: 'dessa', at: w[1]}, {text: 'vez', at: w[2]}]});
      line(ctx, t, {y: 832, size: 106, words: [{text: 'quem', at: w[3]}, {text: 'conduz', at: w[4]}]});
      line(ctx, t, {y: 1010, size: 142, words: [{text: 'é', at: w[5]}, {text: 'você.', at: w[6], hl: true}]});
      T.s2Rings.forEach((at) => pulseRing(ctx, t, at, 600, 955));
    });
  }

  /* ----------------------------------------------------------- cena 3 */

  const CARDS = [
    {text: 'Reunião', x: 140, y: 680, w: 350},
    {text: 'Call', x: 600, y: 720, w: 270},
    {text: 'Entrevista', x: 210, y: 852, w: 390},
    {text: 'Viagem de trabalho', x: 320, y: 1010, w: 560},
  ];

  function scene3(ctx, t) {
    const push = 1 + 0.03 * prog(t, T.liquid1 + 0.5, 3.6);
    const a = T.s3Title;
    const b = T.s3Aud;
    camera(ctx, 540, 900, push, () => {
      line(ctx, t, {y: 458, size: 76, words: [{text: 'Mentoria', at: a[0]}, {text: 'de', at: a[1]}, {text: 'inglês', at: a[2]}]});
      line(ctx, t, {y: 575, size: 96, words: [{text: 'funcional', at: a[3], hl: true}]});
      CARDS.forEach((c, i) => glassCard(ctx, t, c, T.cards[i]));
      line(ctx, t, {y: 1222, size: 64, words: [{text: 'para', at: b[0]}, {text: 'executivos', at: b[1]}]});
      line(ctx, t, {y: 1304, size: 64, words: [{text: 'e', at: b[2]}, {text: 'profissionais', at: b[3]}]});
      line(ctx, t, {y: 1396, size: 66, words: [{text: 'de', at: b[4]}, {text: 'diversas áreas.', at: b[5], hl: true}]});
    });
  }

  function glassCard(ctx, t, c, at) {
    const p = prog(t, at, 0.42);
    if (p <= 0) return;
    const e = easeOutBack(p);
    const h = 112;
    const bob = Math.sin((t - at) * 2.1 + c.x * 0.01) * 6;
    ctx.save();
    ctx.globalAlpha *= clamp(p * 2.2);
    const cx = c.x + c.w / 2;
    const cy = c.y + h / 2 + bob;
    ctx.translate(cx, cy);
    ctx.scale(lerp(0.75, 1, e), lerp(0.75, 1, e));
    ctx.translate(-c.w / 2, -h / 2);
    if (p < 1) ctx.filter = `blur(${((1 - easeOut(p)) * 10).toFixed(2)}px)`;
    glass(ctx, 0, 0, c.w, h, 28);
    // ponto de luz + texto
    const dot = 0.6 + 0.4 * beatEnv(t);
    ctx.fillStyle = rgba(COLORS.aqua, dot);
    ctx.shadowColor = COLORS.aqua;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(46, h / 2, 9, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '700 44px Inter, Arial, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.fillText(c.text, 76, h / 2 + 16);
    ctx.restore();
    record(ctx, c.x, c.y + bob, c.x + c.w, c.y + h + bob, t);
  }

  function glass(ctx, x, y, w, h, r) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 18;
    roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, x, y, w, h, r);
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, 'rgba(255,255,255,0.20)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, rgba(COLORS.aqua, 0.12));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.stroke();
    ctx.restore();
  }

  /* --------------------------------------------- portal (cena 3 → cena 4) */

  function portal(ctx, t) {
    const p = easeInOut(prog(t, T.portal, 0.65));
    bgDark(ctx, t);
    ctx.save();
    ctx.globalAlpha *= 1 - p;
    camera(ctx, 540, 700, 1 + 1.7 * p, () => scene3(ctx, t));
    ctx.restore();
    const R = lerp(0, 1500, easeIn(prog(t, T.portal + 0.1, 0.55)));
    if (R > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(540, 700, R, 0, TAU);
      ctx.clip();
      bgDark(ctx, t);
      scene4(ctx, t);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = rgba(COLORS.aqua, 0.95);
      ctx.shadowColor = COLORS.aqua;
      ctx.shadowBlur = 50;
      ctx.lineWidth = lerp(18, 3, prog(t, T.portal + 0.1, 0.55));
      ctx.beginPath();
      ctx.arc(540, 700, R, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ----------------------------------------------------------- cena 4 */

  function scene4(ctx, t) {
    const push = 1 + 0.03 * prog(t, T.ring, 4.4);
    const out = easeInOut(prog(t, T.s4Out, 0.3));
    camera(ctx, 540, 900, push, () => {
      if (out < 1) {
        ctx.save();
        ctx.globalAlpha *= 1 - out;
        ctx.translate(0, -140 * out);
        clock(ctx, t);
        const w = T.s4;
        line(ctx, t, {y: 1088, size: 84, words: [{text: 'por', at: w[0]}, {text: 'dia,', at: w[0] + 0.1}]});
        line(ctx, t, {y: 1190, size: 70, words: [{text: 'com', at: w[1]}, {text: 'o', at: w[2]}, {text: 'inglês', at: w[3]}]});
        line(ctx, t, {y: 1296, size: 80, words: [{text: 'da', at: w[4]}, {text: 'sua área.', at: w[5], hl: true}]});
        ctx.restore();
      }
      if (t >= T.method - 0.05) method(ctx, t);
    });
  }

  function clock(ctx, t) {
    const cx = 540;
    const cy = 700;
    const r = 250;
    const inA = easeOut(prog(t, T.ring - 0.25, 0.4));
    if (inA <= 0) return;
    ctx.save();
    ctx.globalAlpha *= inA;
    ring(ctx, cx, cy, r, rgba(COLORS.white, 0.1), 16);
    for (let k = 0; k < 20; k++) {
      const a = -Math.PI / 2 + (TAU * k) / 20;
      const lit = prog(t, T.ring, 2.0) * 20 > k;
      ctx.strokeStyle = lit ? rgba(COLORS.aqua, 0.9) : rgba(COLORS.white, 0.18);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (r - 34), cy + Math.sin(a) * (r - 34));
      ctx.lineTo(cx + Math.cos(a) * (r - 52), cy + Math.sin(a) * (r - 52));
      ctx.stroke();
    }
    const f = easeInOut(prog(t, T.ring, 2.0));
    if (f > 0) {
      ctx.lineCap = 'round';
      ctx.shadowColor = COLORS.aqua;
      ctx.shadowBlur = 30;
      ctx.strokeStyle = COLORS.aqua;
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * f);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    const n = Math.round(20 * easeOut(prog(t, T.counter[0], T.counter[1] - T.counter[0])));
    const pop = bump(t, T.counter[1], 0.3);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.white;
    ctx.font = `800 ${Math.round(230 * (1 + 0.08 * pop))}px Inter, Arial, sans-serif`;
    ctx.fillText(String(n), cx, cy + 70);
    ctx.font = '700 54px Inter, Arial, sans-serif';
    ctx.fillStyle = COLORS.aqua;
    ctx.fillText('minutos', cx, cy + 150);
    ctx.restore();
    record(ctx, cx - 140, cy - 100, cx + 140, cy + 160, t);
  }

  function method(ctx, t) {
    const inA = easeOut(prog(t, T.method, 0.35));
    ctx.save();
    ctx.globalAlpha *= inA;
    ctx.translate(0, 70 * (1 - inA));
    line(ctx, t, {y: 722, size: 64, words: [{text: 'Método', at: T.method}]});
    ['M', 'O', 'V', 'E'].forEach((L, i) => {
      const x = 175 + i * 190;
      const y = 772;
      const w = 160;
      const h = 200;
      const lit = easeOut(prog(t, T.tiles[i], 0.22));
      const pop = bump(t, T.tiles[i], 0.32);
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.scale(1 + 0.08 * pop, 1 + 0.08 * pop);
      ctx.translate(-w / 2, -h / 2);
      glass(ctx, 0, 0, w, h, 26);
      if (lit > 0) {
        ctx.save();
        ctx.globalAlpha *= lit;
        roundRect(ctx, 0, 0, w, h, 26);
        ctx.fillStyle = COLORS.red;
        ctx.shadowColor = COLORS.red;
        ctx.shadowBlur = 40;
        ctx.fill();
        ctx.restore();
      }
      ctx.font = '800 124px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(COLORS.white, 0.35 + 0.65 * lit);
      ctx.fillText(L, w / 2, h / 2 + 45);
      ctx.restore();
      record(ctx, x, y, x + w, y + h, t);
    });
    ctx.restore();
  }

  /* ----------------------------------------------------------- cena 5 (clara) */

  function scene5(ctx, t) {
    const push = 1 + 0.03 * prog(t, T.photo, 3.6);
    camera(ctx, 540, 900, push, () => {
      portrait(ctx, t);
      const w = T.s5;
      line(ctx, t, {y: 1182, size: 70, color: COLORS.navy, words: [{text: 'Com', at: w[0]}, {text: 'Bruna Gavioli,', at: w[1], hl: true}]});
      line(ctx, t, {y: 1276, size: 46, weight: 700, color: COLORS.navy, words: [{text: 'criadora', at: w[2]}, {text: 'do', at: w[3]}, {text: 'método', at: w[4]}, {text: 'M.O.V.E.', at: w[5]}]});
      line(ctx, t, {y: 1342, size: 40, weight: 400, color: COLORS.teal, words: [{text: 'especialista', at: w[6]}, {text: 'em', at: w[7]}, {text: 'inglês', at: w[8]}, {text: 'para', at: w[9]}, {text: 'adultos.', at: w[10]}]});
    });
  }

  function portrait(ctx, t) {
    const cx = 540;
    const cy = 770;
    const r = 250;
    const inP = easeOut(prog(t, T.photo, 0.5));
    if (inP <= 0) return;
    ctx.save();
    ctx.globalAlpha *= inP;
    // sombra suave + foto recortada no círculo
    ctx.save();
    ctx.shadowColor = rgba(COLORS.teal, 0.35);
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 24;
    ctx.beginPath();
    ctx.arc(cx, cy, r * lerp(0.86, 1, inP), 0, TAU);
    ctx.fillStyle = COLORS.white;
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r * lerp(0.86, 1, inP), 0, TAU);
    ctx.clip();
    if (photo) {
      const kb = lerp(1.1, 1.0, easeOut(prog(t, T.photo, 3.6)));
      const s = 0.9 * kb;
      const fw = photo.width * s;
      const fh = photo.height * s;
      // rosto (~x 400, y 285 no retrato) no centro do círculo
      ctx.drawImage(photo, cx - 400 * s, cy - 285 * s, fw, fh);
    }
    ctx.restore();
    // arco de luz se desenhando + anel fino girando
    const a = easeInOut(prog(t, T.arc, 1.0));
    if (a > 0) {
      ctx.save();
      const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      g.addColorStop(0, COLORS.teal);
      g.addColorStop(1, COLORS.aqua);
      ctx.strokeStyle = g;
      ctx.lineCap = 'round';
      ctx.lineWidth = 14;
      ctx.shadowColor = COLORS.aqua;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 30, -Math.PI * 0.8, -Math.PI * 0.8 + TAU * 0.78 * a);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.setLineDash([4, 18]);
    ctx.lineDashOffset = -t * 40;
    ring(ctx, cx, cy, r + 62, rgba(COLORS.teal, 0.35), 3);
    ctx.restore();
    ctx.restore();
  }

  /* ----------------------------------------------------------- cena 6 */

  function scene6(ctx, t) {
    const z = 1.15 - 0.15 * easeOut(prog(t, T.liquid2 + 0.4, 0.6));
    const push = 1 + 0.03 * prog(t, 19.4, 2.6);
    const w = T.s6;
    camera(ctx, 540, 900, z * push, () => {
      line(ctx, t, {y: 772, size: 82, words: [{text: 'Na', at: w[0]}, {text: 'próxima', at: w[1]}, {text: 'call,', at: w[2]}]});
      line(ctx, t, {y: 902, size: 102, words: [{text: 'quem', at: w[3]}, {text: 'conduz', at: w[4]}]});
      line(ctx, t, {y: 1066, size: 132, words: [{text: 'é', at: w[5]}, {text: 'você.', at: w[6], hl: true}]});
      T.s6Rings.forEach((at) => pulseRing(ctx, t, at, 590, 1015));
    });
  }

  /* ----------------------------------------------------------- cena 7 (final) */

  function scene7(ctx, t) {
    const a = easeOut(prog(t, T.final, 0.45));
    const s = lerp(0.94, 1, a);
    if (a >= 1) {
      // 1:1, coordenadas inteiras, sem suavização: os pixels do arquivo, intactos.
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(logo, LOGO.left, LOGO.top);
      ctx.restore();
    } else if (a > 0) {
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.translate(LOGO.left + LOGO.w / 2, LOGO.top + LOGO.h / 2);
      ctx.scale(s, s);
      ctx.drawImage(logo, -LOGO.w / 2, -LOGO.h / 2);
      ctx.restore();
    }
    const c = T.cta;
    const words =
      cta === 'linknabio'
        ? [{text: 'Acesse', at: c[0]}, {text: 'o', at: c[1]}, {text: 'link na bio', at: c[2], hl: true, pulses: T.ctaPulses}]
        : [{text: 'Toque', at: c[0]}, {text: 'em', at: c[1]}, {text: 'Saiba mais', at: c[2], hl: true, pulses: T.ctaPulses}];
    line(ctx, t, {y: 1300, size: 64, color: COLORS.navy, words});
  }

  /* ----------------------------------------------------------- bolhinha */

  // [t, x, y, raio, salto]
  const BUB = [
    [-0.3, 540, 470, 0],
    [0.08, 540, 470, 46],
    [2.5, 540, 470, 46],
    [2.92, 540, 505, 40],
    [3.65, 885, 935, 46],
    [5.45, 885, 935, 46],
    [6.5, 476, 662, 42, 110],
    [7.0, 850, 702, 42, 90],
    [7.5, 586, 834, 42, 90],
    [8.0, 866, 992, 42, 90],
    [8.85, 912, 1296, 40, 70],
    [9.62, 912, 1296, 40],
    [10.2, 540, 450, 40],
    [12.2, 540, 450, 40],
    [12.98, 255, 714, 40, 90],
    [13.5, 445, 714, 40, 70],
    [14.0, 635, 714, 40, 70],
    [14.5, 825, 714, 40, 70],
    [14.62, 825, 714, 40],
    [15.55, 806, 540, 46],
    [18.58, 806, 540, 46],
    [19.75, 885, 990, 46],
    [21.85, 885, 990, 46],
    [22.15, 540, 760, 86],
    [22.55, 610, 690, 64],
    [T.land, LOGO.left + LOGO.bubble.x, LOGO.top + LOGO.bubble.y, LOGO.bubble.r],
  ];

  function bubbleAt(t) {
    // órbita no relógio da cena 4: a bolhinha é a ponta que enche o anel
    if (t >= T.ring && t < T.ring + 2.0) {
      const th = -Math.PI / 2 + TAU * easeInOut(prog(t, T.ring, 2.0));
      return {x: 540 + 250 * Math.cos(th), y: 700 + 250 * Math.sin(th), r: 40, alpha: 1, glow: 0.8};
    }
    let i = 0;
    while (i < BUB.length - 1 && t >= BUB[i + 1][0]) i++;
    const k0 = BUB[i];
    const k1 = BUB[Math.min(i + 1, BUB.length - 1)];
    let x = k0[1];
    let y = k0[2];
    let r = k0[3];
    if (k1 !== k0 && t >= k0[0]) {
      const p = easeInOut(prog(t, k0[0], k1[0] - k0[0]));
      x = lerp(k0[1], k1[1], p);
      y = lerp(k0[2], k1[2], p) - (k1[4] || 0) * Math.sin(Math.PI * p);
      r = lerp(k0[3], k1[3], p);
    }
    if (t < BUB[0][0]) r = 0;
    // pulsa nos números da contagem
    T.count.forEach((at) => (r *= 1 + 0.16 * bump(t, at, 0.25)));
    const onLight = (t >= T.bloom + 0.4 && t < T.liquid2 + 0.4) || t >= T.final;
    const grow = prog(t, T.grow, 0.3) * (1 - prog(t, T.final, 0.5));
    const alpha = 1 - prog(t, T.land, 0.12);
    return {x, y, r, alpha, glow: onLight ? 0.15 + grow : 0.8 + 1.2 * grow};
  }

  function drawBubble(ctx, t, b) {
    if (b.alpha <= 0.003 || b.r <= 0.5) return;
    ctx.save();
    ctx.globalAlpha *= b.alpha;
    if (b.glow > 0.01) {
      glow(ctx, b.x, b.y, b.r * 3.2, COLORS.aqua, 0.35 * b.glow);
    }
    const {x, y, r} = b;
    const lw = Math.max(2.5, r * 0.19);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    // rabinho (embaixo, à esquerda), como o da bolhinha da logo
    ctx.moveTo(x - r * 0.62, y + r * 0.78);
    ctx.lineTo(x - r * 0.98, y + r * 1.22);
    ctx.lineTo(x - r * 0.18, y + r * 0.98);
    ctx.fillStyle = COLORS.white;
    ctx.fill();
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = COLORS.navy;
    // contorno contínuo: arco de uma base do rabinho à outra, passando pela ponta
    ctx.beginPath();
    ctx.arc(x, y, r, Math.atan2(0.78, -0.62), Math.atan2(0.98, -0.18) + TAU);
    ctx.lineTo(x - r * 0.98, y + r * 1.22);
    ctx.closePath();
    ctx.stroke();
    // três pontinhos: uma onda a cada batida (param no silêncio)
    const phase = ((t % BEAT) + BEAT) % BEAT;
    const silent = t >= T.silence[0] && t < T.drop;
    for (let k = 0; k < 3; k++) {
      const local = phase - k * 0.07;
      const wave = !silent && local >= 0 && local < 0.22 ? Math.sin((Math.PI * local) / 0.22) : 0;
      ctx.fillStyle = COLORS.navy;
      ctx.globalAlpha = b.alpha * (0.55 + 0.45 * wave);
      ctx.beginPath();
      ctx.arc(x + (k - 1) * r * 0.42, y - wave * r * 0.18, r * 0.13 * (1 + 0.25 * wave), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ----------------------------------------------------------- texto */

  /**
   * Uma linha de texto que entra palavra por palavra (sobe, desfoca → nítido).
   * A palavra com hl:true é a principal: entra numa caixa vermelha que se desenha.
   */
  function line(ctx, t, s) {
    const {x = 540, y, size, weight = 800, color = COLORS.white, words, dur = 0.34} = s;
    ctx.save();
    ctx.font = `${weight} ${size}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'left';
    const space = size * 0.27;
    const pad = size * 0.17;
    const ws = words.map((w) => ({...w, width: ctx.measureText(w.text).width}));
    const total = ws.reduce((acc, w) => acc + w.width + (w.hl ? 2 * pad : 0), 0) + space * (ws.length - 1);
    let cx = x - total / 2;
    for (const w of ws) {
      const full = w.width + (w.hl ? 2 * pad : 0);
      const p = prog(t, w.at, dur);
      if (p > 0) {
        const e = easeOut(p);
        const rise = (1 - e) * size * 0.42;
        const blur = (1 - e) * 12;
        if (w.hl) {
          const q = easeOut(prog(t, w.at + 0.05, 0.3));
          let pulse = 0;
          (w.pulses || []).forEach((at) => (pulse = Math.max(pulse, bump(t, at, 0.3))));
          const bx = cx;
          const by = y - size * 0.86;
          const bw = full;
          const bh = size * 1.12;
          ctx.save();
          ctx.translate(bx + bw / 2, by + bh / 2);
          ctx.scale(1 + 0.06 * pulse, 1 + 0.06 * pulse);
          ctx.translate(-(bx + bw / 2), -(by + bh / 2));
          ctx.save();
          ctx.globalAlpha *= clamp(e * 1.5);
          ctx.shadowColor = rgba(COLORS.red, 0.55);
          ctx.shadowBlur = 30 + 30 * pulse;
          roundRect(ctx, bx, by, Math.max(1, bw * q), bh, size * 0.14);
          ctx.fillStyle = COLORS.red;
          ctx.fill();
          ctx.restore();
          drawWord(ctx, w.text, cx + pad, y + rise, e, blur, COLORS.white);
          ctx.restore();
        } else {
          drawWord(ctx, w.text, cx, y + rise, e, blur, color);
        }
        if (e > 0.05) record(ctx, cx, y - size * 0.9, cx + full, y + size * 0.3, t);
      }
      cx += full + space;
    }
    ctx.restore();
  }

  function drawWord(ctx, text, x, y, alpha, blur, color) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(2)}px)`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /* Anel de luz que se abre a partir de um ponto (pulsos no tempo). */
  function pulseRing(ctx, t, at, x, y) {
    const p = prog(t, at, 0.5);
    if (p <= 0 || p >= 1) return;
    ctx.save();
    ctx.strokeStyle = rgba(COLORS.aqua, 0.5 * (1 - p));
    ctx.lineWidth = lerp(10, 2, p);
    ctx.shadowColor = COLORS.aqua;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(x, y, lerp(120, 520, easeOut(p)), 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  /** Guarda a caixa do texto em coordenadas de tela (para a checagem de bordas). */
  function record(ctx, x0, y0, x1, y1, t) {
    if (!debug || !debug.boxes) return;
    const m = ctx.getTransform();
    const xs = [x0, x1].flatMap((x) => [y0, y1].map((y) => m.a * x + m.c * y + m.e));
    const ys = [x0, x1].flatMap((x) => [y0, y1].map((y) => m.b * x + m.d * y + m.f));
    debug.boxes.push({t, a: ctx.globalAlpha, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys)});
  }

  return {render};
}

/* ----------------------------------------------------------- transições */

/** Mancha líquida que cresce a partir de um ponto até cobrir a tela. */
function liquidCover(ctx, t, from, p, inner, outer, seed) {
  const R = liquidRadius(from, p);
  if (R < 1) return;
  ctx.save();
  blobPath(ctx, from.x, from.y, R, t, seed);
  const g = ctx.createRadialGradient(from.x, from.y, 0, from.x, from.y, R);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 6;
  ctx.shadowColor = 'rgba(255,255,255,0.6)';
  ctx.shadowBlur = 24;
  ctx.stroke();
  ctx.restore();
}

/** A mesma mancha cobrindo a tela, com um buraco líquido que cresce e revela a cena nova. */
function liquidReveal(ctx, t, from, p, inner, outer, seed) {
  const R = liquidRadius(from, p);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  blobPath(ctx, from.x, from.y, R, t, seed + 7, true);
  const g = ctx.createRadialGradient(from.x, from.y, R, from.x, from.y, R + 1400);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fill('evenodd');
  ctx.beginPath();
  blobPath(ctx, from.x, from.y, R, t, seed + 7, true);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 6;
  ctx.shadowColor = 'rgba(255,255,255,0.6)';
  ctx.shadowBlur = 24;
  ctx.stroke();
  ctx.restore();
}

/** Distâncias de um ponto a uma grade da tela (cantos incluídos), em ordem crescente. */
function screenDistances(x, y) {
  const d = [];
  for (let gy = 0; gy <= H; gy += 15) for (let gx = 0; gx <= W; gx += 15) d.push(Math.hypot(gx - x, gy - y));
  return d.sort((a, b) => a - b);
}

/** Raio do círculo (centrado no ponto) que cobre a fração q da tela. */
function quantile(sorted, q) {
  const i = clamp(q) * (sorted.length - 1);
  const i0 = Math.floor(i);
  return lerp(sorted[i0], sorted[Math.min(sorted.length - 1, i0 + 1)], i - i0);
}

/**
 * Raio da mancha: a área coberta da tela cresce em ritmo suave e constante
 * (nada de cobrir meia tela num quadro). A mancha oscila ±14,5%, então no fim
 * o raio mínimo dela passa do canto mais distante (+ borda de luz).
 */
function liquidRadius(from, p) {
  const e = sineInOut(p);
  return quantile(screenDistances(from.x, from.y), e) * (1 + 0.17 * e * e) + 40 * e;
}

function blobPath(ctx, cx, cy, R, t, seed, append = false) {
  if (!append) ctx.beginPath();
  const N = 180;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU;
    const k = 1 + 0.07 * Math.sin(3 * a + t * 2.3 + seed) + 0.045 * Math.sin(5 * a - t * 3.1 + seed * 2) + 0.03 * Math.sin(8 * a + t * 4.7 + seed);
    const x = cx + R * k * Math.cos(a);
    const y = cy + R * k * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Luz branca que se espalha a partir de um ponto até tomar a tela. */
function whiteBloom(ctx, from, p) {
  // Cada pixel clareia numa rampa de 55% da transição, começando antes perto do
  // ponto: a luz nasce ali e toma a tela, sem nenhum quadro carregar o salto.
  const K = 0.45;
  const M = 24;
  const sorted = screenDistances(from.x, from.y);
  const D = reach(from.x, from.y) + 2;
  const g = ctx.createRadialGradient(from.x, from.y, 0, from.x, from.y, D);
  for (let j = 0; j <= M; j++) {
    const a = clamp((p - (K * j) / M) / (1 - K));
    g.addColorStop(Math.min(1, quantile(sorted, j / M) / D), `rgba(255,255,255,${a.toFixed(4)})`);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function fillAll(ctx, style) {
  ctx.fillStyle = style;
  ctx.fillRect(0, 0, W, H);
}

/* ----------------------------------------------------------- desenho base */

function glow(ctx, x, y, r, color, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
}

function ring(ctx, x, y, r, style, lw) {
  ctx.save();
  ctx.strokeStyle = style;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function makeSpecks() {
  const rnd = seeded(77);
  return Array.from({length: 28}, () => ({x: rnd() * W, y: rnd() * H, r: 3 + rnd() * 7, v: 8 + rnd() * 26, ph: rnd() * TAU}));
}

function drawSpecks(ctx, t, specks, color) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const s of specks) {
    const y = (((s.y - t * s.v) % H) + H) % H;
    const a = 0.18 + 0.18 * Math.sin(t * 1.7 + s.ph);
    glow(ctx, s.x + Math.sin(t * 0.6 + s.ph) * 14, y, s.r * 3, color, a);
  }
  ctx.restore();
}

function defaultCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/* Textura de vidro fosco: um ladrilho de ruído fixo, sobreposto (overlay) e parado.
   Grão que muda a cada quadro custava 26 Mbps (82 MB) e virava riscos quando a rede
   recomprime; parado, ~6 Mbps e a textura sobrevive à recompressão. */
function makeGrain(makeCanvas) {
  const size = 256;
  const c = makeCanvas(size, size);
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const rnd = seeded(2026);
  for (let i = 0; i < size * size; i++) {
    const v = Math.floor(rnd() * 255);
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

function applyGrain(ctx, tile, amount) {
  const rnd = seeded(9974);
  const ox = Math.floor(rnd() * 256);
  const oy = Math.floor(rnd() * 256);
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.globalCompositeOperation = 'overlay';
  const pat = ctx.createPattern(tile, 'repeat');
  ctx.translate(-ox, -oy);
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.restore();
}
