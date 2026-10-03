/*
 * Inglês com a Gavi — Reels "Carreira" (25 s, 1080×1920, 30 fps).
 *
 * TODA a animação é desenhada num único <canvas> pela função render(ctx, t),
 * com t em segundos. Nada aqui depende de quadro anterior: qualquer instante
 * pode ser desenhado sozinho (é o que permite renderizar em paralelo).
 *
 * Modelado no exemplo do Pinterest que a cliente mandou: cenas pretas e
 * brancas, palavra-chave em vermelho, objetos e emojis, cartão com tachinha,
 * faixa curva cinza. Texto próprio da mentoria, em português (roteiro aprovado):
 *   1   0–2      "Você estuda inglês há anos."
 *   2   2–4      executivo em retícula: "Mas e a sua carreira?" / "no mesmo lugar."
 *   3   4–6      "Porque inglês sem prática real"
 *   4   6–7,5    "é só decoreba." + 🦜
 *   5   7,5–10   chamada de vídeo: "E é na reunião / que se decide a promoção."
 *   6   10–12,5  cartão com tachinha: "Sem inglês funcional:" …
 *   7   12,5–14  "O mercado não premia esforço."
 *   8   14–15    "Premia clareza."
 *   9   15–17    cartão da Bruna (foto real)
 *   10  17–18,5  "Você já se esforça muito." + 💻
 *   11  18,5–20  "Mas não do jeito certo." + 🎯
 *   12  20–22,5  "Toque em Saiba mais e mude isso." (ou "Link na bio para mudar isso.")
 *   13  22,5–25  logo original + chamada (2,5 s)
 *
 * Elemento contínuo: a faixa curva cinza do exemplo, em todas as cenas.
 * Transições: círculo que abre, luz branca, cruzada com zoom — nenhum corte seco.
 * Logo: o PNG original recortado sem perda, desenhado 1:1 no fim — nunca redesenhado.
 * Grade musical: 120 BPM, uma batida a cada 0,5 s; a trilha (audio.js) lê os
 * mesmos tempos daqui, então todo som cai no quadro do seu evento.
 */

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION = 25;
export const BPM = 120;
export const BEAT = 60 / BPM; // 0,5 s

export const COLORS = {
  black: '#0B0B0C',
  ink: '#111214',
  white: '#FFFFFF',
  grey: '#9C9CA2',
  red: '#DC2343', // vermelho da marca (o "G" da logo)
  navy: '#072837',
};

/** Recorte da logo original (public/reels/logo.png) e onde ela fica no final. */
export const LOGO = {w: 476, h: 588, left: 302, top: 560};

/** Área segura dos textos: longe das bordas e da interface do Reels embaixo. */
export const SAFE = {x0: 110, x1: 970, y0: 280, y1: 1470};

/** Arquivos que a cena usa (caminhos dentro de public/). */
export const ASSETS = {
  logo: 'reels/logo.png',
  photo: 'pordentro/retrato.jpg',
  parrot: 'emoji/emoji_u1f99c.svg',
  silent: 'emoji/emoji_u1f636.svg',
  globe: 'emoji/emoji_u1f30e.svg',
  chartDown: 'emoji/emoji_u1f4c9.svg',
  laptop: 'emoji/emoji_u1f4bb.svg',
  target: 'emoji/emoji_u1f3af.svg',
};

/** Tempos (s). Palavras-chave e batidas caem no tempo da música (múltiplos de 0,5 s). */
export const T = {
  // 1 · gancho
  s1: [-0.24, -0.12, 0.0, 0.5, 0.75],
  anos: 1.0,
  // 2 · executivo
  figure: 1.85,
  bubble: 2.15,
  s2: [2.25, 2.33, 2.41, 2.25],
  carreira: 2.5,
  lugar: [2.85, 3.0], // "no mesmo" · "lugar."
  // 3
  s3: [3.85, 3.95, 4.05, 4.5],
  pratica: 5.0,
  // 4
  s4: [6.05, 6.15],
  decoreba: 6.5,
  parrot: 6.5,
  // 5 · chamada de vídeo
  call: 7.5,
  tiles: [7.6, 7.7, 7.8, 7.9],
  s5a: [7.6, 7.68, 7.76, 7.85],
  reuniao: 8.0,
  s5b: [8.5, 8.58, 8.66, 8.74, 8.85],
  promocao: 9.0,
  // 6 · cartão
  card: 10.0,
  pin: 10.35,
  title: 10.4,
  items: [10.75, 11.25, 11.75],
  // 7
  circle: 12.35,
  mercado: 12.45,
  s7: [13.1, 13.25, 13.4],
  premia: 13.5,
  strike: 13.6,
  // 8
  s8: [13.95, 14.25],
  clareza: 14.5,
  // 9 · Bruna
  bruna: 15.0,
  avatar: 15.1,
  name: 15.3,
  lines: [15.5, 15.7],
  chips: [16.0, 16.25],
  dot: 16.5,
  // 10
  laptop: 17.0,
  s10: [17.05, 17.15, 17.25, 17.3, 17.4],
  esforca: 17.5,
  typing: [17.75, 18.0],
  // 11
  s11: [18.5, 18.6, 18.7, 18.8, 18.9],
  certo: 19.0,
  target: 19.0,
  // 12 · chamada
  s12: [20.05, 20.15, 20.3, 20.9, 21.0, 21.1],
  saiba: 20.5,
  mude: 21.0,
  arrows: [21.25, 21.5, 22.0],
  // 13 · final
  final: 22.5,
  cta: [22.625, 22.75, 22.875],
  ctaPulses: [23.5, 24.0, 24.5],
};

/**
 * Transição da cena i para a i+1, de a até b (s).
 *   cross: mesma cor de fundo; a cena que sai dá zoom e some, a nova entra palavra por palavra
 *   iris:  um círculo abre a partir de um ponto com a cena nova dentro (área coberta constante)
 *   bloom: luz branca que nasce num ponto e toma a tela
 */
const TR = [
  {a: 1.75, b: 2.1, type: 'cross'},
  {a: 3.75, b: 4.1, type: 'cross'},
  {a: 5.75, b: 6.1, type: 'iris', from: {x: 540, y: 1100}},
  {a: 7.2, b: 7.55, type: 'iris', from: {x: 560, y: 1290}},
  {a: 9.7, b: 10.1, type: 'iris', from: {x: -60, y: 1990}},
  {a: 12.25, b: 12.6, type: 'cross'},
  {a: 13.85, b: 14.15, type: 'cross'},
  {a: 14.75, b: 15.1, type: 'iris', from: {x: 540, y: 960}},
  {a: 16.75, b: 17.1, type: 'iris', from: {x: 1090, y: 1930}},
  {a: 18.25, b: 18.6, type: 'cross'},
  {a: 19.7, b: 20.05, type: 'iris', from: {x: 560, y: 1290}},
  {a: 22.1, b: 22.5, type: 'bloom', from: {x: 540, y: 860}},
];

/** Janelas de transição (texto pode passar da área segura enquanto sai de cena). */
export const TRANSITIONS = TR.map(({a, b}) => [a, b]);

/* ------------------------------------------------------------------ util */

const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, start, dur) => clamp((t - start) / dur);
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** Seno ida e volta: inclinação máxima π/2 — usada nas transições de tela inteira. */
const sineInOut = (x) => 0.5 - 0.5 * Math.cos(Math.PI * x);
/** Saída com um leve passo além (sem quicar): para objetos que "batem" no lugar. */
const easeOutSoft = (x) => {
  const s = 0.9;
  return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
};
/** Pulso 0→1→0 que dura `dur` a partir de `at`. */
const bump = (t, at, dur = 0.3) => (t >= at && t < at + dur ? Math.sin((Math.PI * (t - at)) / dur) : 0);
/** Distância de um ponto até o canto da tela mais distante. */
const reach = (x, y) => Math.max(Math.hypot(x, y), Math.hypot(W - x, y), Math.hypot(x, H - y), Math.hypot(W - x, H - y));

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

/** Batida da música: 1 no tempo, decaindo. */
const beatEnv = (t) => Math.exp(-(((t % BEAT) + BEAT) % BEAT) / 0.12);

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
 * createScene({images, cta}) → { render(ctx, t) }
 *   images: as imagens de ASSETS, já carregadas (mesmas chaves)
 *   cta:    'saibamais' (anúncio/turbinado) ou 'linknabio' (só publicar)
 *   debug:  { boxes: [] } recebe a caixa de cada texto desenhado (checagem de bordas)
 */
export function createScene({images, cta = 'saibamais', debug = null, makeCanvas = defaultCanvas}) {
  const img = images;
  const grain = makeGrain(makeCanvas);
  const figure = makeHalftone(makeCanvas);

  const SC = [
    {bg: 'black', draw: scene1},
    {bg: 'black', draw: scene2},
    {bg: 'black', draw: scene3},
    {bg: 'white', draw: scene4},
    {bg: 'black', draw: scene5},
    {bg: 'white', draw: scene6},
    {bg: 'white', draw: scene7},
    {bg: 'white', draw: scene8},
    {bg: 'black', draw: scene9},
    {bg: 'white', draw: scene10},
    {bg: 'white', draw: scene11},
    {bg: 'black', draw: scene12},
    {bg: 'final', draw: scene13},
  ];

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

    let i = 0;
    while (i < TR.length && t >= TR[i].b) i++;
    const tr = TR[i];
    let grainAmt = SC[i].bg === 'final' ? 0 : 0.05;

    if (!tr || t < tr.a) {
      drawScene(ctx, i, t, 0);
    } else {
      const p = (t - tr.a) / (tr.b - tr.a);
      if (tr.type === 'cross') {
        drawBg(ctx, SC[i].bg, t);
        SC[i].draw(ctx, t, sineInOut(p));
        SC[i + 1].draw(ctx, t, 0);
      } else if (tr.type === 'iris') {
        drawScene(ctx, i, t, 0);
        const R = coverRadius(tr.from, sineInOut(p));
        ctx.save();
        ctx.beginPath();
        ctx.arc(tr.from.x, tr.from.y, R, 0, TAU);
        ctx.clip();
        drawScene(ctx, i + 1, t, 0);
        ctx.restore();
        // borda do círculo: um fio de luz (para o branco) ou de sombra (para o preto)
        const toWhite = SC[i + 1].bg !== 'black';
        ctx.save();
        ctx.lineWidth = 4;
        ctx.strokeStyle = toWhite ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.35)';
        ctx.shadowColor = toWhite ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(tr.from.x, tr.from.y, R, 0, TAU);
        ctx.stroke();
        ctx.restore();
      } else {
        drawScene(ctx, i, t, 0);
        whiteBloom(ctx, tr.from, p);
        grainAmt *= 1 - p;
      }
    }

    if (grainAmt > 0.001) applyGrain(ctx, grain, grainAmt);
    ctx.restore();
  }

  function drawScene(ctx, i, t, out) {
    drawBg(ctx, SC[i].bg, t);
    SC[i].draw(ctx, t, out);
  }

  /** A cena que sai numa transição cruzada: zoom para a frente e some. */
  function leaving(ctx, out, fn) {
    if (out <= 0) return fn();
    ctx.save();
    ctx.globalAlpha *= 1 - out;
    camera(ctx, 540, 960, 1 + 0.3 * out, fn);
    ctx.restore();
  }

  /** Empurrão lento de câmera durante a cena (nunca fica parado). */
  const push = (t, start, dur) => 1 + 0.035 * prog(t, start, dur);

  /* ----------------------------------------------------------- fundos */

  function drawBg(ctx, kind, t) {
    if (kind === 'black') {
      ctx.fillStyle = COLORS.black;
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(540, 900, 0, 540, 900, 1250);
      g.addColorStop(0, '#1B1B1E');
      g.addColorStop(0.55, '#0E0E10');
      g.addColorStop(1, '#050506');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ribbon(ctx, t, 'dark');
    } else {
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(0, 0, W, H);
      if (kind === 'white') {
        const g = ctx.createLinearGradient(0, 1150, 0, H);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.085)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      ribbon(ctx, t, 'light');
    }
  }

  /**
   * A faixa curva (o elemento que acompanha o vídeo todo): um arco grande pela
   * esquerda, com sombreado de tubo. Respira devagar; no final recua para o canto.
   */
  function ribbon(ctx, t, tone) {
    const k = 210 * easeInOut(prog(t, T.final - 0.4, 0.9));
    const a = {x: 800 + 90 * Math.sin(t * 0.55) - k, y: -150};
    const b = {x: -260 - k, y: 420 + 110 * Math.sin(t * 0.43 + 1)};
    const c = {x: -150 - k, y: 1480 + 60 * Math.sin(t * 0.37)};
    const d = {x: 780 - 0.6 * k, y: 2110};
    const cols = tone === 'dark' ? ['#151517', '#1A1A1D', '#202024', '#27272B'] : ['#C9C9CC', '#D4D4D7', '#DFDFE2', '#EAEAEC'];
    ctx.save();
    ctx.lineCap = 'round';
    [176, 136, 96, 52].forEach((w, i) => {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.bezierCurveTo(b.x, b.y, c.x, c.y, d.x, d.y);
      ctx.lineWidth = w;
      ctx.strokeStyle = cols[i];
      if (i === 0) {
        ctx.shadowColor = tone === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.16)';
        ctx.shadowBlur = 44;
        ctx.shadowOffsetY = 26;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }
      ctx.stroke();
    });
    ctx.restore();
  }

  /* ----------------------------------------------------------- cenas */

  // 1 · "Você estuda inglês / há anos."
  function scene1(ctx, t, out) {
    const w = T.s1;
    leaving(ctx, out, () =>
      camera(ctx, 540, 960, push(t, 0, 2), () => {
        words(ctx, t, {y: 880, items: [
          {text: 'Você', at: w[0], size: 88},
          {text: 'estuda', at: w[1], size: 88},
          {text: 'inglês', at: w[2], size: 88},
        ]});
        words(ctx, t, {y: 1130, items: [
          {text: 'há', at: w[3], size: 88},
          {text: 'anos.', at: w[4], size: 220, weight: 800, color: COLORS.red, glow: true, hits: [T.anos, 1.5]},
        ]});
      }),
    );
  }

  // 2 · executivo em retícula: "Mas e a sua carreira?" / "no mesmo lugar."
  function scene2(ctx, t, out) {
    leaving(ctx, out, () => {
      const fp = easeOut(prog(t, T.figure, 0.5));
      if (fp > 0) {
        const s = 1 + 0.05 * prog(t, T.figure, 2.2);
        const fw = figure.width * s;
        ctx.save();
        ctx.globalAlpha *= fp;
        ctx.drawImage(figure, 540 - fw / 2, 560 + 220 * (1 - fp), fw, figure.height * s);
        ctx.restore();
        // escurece a base para o texto grande ler bem por cima da figura
        const g = ctx.createLinearGradient(0, 1040, 0, 1560);
        g.addColorStop(0, 'rgba(8,8,9,0)');
        g.addColorStop(1, 'rgba(8,8,9,0.92)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 1040, W, H - 1040);
      }
      // balão no lugar do rosto
      const bp = easeOutSoft(prog(t, T.bubble, 0.32));
      if (bp > 0) {
        ctx.save();
        ctx.globalAlpha *= clamp(bp * 1.4);
        camera(ctx, 610, 640, lerp(0.7, 1, bp), () => {
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 40;
          ctx.shadowOffsetY = 16;
          roundRect(ctx, 175, 300, 730, 330, 70);
          ctx.fillStyle = COLORS.white;
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(560, 600);
          ctx.lineTo(660, 600);
          ctx.lineTo(600, 700);
          ctx.closePath();
          ctx.fill();
          ctx.shadowColor = 'transparent';
          const w = T.s2;
          words(ctx, t, {y: 425, items: [
            {text: 'Mas', at: w[0], size: 66, color: COLORS.ink},
            {text: 'e', at: w[1], size: 66, color: COLORS.ink},
            {text: 'a sua', at: w[2], size: 66, color: COLORS.ink},
          ]});
          words(ctx, t, {y: 572, items: [{text: 'carreira?', at: T.carreira - 0.2, size: 132, weight: 800, color: COLORS.red, hits: [T.carreira]}]});
        });
        ctx.restore();
      }
      words(ctx, t, {y: 1270, items: [{text: 'no mesmo', at: T.lugar[0], size: 160, weight: 800, shadow: true}]});
      words(ctx, t, {y: 1425, items: [{text: 'lugar.', at: T.lugar[1], size: 160, weight: 800, shadow: true, hits: [T.lugar[1] + 0.5]}]});
    });
  }

  // 3 · "Porque inglês sem / prática real"
  function scene3(ctx, t, out) {
    const w = T.s3;
    leaving(ctx, out, () =>
      camera(ctx, 540, 960, push(t, 3.85, 2), () => {
        words(ctx, t, {y: 900, items: [
          {text: 'Porque', at: w[0], size: 90},
          {text: 'inglês', at: w[1], size: 90},
          {text: 'sem', at: w[2], size: 90},
        ]});
        words(ctx, t, {y: 1100, items: [{text: 'prática real', at: w[3], size: 140, weight: 800, color: COLORS.red, glow: true, hits: [T.pratica, T.pratica + 0.5]}]});
      }),
    );
  }

  // 4 · "é só decoreba." + 🦜
  function scene4(ctx, t, out) {
    leaving(ctx, out, () => {
      camera(ctx, 540, 960, push(t, 6, 1.5), () => {
        words(ctx, t, {y: 760, items: [{text: 'é só', at: T.s4[0], size: 110, color: COLORS.ink}]});
        words(ctx, t, {y: 960, items: [{text: 'decoreba.', at: T.s4[1], size: 155, weight: 800, color: COLORS.red, hits: [T.decoreba, T.decoreba + 0.5]}]});
      });
      // papagaio: entra no tempo, inclina a cabeça a cada batida
      const p = easeOutSoft(prog(t, T.parrot, 0.35));
      if (p > 0 && img.parrot) {
        const tilt = 0.09 * Math.sin((t - T.parrot) * Math.PI * 2) * clamp((t - T.parrot) / 0.3);
        emoji(ctx, img.parrot, 560, 1290, 420 * lerp(0.4, 1, p), tilt - 0.06, clamp(p * 1.5));
      }
    });
  }

  // 5 · chamada de vídeo: "E é na reunião / que se decide a promoção."
  function scene5(ctx, t, out) {
    leaving(ctx, out, () => {
      callWindow(ctx, t);
      const a = T.s5a;
      words(ctx, t, {y: 470, items: [
        {text: 'E', at: a[0], size: 82},
        {text: 'é', at: a[1], size: 82},
        {text: 'na', at: a[2], size: 82},
        {text: 'reunião', at: a[3], size: 140, weight: 800, color: COLORS.red, glow: true, hits: [T.reuniao]},
      ]});
      const b = T.s5b;
      words(ctx, t, {y: 1268, items: [
        {text: 'que', at: b[0], size: 82},
        {text: 'se', at: b[1], size: 82},
        {text: 'decide', at: b[2], size: 82},
        {text: 'a', at: b[3], size: 82},
      ]});
      words(ctx, t, {y: 1422, items: [{text: 'promoção.', at: b[4], size: 144, weight: 800, color: COLORS.red, glow: true, hits: [T.promocao, T.promocao + 0.5]}]});
    });
  }

  const PEOPLE = [
    {name: 'Michael', city: 'Nova York', initials: 'MJ', color: '#3B4C5E'},
    {name: 'Sarah', city: 'Londres', initials: 'SL', color: '#55405A'},
    {name: 'Kenji', city: 'Tóquio', initials: 'KT', color: '#3E5A4C'},
    {name: 'Você', city: '', initials: '', color: '#45454B', you: true},
  ];

  function callWindow(ctx, t) {
    const x0 = 120;
    const y0 = 560;
    const w = 840;
    const h = 600;
    const inP = easeOut(prog(t, T.call, 0.4));
    if (inP <= 0) return;
    ctx.save();
    ctx.globalAlpha *= inP;
    camera(ctx, 540, 860, lerp(0.9, 1, inP) * push(t, T.call, 2.5), () => {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 30;
      roundRect(ctx, x0, y0, w, h, 30);
      ctx.fillStyle = '#141416';
      ctx.fill();
      ctx.restore();
      roundRect(ctx, x0, y0, w, h, 30);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#2A2A2F';
      ctx.stroke();
      // cabeçalho: nome da reunião e cronômetro andando
      ctx.font = '600 30px Inter, Arial, sans-serif';
      ctx.fillStyle = '#A4A4AB';
      ctx.textAlign = 'left';
      ctx.fillText('Reunião · time global', x0 + 70, y0 + 52);
      ctx.beginPath();
      ctx.arc(x0 + 44, y0 + 42, 9, 0, TAU);
      ctx.fillStyle = '#5BD47A';
      ctx.fill();
      const secs = 4 + Math.max(0, Math.floor(t - T.call));
      ctx.textAlign = 'right';
      ctx.fillStyle = '#A4A4AB';
      ctx.fillText(`12:${String(secs).padStart(2, '0')}`, x0 + w - 34, y0 + 52);
      ctx.textAlign = 'left';
      // quatro pessoas
      const tw = 390;
      const th = 236;
      PEOPLE.forEach((p, k) => {
        const tx = x0 + 20 + (k % 2) * (tw + 20);
        const ty = y0 + 84 + Math.floor(k / 2) * (th + 20);
        const pp = easeOutSoft(prog(t, T.tiles[k], 0.3));
        if (pp <= 0) return;
        ctx.save();
        ctx.globalAlpha *= clamp(pp * 1.4);
        camera(ctx, tx + tw / 2, ty + th / 2, lerp(0.85, 1, pp), () => {
          roundRect(ctx, tx, ty, tw, th, 18);
          ctx.fillStyle = '#1F1F23';
          ctx.fill();
          const cx = tx + tw / 2;
          const cy = ty + th / 2 - 16;
          if (p.you) {
            // silhueta (câmera ligada), borda vermelha quando fala
            ctx.save();
            roundRect(ctx, tx, ty, tw, th, 18);
            ctx.clip();
            ctx.fillStyle = '#5A5A61';
            ctx.beginPath();
            ctx.arc(cx, cy - 12, 44, 0, TAU);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx, cy + 110, 108, 78, 0, Math.PI, TAU);
            ctx.fill();
            ctx.restore();
            const talk = clamp((t - T.reuniao) / 0.15);
            if (talk > 0) {
              ctx.save();
              ctx.globalAlpha *= talk;
              roundRect(ctx, tx + 2, ty + 2, tw - 4, th - 4, 17);
              ctx.lineWidth = 6;
              ctx.strokeStyle = COLORS.red;
              ctx.shadowColor = rgba(COLORS.red, 0.8);
              ctx.shadowBlur = 24;
              ctx.stroke();
              ctx.restore();
              // barras de voz no tempo da música
              for (let b = 0; b < 3; b++) {
                const hgt = 10 + 26 * Math.abs(Math.sin(t * 9 + b * 1.7)) * (0.5 + 0.5 * beatEnv(t));
                ctx.fillStyle = COLORS.red;
                roundRect(ctx, tx + tw - 70 + b * 16, ty + th - 26 - hgt, 10, hgt, 5);
                ctx.fill();
              }
            }
          } else {
            ctx.beginPath();
            ctx.arc(cx, cy, 58, 0, TAU);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.font = '700 44px Inter, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = COLORS.white;
            ctx.fillText(p.initials, cx, cy + 16);
            ctx.textAlign = 'left';
          }
          // etiqueta do nome sobre fundo escuro, como nos apps de chamada
          ctx.font = '600 27px Inter, Arial, sans-serif';
          const nw = ctx.measureText(p.name).width;
          const cw = p.city ? ctx.measureText(` · ${p.city}`).width : 0;
          roundRect(ctx, tx + 12, ty + th - 56, nw + cw + 24, 42, 12);
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.fill();
          ctx.fillStyle = '#E2E2E6';
          ctx.fillText(p.name, tx + 24, ty + th - 26);
          if (p.city) {
            ctx.fillStyle = '#8E8E96';
            ctx.fillText(` · ${p.city}`, tx + 24 + nw, ty + th - 26);
          }
        });
        ctx.restore();
      });
    });
    ctx.restore();
  }

  // 6 · cartão com tachinha: "Sem inglês funcional:"
  const ITEMS = [
    {icon: 'silent', text: 'sem voz na reunião'},
    {icon: 'globe', text: 'sem a vaga lá fora'},
    {icon: 'chartDown', text: 'sem a promoção'},
  ];

  function scene6(ctx, t, out) {
    leaving(ctx, out, () => {
      const p = easeOutSoft(prog(t, T.card, 0.42));
      if (p <= 0) return;
      const cw = 800;
      const ch = 690;
      const cx = 540;
      const cy = 930 - 1150 * (1 - p);
      const settle = 0.025 * Math.sin((t - T.pin) * 9) * Math.exp(-Math.max(0, t - T.pin) * 5) * (t >= T.pin ? 1 : 0);
      const rot = lerp(-0.22, -0.035, p) + settle;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.translate(-cw / 2, -ch / 2);
      // papel
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.26)';
      ctx.shadowBlur = 50;
      ctx.shadowOffsetY = 30;
      const g = ctx.createLinearGradient(0, 0, 0, ch);
      g.addColorStop(0, '#F4F4F5');
      g.addColorStop(1, '#E2E2E4');
      ctx.fillStyle = g;
      roundRect(ctx, 0, 0, cw, ch, 14);
      ctx.fill();
      ctx.restore();
      // título e itens
      words(ctx, t, {x: 60, y: 135, align: 'left', items: [{text: 'Sem inglês funcional:', at: T.title, size: 60, weight: 800, color: COLORS.ink}]});
      const lp = easeOut(prog(t, T.title + 0.1, 0.35));
      if (lp > 0) {
        ctx.fillStyle = '#C4C4C8';
        ctx.fillRect(60, 178, 680 * lp, 4);
      }
      ITEMS.forEach((it, k) => {
        const at = T.items[k];
        const q = easeOut(prog(t, at, 0.32));
        if (q <= 0) return;
        const by = 300 + k * 130;
        if (img[it.icon]) emoji(ctx, img[it.icon], 98, by - 22, 80 * lerp(0.5, 1, easeOutSoft(prog(t, at, 0.3))), 0, q);
        words(ctx, t, {x: 165 - 30 * (1 - q), y: by, align: 'left', items: [{text: it.text, at, size: 54, color: '#1D1D20'}]});
      });
      ctx.restore();
      // tachinha
      const pin = prog(t, T.pin, 0.18);
      if (pin > 0) pushpin(ctx, cx + Math.sin(rot) * (ch / 2 - 30), cy - Math.cos(rot) * (ch / 2 - 30), lerp(1.7, 1, easeOut(pin)), clamp(pin * 2));
    });
  }

  function pushpin(ctx, x, y, s, a) {
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 12;
    const g = ctx.createRadialGradient(-10, -12, 4, 0, 0, 34);
    g.addColorStop(0, '#FF7A8E');
    g.addColorStop(0.45, COLORS.red);
    g.addColorStop(1, '#8E1028');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, TAU);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(-11, -13, 9, 6, -0.6, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // 7 · "O mercado / não premia esforço."
  function scene7(ctx, t, out) {
    leaving(ctx, out, () =>
      camera(ctx, 540, 960, push(t, 12.35, 1.8), () => {
        const cp = easeOutSoft(prog(t, T.circle, 0.42));
        if (cp > 0) {
          ctx.beginPath();
          ctx.arc(540, 880, 330 * cp, 0, TAU);
          ctx.fillStyle = '#F8E1E6';
          ctx.fill();
        }
        // "O mercado" se escreve da esquerda para a direita
        const wp = easeInOut(prog(t, T.mercado, 0.5));
        if (wp > 0) {
          ctx.save();
          ctx.font = '800 140px Inter, Arial, sans-serif';
          const tw = ctx.measureText('O mercado').width;
          const x = 540 - tw / 2;
          ctx.beginPath();
          ctx.rect(x - 10, 700, (tw + 20) * wp, 300);
          ctx.clip();
          ctx.fillStyle = COLORS.ink;
          ctx.fillText('O mercado', x, 925);
          ctx.restore();
          record(ctx, x, 925 - 140 * 0.8, x + tw * wp, 925 + 140 * 0.24, t);
        }
        const w = T.s7;
        words(ctx, t, {y: 1120, items: [
          {text: 'não', at: w[0], size: 80, color: COLORS.ink},
          {text: 'premia', at: w[1], size: 80, weight: 800, color: COLORS.red, hits: [T.premia]},
          {text: 'esforço.', at: w[2], size: 80, color: '#A2A2A8', strike: T.strike},
        ]});
      }),
    );
  }

  // 8 · "Premia / clareza."
  function scene8(ctx, t, out) {
    leaving(ctx, out, () =>
      camera(ctx, 540, 960, push(t, 13.95, 1.2), () => {
        words(ctx, t, {y: 830, items: [{text: 'Premia', at: T.s8[0], size: 112, color: COLORS.ink}]});
        words(ctx, t, {y: 1060, items: [{text: 'clareza.', at: T.s8[1], size: 190, weight: 800, color: COLORS.red, hits: [T.clareza]}]});
      }),
    );
  }

  // 9 · cartão da Bruna (foto real)
  function scene9(ctx, t, out) {
    leaving(ctx, out, () => {
      const p = easeOut(prog(t, T.bruna, 0.4));
      if (p <= 0) return;
      ctx.save();
      ctx.globalAlpha *= p;
      camera(ctx, 540, 880, push(t, T.bruna, 2), () => {
        ctx.translate(0, 90 * (1 - p));
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 70;
        ctx.shadowOffsetY = 30;
        roundRect(ctx, 130, 500, 820, 760, 40);
        ctx.fillStyle = '#151517';
        ctx.fill();
        ctx.restore();
        roundRect(ctx, 130, 500, 820, 760, 40);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#2A2A2F';
        ctx.stroke();
        // foto
        const ap = easeOutSoft(prog(t, T.avatar, 0.35));
        if (ap > 0 && img.photo) {
          const r = 132 * lerp(0.8, 1, ap);
          const cx = 540;
          const cy = 690;
          ctx.save();
          ctx.globalAlpha *= clamp(ap * 1.5);
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, TAU);
          ctx.save();
          ctx.clip();
          const s = (r / 132) * 0.6;
          ctx.drawImage(img.photo, cx - 400 * s, cy - 310 * s, img.photo.width * s, img.photo.height * s);
          ctx.restore();
          ctx.lineWidth = 6;
          ctx.strokeStyle = COLORS.red;
          ctx.stroke();
          // pontinho de notificação, como no perfil do exemplo
          const dp = 1 + 0.35 * bump(t, T.dot, 0.3);
          ctx.beginPath();
          ctx.arc(cx + r * 0.72, cy - r * 0.72, 17 * dp, 0, TAU);
          ctx.fillStyle = COLORS.red;
          ctx.fill();
          ctx.lineWidth = 5;
          ctx.strokeStyle = '#151517';
          ctx.stroke();
          ctx.restore();
        }
        words(ctx, t, {y: 920, items: [{text: 'Bruna Gavioli', at: T.name, size: 72, weight: 800, color: COLORS.white}]});
        words(ctx, t, {y: 995, items: [{text: 'Mentoria de inglês funcional', at: T.lines[0], size: 50, color: '#C9C9CF'}]});
        words(ctx, t, {y: 1058, items: [{text: 'para executivos', at: T.lines[1], size: 50, weight: 800, color: COLORS.red}]});
        chips(ctx, t);
      });
      ctx.restore();
    });
  }

  function chips(ctx, t) {
    const labels = ['Método M.O.V.E.', '20 min por dia'];
    ctx.save();
    ctx.font = '700 38px Inter, Arial, sans-serif';
    const pad = 30;
    const dot = 26;
    const ws = labels.map((l) => ctx.measureText(l).width + 2 * pad + dot);
    const gap = 22;
    let x = 540 - (ws[0] + ws[1] + gap) / 2;
    labels.forEach((l, k) => {
      const p = easeOutSoft(prog(t, T.chips[k], 0.3));
      if (p > 0) {
        ctx.save();
        ctx.globalAlpha *= clamp(p * 1.5);
        camera(ctx, x + ws[k] / 2, 1150, lerp(0.7, 1, p), () => {
          roundRect(ctx, x, 1150 - 38, ws[k], 76, 38);
          ctx.fillStyle = '#232327';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x + pad + 7, 1150, 7, 0, TAU);
          ctx.fillStyle = COLORS.red;
          ctx.fill();
          ctx.fillStyle = COLORS.white;
          ctx.fillText(l, x + pad + dot, 1150 + 13);
          record(ctx, x, 1150 - 38, x + ws[k], 1150 + 38, t);
        });
        ctx.restore();
      }
      x += ws[k] + gap;
    });
    ctx.restore();
  }

  // 10 · "Você já se / esforça / muito." + 💻
  function scene10(ctx, t, out) {
    const w = T.s10;
    leaving(ctx, out, () => {
      const lp = easeOut(prog(t, T.laptop, 0.45));
      if (lp > 0 && img.laptop) {
        const shake = 0.02 * (bump(t, T.typing[0], 0.18) - bump(t, T.typing[1], 0.18));
        emoji(ctx, img.laptop, 840 + 520 * (1 - lp), 1450, 600, -0.24 + shake, 1);
      }
      camera(ctx, 540, 960, push(t, 17, 1.5), () => {
        words(ctx, t, {y: 660, items: [
          {text: 'Você', at: w[0], size: 100, color: COLORS.ink},
          {text: 'já', at: w[1], size: 100, color: COLORS.ink},
          {text: 'se', at: w[2], size: 100, color: COLORS.ink},
        ]});
        words(ctx, t, {y: 860, items: [{text: 'esforça', at: w[3], size: 190, weight: 800, color: COLORS.red, hits: [T.esforca]}]});
        words(ctx, t, {y: 1060, items: [{text: 'muito.', at: w[4], size: 190, weight: 800, color: COLORS.red, hits: [T.esforca, 18.0]}]});
      });
    });
  }

  // 11 · "Mas não do / jeito / certo." + 🎯
  function scene11(ctx, t, out) {
    const w = T.s11;
    leaving(ctx, out, () => {
      camera(ctx, 540, 960, push(t, 18.5, 1.5), () => {
        words(ctx, t, {y: 660, items: [
          {text: 'Mas', at: w[0], size: 100, color: COLORS.ink},
          {text: 'não', at: w[1], size: 100, color: COLORS.ink},
          {text: 'do', at: w[2], size: 100, color: COLORS.ink},
        ]});
        words(ctx, t, {y: 860, items: [{text: 'jeito', at: w[3], size: 190, weight: 800, color: COLORS.red, hits: [T.certo]}]});
        words(ctx, t, {y: 1060, items: [{text: 'certo.', at: w[4], size: 190, weight: 800, color: COLORS.red, hits: [T.certo, T.certo + 0.5]}]});
      });
      const p = easeOutSoft(prog(t, T.target, 0.3));
      if (p > 0 && img.target) {
        const wob = 0.12 * Math.sin((t - T.target) * 22) * Math.exp(-(t - T.target) * 5);
        emoji(ctx, img.target, 560, 1340, 400 * lerp(0.3, 1, p), wob, clamp(p * 1.5));
      }
    });
  }

  // 12 · chamada: "Toque em / Saiba mais / e mude isso." (ou "Link na bio / para mudar isso.")
  function scene12(ctx, t, out) {
    const w = T.s12;
    leaving(ctx, out, () =>
      camera(ctx, 540, 960, push(t, 20, 2.5), () => {
        if (cta === 'linknabio') {
          words(ctx, t, {y: 860, items: [{text: 'Link na bio', at: w[2], size: 146, weight: 800, color: COLORS.red, glow: true, hits: [T.saiba, 21.5]}]});
          words(ctx, t, {y: 1050, items: [
            {text: 'para', at: w[3], size: 92},
            {text: 'mudar', at: w[4], size: 92, weight: 800, color: COLORS.red, glow: true, hits: [T.mude]},
            {text: 'isso.', at: w[5], size: 92},
          ]});
        } else {
          words(ctx, t, {y: 700, items: [
            {text: 'Toque', at: w[0], size: 100},
            {text: 'em', at: w[1], size: 100},
          ]});
          words(ctx, t, {y: 900, items: [{text: 'Saiba mais', at: w[2], size: 146, weight: 800, color: COLORS.red, glow: true, hits: [T.saiba, 21.5]}]});
          words(ctx, t, {y: 1080, items: [
            {text: 'e', at: w[3], size: 100},
            {text: 'mude', at: w[4], size: 100, weight: 800, color: COLORS.red, glow: true, hits: [T.mude]},
            {text: 'isso.', at: w[5], size: 100},
          ]});
          arrow(ctx, t);
        }
      }),
    );
  }

  /** Seta para baixo (o botão "Saiba mais" fica embaixo do vídeo no anúncio). */
  function arrow(ctx, t) {
    const p = easeOut(prog(t, T.arrows[0], 0.3));
    if (p <= 0) return;
    let b = 0;
    T.arrows.slice(1).forEach((at) => (b = Math.max(b, bump(t, at, 0.35))));
    const y = 1230 + 34 * b;
    ctx.save();
    ctx.globalAlpha *= p;
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(540, y);
    ctx.lineTo(540, y + 120);
    ctx.moveTo(490, y + 72);
    ctx.lineTo(540, y + 122);
    ctx.lineTo(590, y + 72);
    ctx.stroke();
    ctx.restore();
  }

  // 13 · final: logo original + chamada (2,5 s)
  function scene13(ctx, t) {
    const a = easeOut(prog(t, T.final, 0.45));
    const s = lerp(0.94, 1, a);
    if (a >= 1) {
      // 1:1, coordenadas inteiras, sem suavização: os pixels do arquivo, intactos.
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img.logo, LOGO.left, LOGO.top);
      ctx.restore();
    } else if (a > 0) {
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.translate(LOGO.left + LOGO.w / 2, LOGO.top + LOGO.h / 2);
      ctx.scale(s, s);
      ctx.drawImage(img.logo, -LOGO.w / 2, -LOGO.h / 2);
      ctx.restore();
    }
    const c = T.cta;
    const items =
      cta === 'linknabio'
        ? [{text: 'Acesse', at: c[0]}, {text: 'o', at: c[1]}, {text: 'link na bio', at: c[2], box: true, pulses: T.ctaPulses}]
        : [{text: 'Toque', at: c[0]}, {text: 'em', at: c[1]}, {text: 'Saiba mais', at: c[2], box: true, pulses: T.ctaPulses}];
    boxLine(ctx, t, {y: 1300, size: 64, color: COLORS.ink, items});
  }

  /* ----------------------------------------------------------- texto */

  /**
   * Uma linha de palavras com tamanhos próprios, na mesma linha de base,
   * entrando uma a uma (desfoque → nítido, crescendo de 92% a 100%). `hits`: batidas em que
   * a palavra dá um soco no tempo. `glow`: brilho vermelho (no fundo preto).
   * `strike`: tempo em que um traço vermelho risca a palavra.
   */
  function words(ctx, t, {x = 540, y, items, align = 'center', dur = 0.3}) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const ms = items.map((it) => {
      const font = `${it.weight ?? 700} ${it.size}px Inter, Arial, sans-serif`;
      ctx.font = font;
      return {...it, font, w: ctx.measureText(it.text).width};
    });
    const gap = (k) => 0.26 * Math.min(ms[k].size, ms[k - 1].size);
    let total = 0;
    ms.forEach((m, k) => (total += m.w + (k ? gap(k) : 0)));
    let cx = align === 'center' ? x - total / 2 : x;
    ms.forEach((m, k) => {
      if (k) cx += gap(k);
      const e = easeOut(prog(t, m.at, dur));
      if (e > 0) {
        let hit = 0;
        (m.hits || []).forEach((h) => (hit = Math.max(hit, bump(t, h, 0.28))));
        // entra crescendo de 92% a 100% e ganhando foco: nunca maior que o tamanho final
        const s = lerp(0.92, 1, e) * (1 + 0.07 * hit);
        const mx = cx + m.w / 2;
        const my = y - m.size * 0.36;
        ctx.save();
        ctx.translate(mx, my);
        ctx.scale(s, s);
        ctx.translate(-mx, -my);
        ctx.globalAlpha *= e;
        ctx.font = m.font;
        if (m.glow) {
          ctx.shadowColor = rgba(COLORS.red, 0.75);
          ctx.shadowBlur = 26 + 40 * hit;
        } else if (m.shadow) {
          ctx.shadowColor = 'rgba(0,0,0,0.85)';
          ctx.shadowBlur = 30;
          ctx.shadowOffsetY = 8;
        }
        const blur = (1 - e) * 14;
        if (blur > 0.4) ctx.filter = `blur(${blur.toFixed(2)}px)`;
        ctx.fillStyle = m.color ?? COLORS.white;
        ctx.fillText(m.text, cx, y);
        ctx.filter = 'none';
        if (m.strike !== undefined) {
          const q = easeOut(prog(t, m.strike, 0.25));
          if (q > 0) {
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = COLORS.red;
            ctx.fillRect(cx - 8, y - m.size * 0.34, (m.w + 16) * q, Math.max(6, m.size * 0.09));
          }
        }
        if (e > 0.05) record(ctx, cx, y - m.size * 0.8, cx + m.w, y + m.size * 0.24, t);
        ctx.restore();
      }
      cx += m.w;
    });
    ctx.restore();
  }

  /** Linha do final: a palavra com box:true entra numa caixa vermelha (o botão). */
  function boxLine(ctx, t, {x = 540, y, size, color, items, dur = 0.34}) {
    ctx.save();
    ctx.font = `800 ${size}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'left';
    const space = size * 0.27;
    const pad = size * 0.17;
    const ws = items.map((w) => ({...w, width: ctx.measureText(w.text).width}));
    const total = ws.reduce((acc, w) => acc + w.width + (w.box ? 2 * pad : 0), 0) + space * (ws.length - 1);
    let cx = x - total / 2;
    for (const w of ws) {
      const full = w.width + (w.box ? 2 * pad : 0);
      const e = easeOut(prog(t, w.at, dur));
      if (e > 0) {
        const rise = (1 - e) * size * 0.42;
        const blur = (1 - e) * 12;
        if (w.box) {
          const q = easeOut(prog(t, w.at + 0.05, 0.3));
          let pulse = 0;
          (w.pulses || []).forEach((at) => (pulse = Math.max(pulse, bump(t, at, 0.3))));
          const by = y - size * 0.86;
          const bh = size * 1.12;
          ctx.save();
          camera(ctx, cx + full / 2, by + bh / 2, 1 + 0.07 * pulse, () => {
            ctx.save();
            ctx.globalAlpha *= clamp(e * 1.5);
            ctx.shadowColor = rgba(COLORS.red, 0.5);
            ctx.shadowBlur = 24 + 36 * pulse;
            roundRect(ctx, cx, by, Math.max(1, full * q), bh, size * 0.14);
            ctx.fillStyle = COLORS.red;
            ctx.fill();
            ctx.restore();
            drawWord(ctx, w.text, cx + pad, y + rise, e, blur, COLORS.white);
          });
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

  /** Emoji (SVG da Noto) centrado em (x, y), com lado `size`, girado `rot`. */
  function emoji(ctx, image, x, y, size, rot, alpha) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.shadowColor = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur = size * 0.08;
    ctx.shadowOffsetY = size * 0.05;
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
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

/** Raio do círculo que abre: a área coberta da tela cresce em ritmo constante. */
function coverRadius(from, q) {
  return quantile(screenDistances(from.x, from.y), q) + 8 * q;
}

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

/* ----------------------------------------------------------- desenho base */

function defaultCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/* Textura fixa (vidro fosco): um ladrilho de ruído sobreposto e parado.
   Grão que muda a cada quadro custa ~26 Mbps e vira riscos quando a rede recomprime. */
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
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(tile, 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/**
 * Executivo de terno em retícula (pontos brancos no preto), como a foto do
 * exemplo: um "retrato" em tons de cinza desenhado por código e convertido em
 * pontos uma vez só. O rosto não aparece — o balão fica na frente.
 */
function makeHalftone(makeCanvas) {
  const w = 1080;
  const h = 1240;
  const src = makeCanvas(w, h);
  const g = src.getContext('2d');
  const grey = (l) => {
    const v = Math.round(clamp(l) * 255);
    return `rgb(${v},${v},${v})`;
  };
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);

  // pescoço (atrás do balão)
  let gr = g.createLinearGradient(460, 0, 620, 0);
  gr.addColorStop(0, grey(0.22));
  gr.addColorStop(0.5, grey(0.5));
  gr.addColorStop(1, grey(0.22));
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(474, 0);
  g.lineTo(606, 0);
  g.lineTo(624, 190);
  g.lineTo(456, 190);
  g.closePath();
  g.fill();

  // camisa: V estreito entre as lapelas
  gr = g.createLinearGradient(0, 140, 0, 600);
  gr.addColorStop(0, grey(0.95));
  gr.addColorStop(1, grey(0.7));
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(452, 140);
  g.lineTo(628, 140);
  g.lineTo(590, 470);
  g.lineTo(540, 590);
  g.lineTo(490, 470);
  g.closePath();
  g.fill();

  // gravata: nó + lâmina com listras diagonais
  g.fillStyle = grey(0.3);
  g.beginPath();
  g.moveTo(514, 236);
  g.lineTo(566, 236);
  g.lineTo(557, 296);
  g.lineTo(523, 296);
  g.closePath();
  g.fill();
  g.save();
  g.beginPath();
  g.moveTo(523, 296);
  g.lineTo(557, 296);
  g.lineTo(584, 600);
  g.lineTo(540, 660);
  g.lineTo(496, 600);
  g.closePath();
  g.fillStyle = grey(0.2);
  g.fill();
  g.clip();
  g.strokeStyle = grey(0.36);
  g.lineWidth = 9;
  for (let k = -20; k < 30; k++) {
    g.beginPath();
    g.moveTo(440, 300 + k * 30);
    g.lineTo(640, 390 + k * 30);
    g.stroke();
  }
  g.restore();

  // gola: duas pontas brancas, com sombra embaixo
  for (const side of [-1, 1]) {
    const X = (x) => 540 + side * (x - 540);
    g.fillStyle = grey(0.08);
    g.beginPath();
    g.moveTo(X(446), 150);
    g.lineTo(X(540), 262);
    g.lineTo(X(486), 312);
    g.lineTo(X(432), 222);
    g.closePath();
    g.fill();
    g.fillStyle = grey(1);
    g.beginPath();
    g.moveTo(X(448), 132);
    g.lineTo(X(540), 240);
    g.lineTo(X(488), 290);
    g.lineTo(X(432), 200);
    g.closePath();
    g.fill();
  }

  // paletó: escuro, luz no alto do ombro, contorno com luz de recorte
  for (const side of [-1, 1]) {
    const X = (x) => 540 + side * (x - 540);
    const body = () => {
      g.beginPath();
      g.moveTo(X(436), 150);
      g.bezierCurveTo(X(330), 172, X(190), 196, X(118), 248);
      g.bezierCurveTo(X(70), 284, X(52), 340, X(46), 420);
      g.lineTo(X(30), h);
      g.lineTo(X(540), h);
      g.lineTo(X(540), 700);
      g.lineTo(X(476), 470);
      g.lineTo(X(398), 392);
      g.lineTo(X(452), 360);
      g.closePath();
    };
    body();
    g.fillStyle = grey(0.09);
    g.fill();
    g.save();
    body();
    g.clip();
    gr = g.createRadialGradient(X(220), 236, 10, X(220), 300, 330);
    gr.addColorStop(0, grey(0.46));
    gr.addColorStop(0.5, grey(0.2));
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    // lapela: faixa um pouco mais clara ao longo da abertura
    g.fillStyle = grey(0.17);
    g.beginPath();
    g.moveTo(X(436), 152);
    g.lineTo(X(452), 360);
    g.lineTo(X(398), 392);
    g.lineTo(X(476), 470);
    g.lineTo(X(540), 700);
    g.lineTo(X(470), 700);
    g.lineTo(X(360), 410);
    g.lineTo(X(400), 360);
    g.lineTo(X(392), 170);
    g.closePath();
    g.fill();
    g.restore();
    // luz de recorte no ombro e na borda da lapela
    g.strokeStyle = grey(0.62);
    g.lineWidth = 7;
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(X(436), 150);
    g.bezierCurveTo(X(330), 172, X(190), 196, X(118), 248);
    g.bezierCurveTo(X(70), 284, X(52), 340, X(46), 420);
    g.lineTo(X(36), 760);
    g.stroke();
    g.strokeStyle = grey(0.52);
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(X(436), 152);
    g.lineTo(X(452), 360);
    g.lineTo(X(398), 392);
    g.lineTo(X(476), 470);
    g.lineTo(X(540), 700);
    g.stroke();
  }
  // lenço no bolso e botões
  g.fillStyle = grey(0.85);
  g.beginPath();
  g.moveTo(232, 610);
  g.lineTo(318, 592);
  g.lineTo(300, 640);
  g.lineTo(240, 648);
  g.closePath();
  g.fill();
  g.fillStyle = grey(0.42);
  [820, 1000].forEach((y) => {
    g.beginPath();
    g.arc(540, y, 11, 0, TAU);
    g.fill();
  });
  // a figura some no preto embaixo
  gr = g.createLinearGradient(0, 760, 0, h);
  gr.addColorStop(0, 'rgba(0,0,0,0)');
  gr.addColorStop(1, 'rgba(0,0,0,0.92)');
  g.fillStyle = gr;
  g.fillRect(0, 760, w, h - 760);

  // retícula: um ponto por célula, área proporcional à luz
  const data = g.getImageData(0, 0, w, h).data;
  const dst = makeCanvas(w, h);
  const d = dst.getContext('2d');
  d.fillStyle = '#F2F2F2';
  const step = 12;
  for (let y = step / 2; y < h; y += step) {
    const row = Math.floor(y / step);
    const off = row % 2 ? step / 2 : 0; // grade em quincôncio, como impressão
    for (let x = step / 2 + off; x < w; x += step) {
      let sum = 0;
      for (let dy = -3; dy <= 3; dy += 3) {
        for (let dx = -3; dx <= 3; dx += 3) {
          const px = Math.min(w - 1, Math.max(0, Math.round(x + dx)));
          const py = Math.min(h - 1, Math.max(0, Math.round(y + dy)));
          sum += data[(py * w + px) * 4];
        }
      }
      const lum = sum / 9 / 255;
      const r = step * 0.62 * Math.pow(lum, 0.85);
      if (r < 0.7) continue;
      d.beginPath();
      d.arc(x, y, r, 0, TAU);
      d.fill();
    }
  }
  return dst;
}
